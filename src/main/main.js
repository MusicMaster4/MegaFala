const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(process.cwd(), '.env') });

const { app, BrowserWindow, clipboard, ipcMain, screen } = require('electron');
const { spawn } = require('child_process');
const readline = require('readline');

const DEFAULT_SHORTCUT = 'ctrl+shift+space';
const DEFAULT_LANGUAGES = ['pt', 'en'];
const DEFAULT_SHOW_OVERLAY_BAR = true;
const MAX_HISTORY = 100;
const SERVICE_SHUTDOWN_TIMEOUT_MS = 2500;
const OVERLAY_WIDTH = 304;
const OVERLAY_HEIGHT = 78;
const OVERLAY_MARGIN_BOTTOM = 22;
const MODEL_OPTIONS = [
  {
    id: 'tiny',
    label: 'Lite',
    description: 'Minima latencia para testes rapidos.',
  },
  {
    id: 'base',
    label: 'Rapido',
    description: 'Melhor que tiny, ainda bem agil.',
  },
  {
    id: 'small',
    label: 'Equilibrado',
    description: 'Bom meio-termo para uso diario.',
  },
  {
    id: 'medium',
    label: 'Preciso',
    description: 'Mais qualidade com latencia moderada.',
  },
  {
    id: 'large-v3',
    label: 'Maximo',
    description: 'Maior precisao, custo local mais alto.',
  },
];

let mainWindow = null;
let overlayWindow = null;
let serviceProcess = null;
let serviceReader = null;
let hotkeyProcess = null;
let hotkeyReader = null;
let serviceToken = 0;
let hotkeyToken = 0;
let serviceRestartVersion = 0;

function getDefaultModel() {
  return process.env.WHISPER_MODEL || 'medium';
}

function normalizeLanguages(input) {
  const values = Array.isArray(input)
    ? input
    : String(input || '')
        .split(',')
        .map((value) => value.trim());

  const languages = values.filter((value) => value === 'pt' || value === 'en');
  return languages.length > 0 ? [...new Set(languages)] : [...DEFAULT_LANGUAGES];
}

function normalizeModel(modelId) {
  const value = String(modelId || '').trim();
  return MODEL_OPTIONS.some((option) => option.id === value) ? value : getDefaultModel();
}

function getModelOption(modelId) {
  return MODEL_OPTIONS.find((option) => option.id === modelId) || null;
}

function getModelDisplayName(modelId) {
  return getModelOption(modelId)?.label || modelId || 'modelo';
}

function createEmptyStats() {
  return Object.fromEntries(
    MODEL_OPTIONS.map((option) => [
      option.id,
      {
        count: 0,
        totalMs: 0,
        averageMs: 0,
        lastMs: 0,
      },
    ]),
  );
}

function createEmptyUsageStats() {
  return {
    activeDays: [],
    totalWords: 0,
    totalAudioMs: 0,
    firstUsedAt: null,
  };
}

function isValidDayKey(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
}

function toDayKey(input = new Date()) {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function countWords(text) {
  const normalized = String(text || '').trim();
  return normalized ? normalized.split(/\s+/).length : 0;
}

function getDayDiff(previousDayKey, nextDayKey) {
  const previous = new Date(`${previousDayKey}T00:00:00`);
  const next = new Date(`${nextDayKey}T00:00:00`);

  return Math.round((next.getTime() - previous.getTime()) / 86400000);
}

function buildUsageSummary(usageStats) {
  const activeDays = usageStats.activeDays || [];
  let streakDays = 0;

  if (activeDays.length > 0) {
    streakDays = 1;
    for (let index = activeDays.length - 1; index > 0; index -= 1) {
      if (getDayDiff(activeDays[index - 1], activeDays[index]) !== 1) {
        break;
      }
      streakDays += 1;
    }
  }

  return {
    streakDays,
    totalDays: activeDays.length,
    totalWords: usageStats.totalWords || 0,
    averageWpm:
      usageStats.totalAudioMs > 0 ? (usageStats.totalWords * 60000) / usageStats.totalAudioMs : 0,
  };
}

function normalizeHistory(history) {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const text = String(entry.text || '').trim();
      if (!text) {
        return null;
      }

      const timestamp = String(entry.timestamp || '');
      return {
        model: normalizeModel(entry.model),
        text,
        language: String(entry.language || 'unknown'),
        transcriptionMs: Number(entry.transcriptionMs) || 0,
        audioDurationMs: Number(entry.audioDurationMs) || 0,
        wordCount: Number(entry.wordCount) || countWords(text),
        timestamp: timestamp || new Date().toISOString(),
      };
    })
    .filter(Boolean)
    .slice(0, MAX_HISTORY);
}

function normalizeUsageStats(stats) {
  const source = stats && typeof stats === 'object' ? stats : {};
  const activeDays = [...new Set((source.activeDays || []).map((value) => String(value).trim()))]
    .filter(isValidDayKey)
    .sort();

  return {
    activeDays,
    totalWords: Math.max(0, Number(source.totalWords) || 0),
    totalAudioMs: Math.max(0, Number(source.totalAudioMs) || 0),
    firstUsedAt: source.firstUsedAt ? String(source.firstUsedAt) : null,
  };
}

function recordUsage(usageStats, entry) {
  const dayKey = toDayKey(entry.timestamp) || toDayKey();
  const activeDays = dayKey ? [...new Set([...usageStats.activeDays, dayKey])].sort() : [...usageStats.activeDays];

  return {
    activeDays,
    totalWords: usageStats.totalWords + (Number(entry.wordCount) || 0),
    totalAudioMs: usageStats.totalAudioMs + Math.max(0, Number(entry.audioDurationMs) || 0),
    firstUsedAt: usageStats.firstUsedAt || entry.timestamp || new Date().toISOString(),
  };
}

function normalizeStats(stats) {
  const empty = createEmptyStats();
  const source = stats && typeof stats === 'object' ? stats : {};

  for (const option of MODEL_OPTIONS) {
    const raw = source[option.id] || {};
    const count = Number(raw.count) || 0;
    const totalMs = Number(raw.totalMs) || 0;
    const lastMs = Number(raw.lastMs) || 0;
    empty[option.id] = {
      count,
      totalMs,
      averageMs: count > 0 ? totalMs / count : 0,
      lastMs,
    };
  }

  return empty;
}

function getDefaultsFromEnv() {
  return {
    shortcut: String(process.env.FLOW_HOTKEY || DEFAULT_SHORTCUT).toLowerCase(),
    allowedLanguages: normalizeLanguages(process.env.ALLOWED_LANGUAGES || DEFAULT_LANGUAGES.join(',')),
    model: normalizeModel(getDefaultModel()),
    showOverlayBar: DEFAULT_SHOW_OVERLAY_BAR,
  };
}

const defaults = getDefaultsFromEnv();

const state = {
  engineReady: false,
  listening: false,
  phase: 'booting',
  shortcut: defaults.shortcut,
  allowedLanguages: defaults.allowedLanguages,
  partial: '',
  latestFinal: '',
  latestLanguage: null,
  model: defaults.model,
  availableModels: MODEL_OPTIONS,
  modelStats: createEmptyStats(),
  device: 'unknown',
  deviceNote: '',
  serviceOnline: false,
  hotkeyOnline: false,
  hotkeyPressed: false,
  pendingStartOnReady: false,
  switchingModel: false,
  notice: '',
  error: '',
  history: [],
  usageStats: createEmptyUsageStats(),
  showOverlayBar: defaults.showOverlayBar,
  pendingPaste: false,
};

function getProjectRoot() {
  return app.getAppPath();
}

function getPythonBin() {
  const venvPython = path.join(getProjectRoot(), '.venv', 'Scripts', 'python.exe');
  return process.env.PYTHON_BIN || (fs.existsSync(venvPython) ? venvPython : 'python');
}

function getSettingsPath() {
  return path.join(app.getPath('userData'), 'settings.json');
}

function loadUserSettings() {
  try {
    const raw = fs.readFileSync(getSettingsPath(), 'utf8');
    const parsed = JSON.parse(raw);
    return {
      allowedLanguages: normalizeLanguages(parsed.allowedLanguages),
      model: normalizeModel(parsed.model),
      modelStats: normalizeStats(parsed.modelStats),
      history: normalizeHistory(parsed.history),
      usageStats: normalizeUsageStats(parsed.usageStats),
      showOverlayBar:
        typeof parsed.showOverlayBar === 'boolean'
          ? parsed.showOverlayBar
          : defaults.showOverlayBar,
    };
  } catch (_error) {
    return {
      allowedLanguages: defaults.allowedLanguages,
      model: defaults.model,
      modelStats: createEmptyStats(),
      history: [],
      usageStats: createEmptyUsageStats(),
      showOverlayBar: defaults.showOverlayBar,
    };
  }
}

function saveUserSettings() {
  const payload = {
    allowedLanguages: state.allowedLanguages,
    model: state.model,
    modelStats: state.modelStats,
    history: state.history,
    usageStats: state.usageStats,
    showOverlayBar: state.showOverlayBar,
  };

  fs.mkdirSync(path.dirname(getSettingsPath()), { recursive: true });
  fs.writeFileSync(getSettingsPath(), JSON.stringify(payload, null, 2));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 840,
    minWidth: 980,
    minHeight: 720,
    autoHideMenuBar: true,
    title: 'Flow Local',
    backgroundColor: '#f4f1eb',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(getProjectRoot(), 'src', 'renderer', 'index.html'));
  mainWindow.on('closed', () => {
    mainWindow = null;
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}

function getOverlayBounds() {
  const point = screen.getCursorScreenPoint();
  const display = screen.getDisplayNearestPoint(point);
  const { workArea } = display;

  return {
    width: OVERLAY_WIDTH,
    height: OVERLAY_HEIGHT,
    x: Math.round(workArea.x + (workArea.width - OVERLAY_WIDTH) / 2),
    y: Math.round(workArea.y + workArea.height - OVERLAY_HEIGHT - OVERLAY_MARGIN_BOTTOM),
  };
}

function positionOverlayWindow() {
  if (!overlayWindow || overlayWindow.isDestroyed()) {
    return;
  }

  overlayWindow.setBounds(getOverlayBounds(), false);
}

function syncOverlayWindow() {
  if (!overlayWindow || overlayWindow.isDestroyed()) {
    return;
  }

  positionOverlayWindow();

  if (state.showOverlayBar) {
    if (!overlayWindow.isVisible()) {
      overlayWindow.showInactive();
    }
  } else if (overlayWindow.isVisible()) {
    overlayWindow.hide();
  }
}

function createOverlayWindow() {
  overlayWindow = new BrowserWindow({
    width: OVERLAY_WIDTH,
    height: OVERLAY_HEIGHT,
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    focusable: false,
    show: false,
    hasShadow: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'overlay-preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  overlayWindow.setAlwaysOnTop(true, 'screen-saver');
  overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  overlayWindow.setIgnoreMouseEvents(true, { forward: true });
  overlayWindow.setMenuBarVisibility(false);
  overlayWindow.loadFile(path.join(getProjectRoot(), 'src', 'renderer', 'overlay.html'));

  overlayWindow.on('ready-to-show', () => {
    syncOverlayWindow();
  });

  overlayWindow.on('closed', () => {
    overlayWindow = null;
  });
}

function snapshotState() {
  return {
    ...state,
    historyLimit: MAX_HISTORY,
    usageSummary: buildUsageSummary(state.usageStats),
  };
}

function setState(patch) {
  Object.assign(state, patch);

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('app-state', snapshotState());
  }

  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.webContents.send('app-state', snapshotState());
    syncOverlayWindow();
  }
}

function getServiceEnv() {
  return {
    ...process.env,
    WHISPER_MODEL: state.model,
    ALLOWED_LANGUAGES: state.allowedLanguages.join(','),
    FLOW_HOTKEY: state.shortcut,
    HF_HUB_DISABLE_SYMLINKS_WARNING: '1',
    HF_HUB_DISABLE_PROGRESS_BARS: '1',
    PYTHONIOENCODING: 'utf-8',
    PYTHONUTF8: '1',
  };
}

function sendServiceCommand(type, payload = {}) {
  if (!serviceProcess || !serviceProcess.stdin.writable) {
    return;
  }

  serviceProcess.stdin.write(`${JSON.stringify({ type, payload })}\n`);
}

function sendHotkeyCommand(type, payload = {}) {
  if (!hotkeyProcess || !hotkeyProcess.stdin.writable) {
    return;
  }

  hotkeyProcess.stdin.write(`${JSON.stringify({ type, payload })}\n`);
}

function normalizeTextForPaste(text) {
  const trimmed = String(text || '').replace(/\s+/g, ' ').trim();
  if (!trimmed) {
    return '';
  }

  return /[.,!?;:\n]$/.test(trimmed) ? trimmed : `${trimmed} `;
}

function insertTextIntoFocusedApp(text) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(getProjectRoot(), 'scripts', 'send_text.ps1');
    const encodedText = Buffer.from(text, 'utf8').toString('base64');
    const powershell = spawn(
      'powershell.exe',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptPath, '-EncodedText', encodedText],
      { windowsHide: true },
    );

    let stderr = '';

    powershell.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    powershell.on('error', (error) => {
      reject(error);
    });

    powershell.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(stderr || `PowerShell exited with code ${code}`));
    });
  });
}

function startListening() {
  if (!state.engineReady || !state.serviceOnline) {
    setState({
      pendingStartOnReady: state.hotkeyPressed,
      notice: state.switchingModel
        ? `Trocando para ${getModelDisplayName(state.model)}. Aguarde o novo worker ficar pronto.`
        : 'O modelo ainda esta carregando. Aguarde alguns segundos.',
      error: '',
    });
    return snapshotState();
  }

  if (state.listening) {
    return snapshotState();
  }

  sendServiceCommand('start');
  return snapshotState();
}

function stopListening() {
  if (!state.serviceOnline || !state.engineReady) {
    return snapshotState();
  }

  sendServiceCommand('stop');
  return snapshotState();
}

function recordModelTiming(modelId, transcriptionMs) {
  const normalizedModel = normalizeModel(modelId);
  const ms = Number(transcriptionMs) || 0;
  if (!ms) {
    return;
  }

  const current = state.modelStats[normalizedModel] || {
    count: 0,
    totalMs: 0,
    averageMs: 0,
    lastMs: 0,
  };
  const updated = {
    count: current.count + 1,
    totalMs: current.totalMs + ms,
    lastMs: ms,
  };
  updated.averageMs = updated.totalMs / updated.count;

  setState({
    modelStats: {
      ...state.modelStats,
      [normalizedModel]: updated,
    },
  });
  saveUserSettings();
}

function classifyWarning(message) {
  const text = String(message || '');
  if (!text) {
    return;
  }

  if (text.includes('GPU') || text.includes('CUDA') || text.includes('cuBLAS')) {
    setState({
      deviceNote: text,
      notice: '',
    });
    return;
  }

  setState({
    notice: text,
  });
}

async function handleServiceEvent(event) {
  const payload = event.payload || {};

  switch (event.type) {
    case 'ready':
      setState({
        engineReady: true,
        phase: 'idle',
        serviceOnline: true,
        model: payload.model || state.model,
        device: payload.device || state.device,
        deviceNote: payload.note || state.deviceNote,
        switchingModel: false,
        pendingPaste: false,
        notice: state.notice.startsWith('Trocando para ') ? '' : state.notice,
        error: '',
      });
      if (state.pendingStartOnReady && state.hotkeyPressed) {
        setState({ pendingStartOnReady: false });
        startListening();
      }
      break;
    case 'state':
      setState({
        listening: Boolean(payload.listening),
        phase:
          state.pendingPaste && (payload.phase === 'idle' || payload.phase === 'transcribing')
            ? 'transcribing'
            : payload.phase || state.phase,
      });
      break;
    case 'partial':
      setState({
        partial: payload.text || '',
      });
      break;
    case 'final': {
      const text = String(payload.text || '').trim();
      if (!text) {
        break;
      }

      const pasteText = normalizeTextForPaste(text);
      const entry = {
        model: payload.model || state.model,
        text,
        language: payload.language || 'unknown',
        transcriptionMs: payload.transcription_ms || 0,
        audioDurationMs: payload.audio_duration_ms || 0,
        wordCount: countWords(text),
        timestamp: new Date().toISOString(),
      };
      const history = [entry, ...state.history].slice(0, MAX_HISTORY);
      const usageStats = recordUsage(state.usageStats, entry);

      setState({
        latestFinal: text,
        latestLanguage: payload.language || 'unknown',
        partial: '',
        history,
        usageStats,
        pendingPaste: true,
        phase: 'transcribing',
        error: '',
      });
      saveUserSettings();

      recordModelTiming(payload.model || state.model, payload.transcription_ms);

      try {
        await insertTextIntoFocusedApp(pasteText);
      } catch (error) {
        setState({
          error: `Falha ao colar texto no campo ativo: ${error.message}`,
        });
      } finally {
        setState({
          pendingPaste: false,
          phase: state.listening ? 'listening' : 'idle',
        });
      }
      break;
    }
    case 'warning':
      classifyWarning(payload.message || 'Aviso do motor de ditado.');
      break;
    case 'error':
      setState({
        notice: '',
        error: payload.message || 'Erro no motor de ditado.',
        pendingPaste: false,
        phase: 'error',
      });
      break;
    default:
      break;
  }
}

function handleHotkeyEvent(event) {
  const payload = event.payload || {};

  switch (event.type) {
    case 'ready':
      setState({
        hotkeyOnline: true,
        shortcut: payload.shortcut || state.shortcut,
      });
      break;
    case 'hotkey-pressed':
      setState({
        hotkeyPressed: true,
      });
      startListening();
      break;
    case 'hotkey-released':
      setState({
        hotkeyPressed: false,
        pendingStartOnReady: false,
      });
      stopListening();
      break;
    case 'warning':
      classifyWarning(payload.message || state.notice);
      break;
    case 'error':
      setState({
        error: payload.message || 'Erro no listener de atalho global.',
      });
      break;
    default:
      break;
  }
}

function attachJsonReader(childProcess, onEvent, onInvalidJson) {
  const reader = readline.createInterface({
    input: childProcess.stdout,
    crlfDelay: Infinity,
  });

  reader.on('line', (line) => {
    if (!line.trim()) {
      return;
    }

    try {
      onEvent(JSON.parse(line));
    } catch (error) {
      onInvalidJson(error);
    }
  });

  return reader;
}

function bootDictationService() {
  const pythonScript = path.join(getProjectRoot(), 'python', 'dictation_service.py');
  const localToken = ++serviceToken;
  const localProcess = spawn(getPythonBin(), ['-u', pythonScript], {
    cwd: getProjectRoot(),
    env: getServiceEnv(),
    stdio: ['pipe', 'pipe', 'pipe'],
    windowsHide: true,
  });

  serviceProcess = localProcess;
  setState({
    phase: 'booting',
    serviceOnline: true,
    engineReady: false,
    listening: false,
    pendingPaste: false,
    partial: '',
    notice: state.switchingModel ? state.notice : '',
    error: '',
  });

  serviceReader = attachJsonReader(
    localProcess,
    (event) => {
      if (localToken !== serviceToken) {
        return;
      }
      void handleServiceEvent(event);
    },
    (error) => {
      if (localToken !== serviceToken) {
        return;
      }
      setState({
        error: `Saida invalida do worker Python: ${error.message}`,
      });
    },
  );

  localProcess.stderr.on('data', (chunk) => {
    if (localToken !== serviceToken) {
      return;
    }

    const message = chunk.toString().trim();
    if (!message) {
      return;
    }

    if (
      message.includes('UserWarning') ||
      message.includes('Warning:') ||
      message.includes('huggingface_hub')
    ) {
      return;
    }

    setState({
      error: message,
    });
  });

  localProcess.on('error', (error) => {
    if (localToken !== serviceToken) {
      return;
    }

    setState({
      serviceOnline: false,
      engineReady: false,
      phase: 'error',
      error: `Nao foi possivel iniciar o worker Python: ${error.message}`,
    });
  });

  localProcess.on('close', (code) => {
    if (localToken !== serviceToken) {
      return;
    }

    serviceProcess = null;
    setState({
      serviceOnline: false,
      engineReady: false,
      listening: false,
      phase: 'offline',
      partial: '',
      error: code === 0 ? state.error : `Worker Python encerrado com codigo ${code}.`,
    });
  });
}

function bootHotkeyListener() {
  const pythonScript = path.join(getProjectRoot(), 'python', 'hotkey_listener.py');
  const localToken = ++hotkeyToken;
  const localProcess = spawn(getPythonBin(), ['-u', pythonScript], {
    cwd: getProjectRoot(),
    env: getServiceEnv(),
    stdio: ['pipe', 'pipe', 'pipe'],
    windowsHide: true,
  });

  hotkeyProcess = localProcess;
  hotkeyReader = attachJsonReader(
    localProcess,
    (event) => {
      if (localToken !== hotkeyToken) {
        return;
      }
      handleHotkeyEvent(event);
    },
    (error) => {
      if (localToken !== hotkeyToken) {
        return;
      }
      setState({
        error: `Saida invalida do listener de atalho: ${error.message}`,
      });
    },
  );

  localProcess.stderr.on('data', (chunk) => {
    if (localToken !== hotkeyToken) {
      return;
    }

    const message = chunk.toString().trim();
    if (!message) {
      return;
    }

    setState({
      error: message,
    });
  });

  localProcess.on('error', (error) => {
    if (localToken !== hotkeyToken) {
      return;
    }

    setState({
      hotkeyOnline: false,
      error: `Nao foi possivel iniciar o listener de atalho global: ${error.message}`,
    });
  });

  localProcess.on('close', (code) => {
    if (localToken !== hotkeyToken) {
      return;
    }

    hotkeyProcess = null;
    setState({
      hotkeyOnline: false,
      error: code === 0 ? state.error : `Listener de atalho encerrado com codigo ${code}.`,
    });
  });
}

async function shutdownServiceForRestart() {
  const currentProcess = serviceProcess;
  if (!currentProcess) {
    return;
  }

  const localToken = serviceToken;

  await new Promise((resolve) => {
    let resolved = false;
    const finish = () => {
      if (resolved) {
        return;
      }
      resolved = true;
      resolve();
    };

    const timeout = setTimeout(() => {
      try {
        currentProcess.kill();
      } catch (_error) {
        // Best effort.
      }
      finish();
    }, SERVICE_SHUTDOWN_TIMEOUT_MS);

    currentProcess.once('close', () => {
      clearTimeout(timeout);
      finish();
    });

    if (localToken === serviceToken) {
      try {
        sendServiceCommand('shutdown');
      } catch (_error) {
        clearTimeout(timeout);
        finish();
      }
    } else {
      clearTimeout(timeout);
      finish();
    }
  });
}

async function restartDictationService() {
  const restartVersion = ++serviceRestartVersion;
  setState({
    engineReady: false,
    serviceOnline: false,
    listening: false,
    hotkeyPressed: false,
    pendingStartOnReady: false,
    pendingPaste: false,
    partial: '',
    phase: 'booting',
    switchingModel: true,
  });

  await shutdownServiceForRestart();
  if (restartVersion !== serviceRestartVersion) {
    return;
  }
  bootDictationService();
}

async function applySettings(patch) {
  const nextLanguages = patch.allowedLanguages
    ? normalizeLanguages(patch.allowedLanguages)
    : state.allowedLanguages;
  const nextModel = patch.model ? normalizeModel(patch.model) : state.model;
  const nextShowOverlayBar =
    typeof patch.showOverlayBar === 'boolean' ? patch.showOverlayBar : state.showOverlayBar;

  const modelChanged = nextModel !== state.model;
  const languagesChanged = nextLanguages.join(',') !== state.allowedLanguages.join(',');
  const overlayChanged = nextShowOverlayBar !== state.showOverlayBar;

  let notice = state.notice;
  if (languagesChanged) {
    notice = `Idiomas ativos: ${nextLanguages.map((language) => language.toUpperCase()).join(', ')}.`;
  } else if (modelChanged) {
    notice = `Trocando para ${getModelDisplayName(nextModel)}...`;
  } else if (overlayChanged) {
    notice = nextShowOverlayBar
      ? 'Barra flutuante ativada.'
      : 'Barra flutuante desativada.';
  }

  setState({
    allowedLanguages: nextLanguages,
    model: nextModel,
    showOverlayBar: nextShowOverlayBar,
    notice,
    error: '',
  });

  saveUserSettings();

  if (modelChanged) {
    await restartDictationService();
  } else if (languagesChanged) {
    sendServiceCommand('configure', {
      allowed_languages: nextLanguages,
    });
  }

  return snapshotState();
}

function resetModelStats() {
  setState({
    modelStats: createEmptyStats(),
    notice: 'Estatisticas de modelos resetadas.',
  });
  saveUserSettings();
  return snapshotState();
}

ipcMain.handle('copy-text', async (_event, text) => {
  clipboard.writeText(String(text || ''));
  return true;
});

function shutdownChildren() {
  try {
    sendServiceCommand('shutdown');
  } catch (_error) {
    // Best effort.
  }

  try {
    sendHotkeyCommand('shutdown');
  } catch (_error) {
    // Best effort.
  }
}

ipcMain.handle('get-state', async () => snapshotState());
ipcMain.handle('update-settings', async (_event, patch) => applySettings(patch || {}));
ipcMain.handle('reset-model-stats', async () => resetModelStats());

app.whenReady().then(() => {
  const userSettings = loadUserSettings();
  setState({
    allowedLanguages: userSettings.allowedLanguages,
    model: userSettings.model,
    modelStats: userSettings.modelStats,
    history: userSettings.history,
    usageStats: userSettings.usageStats,
    showOverlayBar: userSettings.showOverlayBar,
  });

  createWindow();
  createOverlayWindow();
  bootDictationService();
  bootHotkeyListener();

  screen.on('display-added', positionOverlayWindow);
  screen.on('display-removed', positionOverlayWindow);
  screen.on('display-metrics-changed', positionOverlayWindow);

  app.on('activate', () => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      createWindow();
    }
    if (!overlayWindow || overlayWindow.isDestroyed()) {
      createOverlayWindow();
    }
  });
});

app.on('will-quit', () => {
  shutdownChildren();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
