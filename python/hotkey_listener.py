import json
import os
import sys
import threading

from dotenv import load_dotenv
from pynput import keyboard

load_dotenv()


class HotkeyListener:
    def __init__(self) -> None:
        self.hotkey = self._env_or_default("FLOW_HOTKEY", self._default_hotkey())
        self.hands_free_hotkey = f"{self.hotkey}+space"
        self.paste_last_hotkey = self._env_or_default(
            "FLOW_PASTE_LAST_HOTKEY",
            self._default_paste_hotkey(),
        )
        self.stop_event = threading.Event()
        self.is_pressed = False
        self.paste_last_active = False
        self.paste_last_pending_emit = False
        self.active_mode = "hold"
        self.state_lock = threading.Lock()
        self.listener = None
        self.pressed_tokens: set[str] = set()
        self.hotkey_tokens = self._parse_shortcut(self.hotkey)
        self.paste_last_tokens = self._parse_shortcut(self.paste_last_hotkey)
        if not self.hotkey_tokens:
            raise RuntimeError("Atalho global invalido.")
        if not self.paste_last_tokens:
            raise RuntimeError("Atalho de colar a ultima transcricao invalido.")

    def emit(self, event_type: str, payload: dict | None = None) -> None:
        print(json.dumps({"type": event_type, "payload": payload or {}}, ensure_ascii=False), flush=True)

    def start(self) -> None:
        self.listener = keyboard.Listener(on_press=self._handle_press, on_release=self._handle_release)
        self.listener.start()
        self.emit(
            "ready",
            {
                "shortcut": self.hotkey,
                "paste_last_shortcut": self.paste_last_hotkey,
            },
        )

    def shutdown(self) -> None:
        self.stop_event.set()

    def cleanup(self) -> None:
        if self.listener is not None:
            self.listener.stop()
        self.is_pressed = False
        self.paste_last_active = False
        self.paste_last_pending_emit = False
        self.active_mode = "hold"
        self.pressed_tokens.clear()
        self.listener = None

    @staticmethod
    def _default_hotkey() -> str:
        return "ctrl+command" if sys.platform == "darwin" else "ctrl+windows"

    @staticmethod
    def _default_paste_hotkey() -> str:
        return "command+option+v" if sys.platform == "darwin" else "ctrl+alt+v"

    @staticmethod
    def _env_or_default(name: str, fallback: str) -> str:
        value = str(os.getenv(name, "") or "").strip().lower()
        return value or fallback

    @staticmethod
    def _normalize_token(token: str) -> str:
        value = str(token or "").strip().lower()
        aliases = {
            "control": "ctrl",
            "ctrl_l": "ctrl",
            "ctrl_r": "ctrl",
            "shift_l": "shift",
            "shift_r": "shift",
            "cmd": "command",
            "cmd_l": "command",
            "cmd_r": "command",
            "super": "command" if sys.platform == "darwin" else "windows",
            "super_l": "command" if sys.platform == "darwin" else "windows",
            "super_r": "command" if sys.platform == "darwin" else "windows",
            "option": "alt",
            "option_l": "alt",
            "option_r": "alt",
            "alt_l": "alt",
            "alt_r": "alt",
            "esc": "escape",
            "return": "enter",
        }
        return aliases.get(value, value)

    @classmethod
    def _parse_shortcut(cls, shortcut: str) -> set[str]:
        return {
            cls._normalize_token(part)
            for part in str(shortcut or "").split("+")
            if cls._normalize_token(part)
        }

    @classmethod
    def _key_to_tokens(cls, key) -> set[str]:
        tokens: set[str] = set()

        if isinstance(key, keyboard.KeyCode) and key.char:
            tokens.add(cls._normalize_token(key.char))
            return tokens

        if not isinstance(key, keyboard.Key):
            return tokens

        special_map = {
            keyboard.Key.ctrl: "ctrl",
            keyboard.Key.ctrl_l: "ctrl",
            keyboard.Key.ctrl_r: "ctrl",
            keyboard.Key.shift: "shift",
            keyboard.Key.shift_l: "shift",
            keyboard.Key.shift_r: "shift",
            keyboard.Key.alt: "alt",
            keyboard.Key.alt_l: "alt",
            keyboard.Key.alt_r: "alt",
            keyboard.Key.alt_gr: "alt",
            keyboard.Key.cmd: "command" if sys.platform == "darwin" else "windows",
            keyboard.Key.cmd_l: "command" if sys.platform == "darwin" else "windows",
            keyboard.Key.cmd_r: "command" if sys.platform == "darwin" else "windows",
            keyboard.Key.space: "space",
            keyboard.Key.esc: "escape",
        }
        token = special_map.get(key)
        if token:
            tokens.add(token)
            if token == "command" and sys.platform != "darwin":
                tokens.add("windows")
        return tokens

    def _handle_press(self, key) -> None:
        self._handle_key_event(key, is_press=True)

    def _handle_release(self, key) -> None:
        self._handle_key_event(key, is_press=False)

    def _handle_key_event(self, key, is_press: bool) -> None:
        key_tokens = self._key_to_tokens(key)
        if not key_tokens:
            return

        with self.state_lock:
            if is_press:
                already_pressed = key_tokens.issubset(self.pressed_tokens)
                self.pressed_tokens.update(key_tokens)
            else:
                already_pressed = False
                self.pressed_tokens.difference_update(key_tokens)

            if is_press and "escape" in key_tokens and not already_pressed:
                self.emit("cancel-requested", {"source": "escape"})

            combo_active = self.hotkey_tokens.issubset(self.pressed_tokens)
            paste_last_active = self.paste_last_tokens.issubset(self.pressed_tokens)
            wants_hands_free = "space" in self.pressed_tokens

            if paste_last_active and not self.paste_last_active:
                self.paste_last_active = True
                self.paste_last_pending_emit = True
            elif not paste_last_active and self.paste_last_active:
                self.paste_last_active = False

            # Only trigger the paste-after-history shortcut after every key from
            # that shortcut has been released, avoiding modifier leakage such as
            # Ctrl/Alt still being held when the app injects Ctrl+V.
            if self.paste_last_pending_emit and not (self.paste_last_tokens & self.pressed_tokens):
                self.paste_last_pending_emit = False
                self.emit("paste-last-requested", {"shortcut": self.paste_last_hotkey})

            if combo_active and not self.is_pressed:
                self.is_pressed = True
                self.active_mode = "hands-free" if wants_hands_free else "hold"
                self.emit("hotkey-pressed", {"shortcut": self.hotkey, "mode": self.active_mode})
                return

            if combo_active and self.is_pressed and self.active_mode != "hands-free" and wants_hands_free:
                self.active_mode = "hands-free"
                self.emit("hotkey-mode-changed", {"shortcut": self.hotkey, "mode": self.active_mode})
                return

            if not combo_active and self.is_pressed:
                self.is_pressed = False
                released_mode = self.active_mode
                self.active_mode = "hold"
                self.emit("hotkey-released", {"shortcut": self.hotkey, "mode": released_mode})


def main() -> int:
    listener = HotkeyListener()

    try:
        listener.start()
    except Exception as error:
        listener.emit("error", {"message": f"Falha ao registrar o atalho global: {error}"})
        return 1

    def stdin_loop() -> None:
        for raw_line in sys.stdin:
            line = raw_line.strip()
            if not line:
                continue

            try:
                command = json.loads(line)
            except json.JSONDecodeError:
                listener.emit("error", {"message": "Comando JSON invalido recebido pelo listener."})
                continue

            if command.get("type") == "shutdown":
                listener.shutdown()
                break

    reader_thread = threading.Thread(target=stdin_loop, daemon=True)
    reader_thread.start()

    while not listener.stop_event.wait(0.2):
        pass

    listener.cleanup()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
