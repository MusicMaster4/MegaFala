import json
import math
import os
import queue
import site
import sys
import threading
import time
import io
from collections import deque
from pathlib import Path
from typing import Optional

import numpy as np
import sounddevice as sd
import webrtcvad
from dotenv import load_dotenv


def _candidate_cuda_dirs() -> list[Path]:
    candidates: list[Path] = []

    for key, value in os.environ.items():
        if key == "CUDA_PATH" or key.startswith("CUDA_PATH_V"):
            candidates.append(Path(value) / "bin")

    prefixes = {
        Path(sys.prefix),
        Path(sys.base_prefix),
        Path(__file__).resolve().parents[1] / ".venv",
    }
    site_packages = set()
    for prefix in prefixes:
        site_packages.add(prefix / "Lib" / "site-packages")

    try:
        for package_dir in site.getsitepackages():
            site_packages.add(Path(package_dir))
    except AttributeError:
        pass

    for package_dir in site_packages:
        candidates.append(package_dir / "nvidia" / "cublas" / "bin")
        candidates.append(package_dir / "nvidia" / "cudnn" / "bin")
        candidates.append(package_dir / "ctranslate2")

    unique_candidates: list[Path] = []
    seen: set[str] = set()
    for candidate in candidates:
        key = str(candidate.resolve()) if candidate.exists() else str(candidate)
        if key in seen:
            continue
        seen.add(key)
        unique_candidates.append(candidate)

    return unique_candidates


def _bootstrap_windows_cuda_runtime() -> list[str]:
    if os.name != "nt":
        return []

    registered: list[str] = []
    current_path = os.environ.get("PATH", "")

    for directory in _candidate_cuda_dirs():
        if not directory.exists():
            continue

        try:
            os.add_dll_directory(str(directory))
        except (AttributeError, FileNotFoundError, OSError):
            continue

        directory_str = str(directory)
        if directory_str not in current_path:
            current_path = f"{directory_str}{os.pathsep}{current_path}" if current_path else directory_str
        registered.append(directory_str)

    if registered:
        os.environ["PATH"] = current_path

    return registered


REGISTERED_CUDA_DIRS = _bootstrap_windows_cuda_runtime()

import ctranslate2
from faster_whisper import WhisperModel
from faster_whisper.tokenizer import _LANGUAGE_CODES

load_dotenv()

DEFAULT_ALLOWED_LANGUAGES = ("pt", "en")
SUPPORTED_LANGUAGES = tuple(dict.fromkeys(_LANGUAGE_CODES))


def _configure_stdio() -> None:
    for stream_name in ("stdin", "stdout", "stderr"):
        stream = getattr(sys, stream_name, None)
        if stream is None:
            continue

        try:
            stream.reconfigure(encoding="utf-8", errors="replace")
            continue
        except (AttributeError, ValueError):
            pass

        buffer = getattr(stream, "buffer", None)
        if buffer is None:
            continue

        setattr(
            sys,
            stream_name,
            io.TextIOWrapper(
                buffer,
                encoding="utf-8",
                errors="replace",
                line_buffering=stream_name != "stdin",
            ),
        )


_configure_stdio()


def normalize_languages(values) -> list[str]:
    if isinstance(values, str):
        raw_values = [value.strip().lower() for value in values.split(",")]
    else:
        raw_values = [str(value).strip().lower() for value in values]

    languages = [value for value in raw_values if value in SUPPORTED_LANGUAGES]
    return list(dict.fromkeys(languages)) or list(DEFAULT_ALLOWED_LANGUAGES)


class DictationService:
    def __init__(self) -> None:
        self.sample_rate = 16000
        self.frame_ms = 30
        self.frame_samples = int(self.sample_rate * self.frame_ms / 1000)
        self.vad = webrtcvad.Vad(2)
        self.model_name = os.getenv("WHISPER_MODEL", "small")
        self.model_dir = os.getenv("WHISPER_MODEL_DIR")
        self.requested_device = os.getenv("WHISPER_DEVICE", "auto").lower()
        self.compute_type = os.getenv("WHISPER_COMPUTE_TYPE")
        self.allowed_languages = normalize_languages(os.getenv("ALLOWED_LANGUAGES", "pt,en"))
        self.stop_event = threading.Event()
        self.audio_queue: queue.Queue[bytes] = queue.Queue()
        self.segment_queue: queue.Queue[Optional[tuple[int, np.ndarray]]] = queue.Queue()
        self.processing_thread = threading.Thread(target=self._process_audio_loop, daemon=True)
        self.transcriber_thread = threading.Thread(target=self._transcribe_loop, daemon=True)
        self.stream: Optional[sd.InputStream] = None
        self.listening = False
        self.triggered = False
        self.ring_buffer = deque(maxlen=8)
        self.voiced_frames = []
        self.silence_frames = 0
        self.pending_segments: list[np.ndarray] = []
        self.max_segment_frames = int((12 * 1000) / self.frame_ms)
        self.min_segment_frames = int(220 / self.frame_ms)
        self.model = None
        self.active_device = "cpu"
        self.device_note = ""
        self.current_session_id: Optional[int] = None
        self.canceled_session_ids: set[int] = set()

    def emit(self, event_type: str, payload: Optional[dict] = None) -> None:
        print(json.dumps({"type": event_type, "payload": payload or {}}, ensure_ascii=False), flush=True)

    def boot(self) -> None:
        self.emit("state", {"phase": "booting", "listening": False})
        preferred_device = self._resolve_device()
        preferred_compute_type = self._resolve_compute_type(preferred_device)

        try:
            self.model = self._load_model(preferred_device, preferred_compute_type)
            self._warmup_backend()
        except Exception as error:
            if not self._should_fallback_to_cpu(error):
                raise

            self.device_note = (
                "GPU detectada, mas o runtime CUDA/cuBLAS compativel com o CTranslate2 nao esta disponivel. "
                "Usando CPU automaticamente."
            )
            self.emit("warning", {"message": self.device_note})
            self.model = self._load_model("cpu", self._resolve_compute_type("cpu"))

        self.processing_thread.start()
        self.transcriber_thread.start()
        self.emit(
            "ready",
            {
                "model": self.model_name,
                "device": self.active_device,
                "note": self.device_note,
            },
        )

    def _load_model(self, device: str, compute_type: str) -> WhisperModel:
        self.active_device = device
        return WhisperModel(
            self.model_name,
            device=device,
            compute_type=compute_type,
            cpu_threads=max(1, (os.cpu_count() or 4) // 2),
            download_root=self.model_dir,
        )

    def _resolve_device(self) -> str:
        if self.requested_device in {"cpu", "cuda"}:
            return self.requested_device

        try:
            cuda_count = ctranslate2.get_cuda_device_count()
        except Exception:
            cuda_count = 0

        if cuda_count > 0:
            if REGISTERED_CUDA_DIRS:
                self.device_note = f"GPU NVIDIA detectada ({cuda_count}), backend CUDA preparado."
            else:
                self.device_note = f"GPU NVIDIA detectada ({cuda_count}), tentando backend CUDA."
            return "cuda"

        self.device_note = "Nenhuma GPU CUDA utilizavel foi detectada. Usando CPU."
        return "cpu"

    def _resolve_compute_type(self, device: str) -> str:
        if self.compute_type:
            return self.compute_type

        return "float16" if device == "cuda" else "int8"

    def _warmup_backend(self) -> None:
        warmup_audio = np.zeros(self.sample_rate, dtype=np.float32)
        segments, _info = self._transcribe_segment(warmup_audio, self.allowed_languages[0])
        for _piece in segments:
            pass

    def _should_fallback_to_cpu(self, error: Exception) -> bool:
        message = str(error).lower()
        return (
            self.active_device != "cpu"
            and (
                "cublas" in message
                or "cudnn" in message
                or "cuda" in message
                or "cannot be loaded" in message
            )
        )

    def _detect_allowed_language(self, segment: np.ndarray) -> tuple[str, float]:
        if len(self.allowed_languages) == 1:
            return self.allowed_languages[0], 1.0

        try:
            detected_language, probability, all_probabilities = self.model.detect_language(audio=segment)
            filtered = [
                (self._normalize_language(language), score)
                for language, score in all_probabilities
                if self._normalize_language(language) in self.allowed_languages
            ]
            if filtered:
                return max(filtered, key=lambda item: item[1])

            normalized_detected = self._normalize_language(detected_language)
            if normalized_detected in self.allowed_languages:
                return normalized_detected, probability
        except Exception:
            pass

        return self.allowed_languages[0], 0.0

    def _transcribe_segment(self, segment: np.ndarray, language: str):
        return self.model.transcribe(
            segment,
            language=language,
            beam_size=5,
            best_of=5,
            vad_filter=False,
            condition_on_previous_text=False,
            temperature=0.0,
            compression_ratio_threshold=2.4,
            no_speech_threshold=0.45,
        )

    @staticmethod
    def _coerce_session_id(payload: Optional[dict]) -> Optional[int]:
        if not payload:
            return None

        value = payload.get("session_id")
        if value is None:
            return None

        try:
            session_id = int(value)
        except (TypeError, ValueError):
            return None

        return session_id if session_id > 0 else None

    def _close_stream(self) -> None:
        if self.stream is None:
            return

        self.stream.stop()
        self.stream.close()
        self.stream = None

    def _clear_audio_queue(self) -> None:
        while True:
            try:
                self.audio_queue.get_nowait()
            except queue.Empty:
                break

    def start(self, payload: Optional[dict] = None) -> None:
        if self.listening:
            return

        session_id = self._coerce_session_id(payload)
        if session_id is not None:
            self.current_session_id = session_id
            self.canceled_session_ids.discard(session_id)

        self._reset_segment_state()
        self.pending_segments = []
        self._clear_audio_queue()
        self.stream = sd.InputStream(
            samplerate=self.sample_rate,
            blocksize=self.frame_samples,
            channels=1,
            dtype="int16",
            callback=self._audio_callback,
        )
        self.stream.start()
        self.listening = True
        self.emit(
            "state",
            {"phase": "listening", "listening": True, "session_id": self.current_session_id},
        )

    def stop(self, payload: Optional[dict] = None) -> None:
        if not self.listening:
            return

        session_id = self._coerce_session_id(payload) or self.current_session_id
        self.listening = False
        self._close_stream()

        self._flush_open_segment()
        self.emit("partial", {"text": "", "session_id": session_id})
        if self._queue_pending_transcription(session_id):
            self.emit("state", {"phase": "transcribing", "listening": False, "session_id": session_id})
        else:
            if self.current_session_id == session_id:
                self.current_session_id = None
            self.emit("state", {"phase": "idle", "listening": False, "session_id": session_id})

    def cancel(self, payload: Optional[dict] = None) -> None:
        session_id = self._coerce_session_id(payload) or self.current_session_id
        if session_id is not None:
            self.canceled_session_ids.add(session_id)

        self.listening = False
        self._close_stream()
        self._reset_segment_state()
        self.pending_segments = []
        self._clear_audio_queue()
        if self.current_session_id == session_id:
            self.current_session_id = None

        self.emit("partial", {"text": "", "session_id": session_id})
        self.emit("state", {"phase": "idle", "listening": False, "session_id": session_id})

    def configure(self, payload: Optional[dict]) -> None:
        payload = payload or {}
        self.allowed_languages = normalize_languages(payload.get("allowed_languages", self.allowed_languages))
        self.emit(
            "warning",
            {
                "message": f"Idiomas ativos: {', '.join(language.upper() for language in self.allowed_languages)}.",
            },
        )

    def shutdown(self) -> None:
        self.stop()
        self.stop_event.set()
        self.segment_queue.put(None)

    def _audio_callback(self, indata, _frames, _time_info, status) -> None:
        if status:
            self.emit("warning", {"message": str(status)})

        self.audio_queue.put(indata.copy().reshape(-1).tobytes())

    def _reset_segment_state(self) -> None:
        self.triggered = False
        self.ring_buffer.clear()
        self.voiced_frames = []
        self.silence_frames = 0

    def _flush_open_segment(self) -> None:
        if self.triggered and len(self.voiced_frames) >= self.min_segment_frames:
            self._queue_segment(self.voiced_frames)
        self._reset_segment_state()

    def _process_audio_loop(self) -> None:
        while not self.stop_event.is_set():
            try:
                frame = self.audio_queue.get(timeout=0.2)
            except queue.Empty:
                continue

            if not self.listening:
                continue

            self._process_frame(frame)

    def _process_frame(self, frame: bytes) -> None:
        is_speech = self.vad.is_speech(frame, self.sample_rate)
        samples = np.frombuffer(frame, dtype=np.int16)
        if samples.size:
            rms = float(np.sqrt(np.mean(np.square(samples.astype(np.float32)))))
            level = min(1.0, math.sqrt((rms / 32768.0) * 14.0))
        else:
            level = 0.0

        if not is_speech:
            level *= 0.12

        self.emit(
            "level",
            {
                "level": round(level, 4),
                "session_id": self.current_session_id,
            },
        )

        if not self.triggered:
            self.ring_buffer.append((frame, is_speech))
            voiced_count = sum(1 for _, voiced in self.ring_buffer if voiced)
            threshold = max(1, int(len(self.ring_buffer) * 0.6))
            if len(self.ring_buffer) >= 3 and voiced_count >= threshold:
                self.triggered = True
                self.voiced_frames = [buffered for buffered, _ in self.ring_buffer]
                self.ring_buffer.clear()
                self.silence_frames = 0
                self.emit(
                    "state",
                    {
                        "phase": "listening",
                        "listening": True,
                        "session_id": self.current_session_id,
                    },
                )
            return

        self.voiced_frames.append(frame)
        self.silence_frames = 0 if is_speech else self.silence_frames + 1

        if self.silence_frames >= 12 or len(self.voiced_frames) >= self.max_segment_frames:
            frames = self.voiced_frames
            self._reset_segment_state()
            if len(frames) >= self.min_segment_frames:
                self._queue_segment(frames)

    def _queue_segment(self, frames) -> None:
        audio = np.frombuffer(b"".join(frames), dtype=np.int16).astype(np.float32) / 32768.0
        self.pending_segments.append(audio)

    def _queue_pending_transcription(self, session_id: Optional[int]) -> bool:
        if not self.pending_segments or session_id is None:
            return False

        if len(self.pending_segments) == 1:
            merged_audio = self.pending_segments[0]
        else:
            # Preserve short pauses between detected speech chunks without
            # transcribing while the user is still holding the hotkey.
            gap = np.zeros(int(self.sample_rate * 0.18), dtype=np.float32)
            merged_parts = []
            for index, segment in enumerate(self.pending_segments):
                if index:
                    merged_parts.append(gap)
                merged_parts.append(segment)
            merged_audio = np.concatenate(merged_parts)

        self.pending_segments = []
        self.segment_queue.put((session_id, merged_audio))
        return True

    def _transcribe_loop(self) -> None:
        while not self.stop_event.is_set():
            queued_segment = self.segment_queue.get()
            if queued_segment is None:
                break
            session_id, segment = queued_segment

            if session_id in self.canceled_session_ids:
                continue

            selected_language = self.allowed_languages[0]
            language_confidence = 1.0

            try:
                audio_duration_ms = round((len(segment) / self.sample_rate) * 1000, 1)
                started_at = time.perf_counter()
                selected_language, language_confidence = self._detect_allowed_language(segment)

                try:
                    segments, info = self._transcribe_segment(segment, selected_language)
                except Exception as error:
                    if not self._should_fallback_to_cpu(error):
                        raise

                    self.emit(
                        "warning",
                        {
                            "message": "Backend CUDA falhou durante a transcricao. Recarregando o modelo em CPU automaticamente.",
                        },
                    )
                    self.model = self._load_model("cpu", self._resolve_compute_type("cpu"))
                    self.device_note = "GPU indisponivel em runtime. Transcricao continuara em CPU."
                    segments, info = self._transcribe_segment(segment, selected_language)

                parts = []
                for piece in segments:
                    if session_id in self.canceled_session_ids:
                        parts = []
                        break
                    cleaned = piece.text.strip()
                    if not cleaned:
                        continue
                    parts.append(cleaned)
                    self.emit("partial", {"text": " ".join(parts), "session_id": session_id})
                transcription_ms = round((time.perf_counter() - started_at) * 1000, 1)

                text = " ".join(parts).strip()
                if text and session_id not in self.canceled_session_ids:
                    language = self._normalize_language(getattr(info, "language", None)) or selected_language
                    if language not in self.allowed_languages:
                        language = selected_language

                    self.emit(
                        "final",
                        {
                            "model": self.model_name,
                            "text": text,
                            "language": language,
                            "confidence": getattr(info, "language_probability", language_confidence),
                            "transcription_ms": transcription_ms,
                            "audio_duration_ms": audio_duration_ms,
                            "session_id": session_id,
                        },
                    )
            except Exception as error:
                self.emit("error", {"message": f"Erro na transcricao: {error}"})
            finally:
                if self.current_session_id == session_id and not self.listening:
                    self.current_session_id = None

                self.emit("partial", {"text": "", "session_id": session_id})
                self.emit(
                    "state",
                    {
                        "phase": "listening" if self.listening else "idle",
                        "listening": self.listening,
                        "session_id": session_id,
                    },
                )
                self.canceled_session_ids.discard(session_id)

    @staticmethod
    def _normalize_language(language: Optional[str]) -> str:
        if not language:
            return "unknown"

        normalized = language.lower()
        if normalized.startswith("pt"):
            return "pt"
        if normalized.startswith("en"):
            return "en"
        return normalized


def main() -> int:
    service = DictationService()

    try:
        service.boot()
    except Exception as error:
        service.emit("error", {"message": f"Falha ao carregar Faster-Whisper: {error}"})
        return 1

    for raw_line in sys.stdin:
        line = raw_line.strip()
        if not line:
            continue

        try:
            command = json.loads(line)
        except json.JSONDecodeError:
            service.emit("error", {"message": "Comando JSON invalido recebido pelo worker."})
            continue

        command_type = command.get("type")
        payload = command.get("payload")

        try:
            if command_type == "start":
                service.start(payload)
            elif command_type == "stop":
                service.stop(payload)
            elif command_type == "cancel":
                service.cancel(payload)
            elif command_type == "configure":
                service.configure(payload)
            elif command_type == "shutdown":
                service.shutdown()
                break
        except Exception as error:
            service.emit("error", {"message": f"Falha ao executar '{command_type}': {error}"})

    service.shutdown()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
