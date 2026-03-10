$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$pythonExe = Join-Path $projectRoot '.venv\Scripts\python.exe'

if (-not (Test-Path $pythonExe)) {
  throw "Python virtualenv nao encontrado em .venv. Rode 'python -m venv .venv' e instale as dependencias antes do build."
}

$pyInstallerCheck = & $pythonExe -c "import importlib.util, sys; sys.exit(0 if importlib.util.find_spec('PyInstaller') else 1)"
if ($LASTEXITCODE -ne 0) {
  throw "PyInstaller nao encontrado na .venv. Rode '.\\.venv\\Scripts\\python.exe -m pip install pyinstaller' antes do build."
}

$distPath = Join-Path $projectRoot 'build\python-dist'
$workPath = Join-Path $projectRoot 'build\pyinstaller\work'
$specPath = Join-Path $projectRoot 'build\pyinstaller\spec'

if (Test-Path $distPath) {
  Remove-Item $distPath -Recurse -Force
}

if (Test-Path (Split-Path $workPath -Parent)) {
  Remove-Item (Split-Path $workPath -Parent) -Recurse -Force
}

New-Item -ItemType Directory -Path $distPath | Out-Null
New-Item -ItemType Directory -Path $workPath | Out-Null
New-Item -ItemType Directory -Path $specPath | Out-Null

$commonArgs = @(
  '-m', 'PyInstaller',
  '--noconfirm',
  '--clean',
  '--distpath', $distPath,
  '--workpath', $workPath,
  '--specpath', $specPath,
  '--additional-hooks-dir', (Join-Path $PSScriptRoot 'pyinstaller-hooks')
)

$cudaCollectArgs = @()
$optionalCollectModules = @(
  'nvidia.cublas',
  'nvidia.cudnn',
  'nvidia.cuda_runtime'
)

foreach ($module in $optionalCollectModules) {
  & $pythonExe -c "import importlib.util, sys; sys.exit(0 if importlib.util.find_spec('$module') else 1)"
  if ($LASTEXITCODE -eq 0) {
    $cudaCollectArgs += @('--collect-all', $module)
  }
}

& $pythonExe @commonArgs @cudaCollectArgs `
  '--name' 'dictation_service' `
  '--hidden-import' 'sounddevice' `
  '--collect-all' 'faster_whisper' `
  '--collect-all' 'ctranslate2' `
  '--collect-all' 'tokenizers' `
  '--collect-all' 'huggingface_hub' `
  '--collect-all' 'sounddevice' `
  '--collect-binaries' 'sounddevice' `
  'python\dictation_service.py'

if ($LASTEXITCODE -ne 0) {
  throw 'Falha ao gerar dictation_service.exe'
}

& $pythonExe @commonArgs `
  '--name' 'hotkey_listener' `
  '--collect-submodules' 'pynput' `
  'python\hotkey_listener.py'

if ($LASTEXITCODE -ne 0) {
  throw 'Falha ao gerar hotkey_listener.exe'
}

Write-Host "Workers Python gerados em $distPath"
