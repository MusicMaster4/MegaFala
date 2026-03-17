# OpenFlow

OpenFlow is a desktop voice dictation app for Windows and macOS built with Electron on the UI layer and Faster-Whisper for local transcription.

It is designed for fast keyboard-free text capture, global shortcuts, a floating recording overlay, and local model execution with on-demand downloads.

## Highlights

- Local transcription powered by Faster-Whisper
- Electron desktop UI with history, diagnostics, settings, and dictionary rules
- Global dictation shortcut plus a paste-last shortcut
- Floating overlay with live activity feedback
- On-demand Whisper model downloads stored in the user data directory
- Separate Python workers for transcription and hotkey handling

## Platforms

- Windows
- macOS

## Platform Status

- Windows is the primary tested platform.
- macOS support exists in the codebase and CI packaging flow, but it has not been fully verified on a real Mac.
- The maintainer does not currently have access to macOS hardware, so treat macOS support as best effort until it is confirmed by external testing.

## Stack

- Electron
- Node.js
- Python 3.12
- Faster-Whisper
- PyInstaller

## Setup

1. Install Node.js 20+ and Python 3.12.
2. Create a virtual environment: `python -m venv .venv` on Windows or `python3 -m venv .venv` on macOS.
3. Install Python dependencies: `.venv\Scripts\python.exe -m pip install -r python\requirements.txt` on Windows or `./.venv/bin/python -m pip install -r python/requirements.txt` on macOS.
4. Install Node dependencies: `npm ci`.
5. Copy `.env.example` to `.env`.
6. Start the app with `npm start`.

## Environment

Create a local `.env` file by copying [`.env.example`](./.env.example).

Recommended starting point:

```env
WHISPER_MODEL=small
WHISPER_DEVICE=auto
WHISPER_COMPUTE_TYPE=
FLOW_HOTKEY=
FLOW_PASTE_LAST_HOTKEY=
ALLOWED_LANGUAGES=en
INTERFACE_LANGUAGE=en
```

Variable reference:

- `WHISPER_MODEL`: default transcription model loaded at startup. Good default: `small`.
- `WHISPER_DEVICE`: `auto`, `cpu`, or `cuda`.
- `WHISPER_COMPUTE_TYPE`: optional override for Faster-Whisper compute mode. Leave empty unless you know you need a specific value.
- `WHISPER_CPU_THREADS`: optional CPU thread cap for local transcription.
- `FLOW_HOTKEY`: optional custom dictation shortcut. Leave empty to use the platform default.
- `FLOW_PASTE_LAST_HOTKEY`: optional custom shortcut for pasting the latest transcription.
- `ALLOWED_LANGUAGES`: comma-separated detection languages such as `en` or `en,pt`.
- `INTERFACE_LANGUAGE`: app UI language. Default is `en`.
- `PYTHON_BIN`: optional development override for the Python executable path.
- `WHISPER_MODEL_DIR`: optional custom directory for downloaded Whisper models.

If you do not need custom behavior, copy the example file and keep almost everything as-is.

## Available Scripts

- `npm start`: run the Electron app in development mode
- `npm run check`: syntax-check the tracked JavaScript files
- `npm run build:python`: package the Python workers with PyInstaller
- `npm run dist:win`: build the Windows desktop package
- `npm run dist:mac:x64`: build the macOS Intel package
- `npm run dist:mac:arm64`: build the macOS Apple Silicon package

## Repository Layout

- [`src/main`](./src/main): Electron main process, app state, worker orchestration, tray, shortcuts
- [`src/renderer`](./src/renderer): desktop UI, overlay UI, styles, translations
- [`python`](./python): transcription and hotkey worker code
- [`scripts`](./scripts): build and platform helper scripts
- [`.github/workflows`](./.github/workflows): CI packaging workflows for Windows and macOS

## Build Notes

Packaging instructions and output details are documented in [`BUILDING.md`](./BUILDING.md).

## Privacy

OpenFlow runs transcription locally on the user machine. Whisper models are downloaded when needed and then cached in the app's user data directory.

## License

This repository is source-available under the custom license in [`LICENSE`](./LICENSE). You may view, download, use, and modify the code, but you may not sell or resell OpenFlow or substantial portions of it.
