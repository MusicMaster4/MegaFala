# Compilacao do MegaFala

Este projeto agora usa a mesma base de codigo para `Windows` e `macOS`.

## Como o app final funciona

- a interface roda em `Electron`
- o usuario final nao precisa instalar `Node.js`, `npm` ou `Next.js`
- a transcricao roda em um worker Python empacotado com `PyInstaller`
- o listener global de atalho tambem roda em um worker Python empacotado
- o app final baixa e guarda os modelos Whisper no computador do usuario

## Sistema de instalacao dos modelos

O comportamento atual e este:

1. O modelo padrao do app e o `small`, tratado na interface como o perfil equilibrado.
2. No primeiro boot do app, se esse modelo ainda nao existir localmente, o worker de transcricao faz o download automaticamente.
3. Quando o usuario troca para outro modelo nas configuracoes, o app reinicia o worker com o modelo escolhido.
4. Se esse modelo novo ainda nao estiver instalado, o `faster-whisper` baixa automaticamente o modelo antes de concluir a carga.
5. Depois do primeiro download, o modelo fica salvo localmente e nao precisa ser baixado de novo.

Pontos importantes:

- isso funciona no app compilado, sem precisar de Node instalado no computador do usuario
- o download acontece pelo backend Python, usando `faster-whisper` + `huggingface_hub`
- hoje o app ja faz a instalacao sob demanda; o que ainda nao existe e uma barra de progresso dedicada por modelo
- enquanto o modelo estiver sendo baixado/carregado, o app fica em estado de carregamento

## Onde os modelos e dados ficam

### Windows

- preferencias e historico:
  `%APPDATA%/MegaFala/store/settings.json`
- modelos:
  `%APPDATA%/MegaFala/models`

### macOS

- preferencias e historico:
  `~/Library/Application Support/MegaFala/store/settings.json`
- modelos:
  `~/Library/Application Support/MegaFala/models`

## Atalhos padrao

### Windows

- ditado: `Ctrl+Win`
- hands-free: segure `Ctrl+Win` e aperte `Space`
- colar ultima transcricao: `Ctrl+Alt+V`

### macOS

- ditado: `Control+Command`
- hands-free: segure `Control+Command` e aperte `Space`
- colar ultima transcricao: `Command+Option+V`

Se `FLOW_HOTKEY` estiver vazio, o app usa automaticamente o atalho padrao da plataforma.

## Build para Windows

Esse build deve ser executado em uma maquina Windows.

### Pre-requisitos

- `Python 3.12`
- `Node.js 20+`
- `npm`

Recomendado:

- ativar `Developer Mode` no Windows
ou
- abrir o terminal como administrador

Isso evita erro com links simbolicos durante o `electron-builder`.

### Instalar dependencias

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r .\python\requirements.txt
python -m pip install pyinstaller
npm install
```

### Validar o codigo

```powershell
npm run check
```

### Gerar os workers Python

```powershell
npm run build:python
```

Isso gera:

- `build/python-dist/dictation_service/`
- `build/python-dist/hotkey_listener/`

### Gerar o instalador Windows

```powershell
npm run dist:win
```

Saidas:

- app desempacotado: `dist/win-unpacked/`
- instalador NSIS: `dist/`

### Erro comum no Windows

Se aparecer algo como:

```text
Cannot create symbolic link
O cliente nao tem o privilegio necessario
```

faça um destes:

1. ative `Developer Mode`
2. rode o terminal como administrador
3. execute `npm run dist:win` novamente

## Build para macOS

Esse build deve ser executado em uma maquina macOS. O `electron-builder` nao gera um `.app` ou `.dmg` macOS funcional a partir de uma maquina Windows comum.

Para este projeto, o caminho mais seguro e gerar dois builds separados:

- `x64`, para Macs Intel
- `arm64`, para Macs Apple Silicon (`M1`, `M2`, `M3`, etc.)

Isso e melhor do que forcar um pacote universal agora porque o app embute workers Python do `PyInstaller`, e esses binarios nativos precisam ser compilados para a arquitetura correta.

### Pre-requisitos

- `Python 3.12`
- `Node.js 20+`
- `npm`
- `Xcode Command Line Tools`

Instale as ferramentas da Apple:

```bash
xcode-select --install
```

### Permissoes do macOS

Para o app funcionar corretamente depois de compilado, o macOS pode pedir:

- `Accessibility`, para o atalho global e para enviar `Command+V`
- `Microphone`, para capturar audio

Sem isso, o app pode abrir, mas o atalho global ou a colagem automatica podem falhar.

### Instalar dependencias

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r ./python/requirements.txt
python -m pip install pyinstaller
npm install
chmod +x ./scripts/build-python.sh
```

Observacao:

- `python/requirements.txt` agora instala `nvidia-cublas-cu12` apenas no Windows
- no macOS, o worker usa CPU, entao essa dependencia nao deve ser instalada

### Validar o codigo

```bash
npm run check
```

### Gerar os workers Python

```bash
npm run build:python
```

No macOS, esse comando usa `scripts/build-python.sh`.

Se voce quiser fixar a arquitetura explicitamente durante o build local:

```bash
PYINSTALLER_TARGET_ARCH=x86_64 npm run build:python
```

ou:

```bash
PYINSTALLER_TARGET_ARCH=arm64 npm run build:python
```

### Gerar o pacote macOS

```bash
npm run dist:mac
```

Para gerar builds especificos por arquitetura:

```bash
npm run dist:mac:x64
```

```bash
npm run dist:mac:arm64
```

Saidas esperadas:

- app empacotado: `dist/mac/`
- imagem `.dmg`: `dist/`
- `.zip`: `dist/`

### Assinatura e notarizacao

Para teste local, o build pode ser gerado sem assinatura.

Para distribuicao externa no macOS, o ideal e configurar:

- certificado de assinatura Apple
- notarizacao da Apple
- entitlement e hardened runtime de acordo com a assinatura do app final

Se voce for distribuir fora da sua propria maquina, esse e o passo seguinte.

## GitHub Actions para macOS

O workflow em `.github/workflows/build-macos.yml` gera:

- um build `x64` em runner Intel
- um build `arm64` em runner Apple Silicon

Fluxo:

1. instala `Node.js 20` e `Python 3.12`
2. instala dependencias Node e Python
3. compila os workers Python com `PyInstaller` na arquitetura nativa do runner
4. gera `dmg` e `zip` com `electron-builder`
5. valida a arquitetura dos binarios com `lipo`
6. publica os artefatos do job

Esse e o fluxo recomendado para este repositorio porque evita misturar um app Electron universal com subprocessos Python de arquitetura unica.

## Pipeline resumido

### Windows

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r .\python\requirements.txt
python -m pip install pyinstaller
npm install
npm run check
npm run dist:win
```

### macOS

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r ./python/requirements.txt
python -m pip install pyinstaller
npm install
chmod +x ./scripts/build-python.sh
npm run check
npm run dist:mac
```

## O que foi adaptado para funcionar nas duas plataformas

- o listener global de teclado agora usa `pynput`, em vez de uma implementacao presa ao Windows
- a colagem automatica usa `PowerShell` no Windows e `osascript` no macOS
- o build Python agora escolhe `PowerShell` ou `bash` conforme a plataforma
- o cache dos modelos foi movido para a pasta de dados do usuario, em vez de depender do cache global padrao do Hugging Face

## Limitacoes atuais

- o controle de ducking do audio do sistema continua ativo apenas no Windows
- no macOS, o app funciona sem esse ducking; a transcricao continua funcionando normalmente
- o download dos modelos ainda nao tem barra de progresso dedicada na interface
