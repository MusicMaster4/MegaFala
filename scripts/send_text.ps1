param(
  [Parameter(Mandatory = $true)]
  [string]$EncodedText
)

try {
  $Text = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($EncodedText))
} catch {
  throw "Falha ao decodificar o texto em UTF-8 para envio."
}

if ([string]::IsNullOrEmpty($Text)) {
  exit 0
}

Add-Type -AssemblyName System.Windows.Forms

function Invoke-ClipboardAction {
  param(
    [Parameter(Mandatory = $true)]
    [scriptblock]$Action,

    [Parameter(Mandatory = $true)]
    [string]$Operation
  )

  $lastError = $null
  for ($attempt = 0; $attempt -lt 6; $attempt++) {
    try {
      return & $Action
    } catch {
      $lastError = $_
      Start-Sleep -Milliseconds (40 + ($attempt * 30))
    }
  }

  throw "Falha ao acessar o clipboard durante '$Operation': $($lastError.Exception.Message)"
}

$previousClipboard = $null
$hadClipboard = $false

try {
  $previousClipboard = Invoke-ClipboardAction -Operation 'get-data' -Action {
    [System.Windows.Forms.Clipboard]::GetDataObject()
  }
  $hadClipboard = $previousClipboard -ne $null
} catch {
  $previousClipboard = $null
  $hadClipboard = $false
}

try {
  Invoke-ClipboardAction -Operation 'set-text' -Action {
    [System.Windows.Forms.Clipboard]::SetText($Text)
  } | Out-Null
  Start-Sleep -Milliseconds 120
  [System.Windows.Forms.SendKeys]::SendWait('^v')
  Start-Sleep -Milliseconds 220
} finally {
  try {
    if ($hadClipboard) {
      Invoke-ClipboardAction -Operation 'restore-data' -Action {
        [System.Windows.Forms.Clipboard]::SetDataObject($previousClipboard, $true)
      } | Out-Null
    } else {
      Invoke-ClipboardAction -Operation 'clear' -Action {
        [System.Windows.Forms.Clipboard]::Clear()
      } | Out-Null
    }
  } catch {
    # Best effort: a falha em restaurar o clipboard nao pode quebrar a colagem.
  }
}
