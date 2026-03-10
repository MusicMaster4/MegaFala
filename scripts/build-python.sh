#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ -x "$PROJECT_ROOT/.venv/bin/python" ]]; then
  PYTHON_EXE="$PROJECT_ROOT/.venv/bin/python"
else
  PYTHON_EXE="${PYTHON_BIN:-python3}"
fi

if ! "$PYTHON_EXE" -c "import importlib.util, sys; sys.exit(0 if importlib.util.find_spec('PyInstaller') else 1)"; then
  echo "PyInstaller nao encontrado. Rode 'python -m pip install pyinstaller' antes do build." >&2
  exit 1
fi

DIST_PATH="$PROJECT_ROOT/build/python-dist"
WORK_PATH="$PROJECT_ROOT/build/pyinstaller/work"
SPEC_PATH="$PROJECT_ROOT/build/pyinstaller/spec"
HOOKS_PATH="$PROJECT_ROOT/scripts/pyinstaller-hooks"
TARGET_ARCH="${PYINSTALLER_TARGET_ARCH:-}"

rm -rf "$DIST_PATH" "$PROJECT_ROOT/build/pyinstaller"
mkdir -p "$DIST_PATH" "$WORK_PATH" "$SPEC_PATH"

COMMON_ARGS=(
  -m PyInstaller
  --noconfirm
  --clean
  --distpath "$DIST_PATH"
  --workpath "$WORK_PATH"
  --specpath "$SPEC_PATH"
  --additional-hooks-dir "$HOOKS_PATH"
)

if [[ "$OSTYPE" == darwin* && -n "$TARGET_ARCH" ]]; then
  COMMON_ARGS+=(--target-arch "$TARGET_ARCH")
fi

"$PYTHON_EXE" "${COMMON_ARGS[@]}" \
  --name dictation_service \
  --collect-all faster_whisper \
  --collect-all ctranslate2 \
  --collect-all tokenizers \
  --collect-all huggingface_hub \
  --collect-all sounddevice \
  python/dictation_service.py

"$PYTHON_EXE" "${COMMON_ARGS[@]}" \
  --name hotkey_listener \
  --collect-submodules pynput \
  python/hotkey_listener.py

echo "Workers Python gerados em $DIST_PATH"
