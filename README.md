# MegaFala

App desktop para Windows MegaFala, com Electron na interface e Faster-Whisper rodando localmente.

## O que mudou

- captura somente enquanto o atalho global estiver pressionado
- seletor de modelos direto na interface
- estatisticas separadas por modelo, com media e total de transcricoes
- colagem via clipboard + `Ctrl+V`, sem digitacao lenta
- layout horizontal mais adequado para desktop

## Instalacao

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
npm install
pip install -r .\python\requirements.txt
```

No Windows, esse `requirements.txt` agora instala tambem o runtime `nvidia-cublas-cu12` usado pelo backend CUDA do CTranslate2.

## Arquivo `.env`

Edite [`.env`](H:/Python/Tools/Wispr%20Flow%20Clone/.env) se quiser trocar os defaults:

```dotenv
WHISPER_MODEL=medium
WHISPER_DEVICE=auto
WHISPER_COMPUTE_TYPE=
FLOW_HOTKEY=ctrl+windows
ALLOWED_LANGUAGES=pt,en
```

O modelo selecionado na interface passa a valer para as proximas execucoes, mesmo sem mexer no `.env`.

As transcricoes, estatisticas e preferencias salvas pela interface ficam persistidas em
`%APPDATA%/MegaFala/store/settings.json` e sao recarregadas ao abrir o app novamente.

## Executar

```powershell
.\.venv\Scripts\Activate.ps1
npm start
```

## Uso

1. Espere o estado ficar `Pronto`.
2. Abra o app onde voce quer colar o texto e deixe o foco no campo.
3. Segure `Ctrl+Win` enquanto fala.
4. Solte `Ctrl+Win` para transcrever e colar.
5. Para entrar em hands-free, use `Ctrl+Win+Space` ou aperte `Space` enquanto ainda estiver segurando `Ctrl+Win`.
6. No hands-free, pressione `Ctrl+Win` novamente para finalizar e transcrever.
7. Troque o modelo na lateral direita para comparar latencia media e qualidade.

## Observacoes

- se o runtime CUDA/cuBLAS compativel nao estiver disponivel, o app continua em CPU e mostra esse status no painel lateral
- os modelos mais lentos tendem a melhorar bastante a qualidade em portugues
