const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(process.cwd(), '.env') });

const {
  app,
  BrowserWindow,
  Menu,
  Tray,
  clipboard,
  globalShortcut,
  ipcMain,
  nativeImage,
  screen,
} = require('electron');
const { spawn } = require('child_process');
const readline = require('readline');

const DEFAULT_SHORTCUT = process.platform === 'darwin' ? 'ctrl+command' : 'ctrl+windows';
const DEFAULT_PASTE_LAST_SHORTCUT =
  process.platform === 'darwin' ? 'command+option+v' : 'ctrl+alt+v';
const PASTE_SHORTCUT_SETTLE_DELAY_MS = process.platform === 'darwin' ? 90 : 70;
const DEFAULT_LANGUAGES = ['pt', 'en'];
const DEFAULT_INTERFACE_LANGUAGE = 'en';
const DEFAULT_SHOW_OVERLAY_BAR = true;
const DEFAULT_SOUND_EFFECTS_ENABLED = true;
const DEFAULT_LAUNCH_AT_LOGIN = true;
const PERSISTENCE_VERSION = 5;
const SERVICE_SHUTDOWN_TIMEOUT_MS = 2500;
const OVERLAY_WIDTH = 96;
const OVERLAY_HEIGHT = 34;
const OVERLAY_MARGIN_BOTTOM = 22;
const APP_NAME = 'MegaFala';
const APP_ID = 'com.megafala.app';
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

const SUPPORTED_INTERFACE_LANGUAGES = [
  'en',
  'pt-BR',
  'es',
  'fr',
  'de',
  'it',
  'nl',
  'el',
  'ru',
  'zh-CN',
  'ja',
  'ko',
  'ar',
  'hi',
  'tr',
];

const SUPPORTED_DETECTION_LANGUAGES = [
  'af',
  'am',
  'ar',
  'as',
  'az',
  'ba',
  'be',
  'bg',
  'bn',
  'bo',
  'br',
  'bs',
  'ca',
  'cs',
  'cy',
  'da',
  'de',
  'el',
  'en',
  'es',
  'et',
  'eu',
  'fa',
  'fi',
  'fo',
  'fr',
  'gl',
  'gu',
  'ha',
  'haw',
  'he',
  'hi',
  'hr',
  'ht',
  'hu',
  'hy',
  'id',
  'is',
  'it',
  'ja',
  'jw',
  'ka',
  'kk',
  'km',
  'kn',
  'ko',
  'la',
  'lb',
  'ln',
  'lo',
  'lt',
  'lv',
  'mg',
  'mi',
  'mk',
  'ml',
  'mn',
  'mr',
  'ms',
  'mt',
  'my',
  'ne',
  'nl',
  'nn',
  'no',
  'oc',
  'pa',
  'pl',
  'ps',
  'pt',
  'ro',
  'ru',
  'sa',
  'sd',
  'si',
  'sk',
  'sl',
  'sn',
  'so',
  'sq',
  'sr',
  'su',
  'sv',
  'sw',
  'ta',
  'te',
  'tg',
  'th',
  'tk',
  'tl',
  'tr',
  'tt',
  'uk',
  'ur',
  'uz',
  'vi',
  'yi',
  'yo',
  'zh',
  'yue',
];

const SUPPORTED_DICTIONARY_LANGUAGES = ['pt', 'en'];

const MAIN_TRANSLATIONS = {
  en: {
    activeLanguages: 'Detection languages: {summary}.',
    switchingModel: 'Switching to {model}...',
    overlayOn: 'Floating bar enabled.',
    overlayOff: 'Floating bar disabled.',
    soundOn: 'Sound feedback enabled.',
    soundOff: 'Sound feedback disabled.',
    dictionaryOn: 'Dictionary active with {count} rule(s).',
    dictionaryOff: 'Dictionary cleared.',
    modelStatsReset: 'Model stats reset.',
    interfaceLanguageChanged: 'Interface language: {language}.',
    handsFreeActive: 'Hands-free mode active. Press {shortcut} to finish and transcribe.',
    waitingSwitchHandsFree:
      'Switching to {model}. Hands-free mode will start when the new worker is ready.',
    waitingSwitchHold: 'Switching to {model}. Wait for the new worker to finish loading.',
    waitingBootHandsFree: 'The model is still loading. Hands-free mode will start when it is ready.',
    waitingBootHold: 'The model is still loading. Wait a few seconds.',
    transcriptionBusy: 'Wait for the current transcription to finish before starting a new dictation.',
    launchAtLoginOn: 'Start with the computer enabled.',
    launchAtLoginOff: 'Start with the computer disabled.',
    trayOpenApp: 'Open MegaFala',
    trayHideApp: 'Hide window',
    trayQuit: 'Quit',
  },
  'pt-BR': {
    activeLanguages: 'Idiomas de deteccao: {summary}.',
    switchingModel: 'Trocando para {model}...',
    overlayOn: 'Barra flutuante ativada.',
    overlayOff: 'Barra flutuante desativada.',
    soundOn: 'Feedback sonoro ativado.',
    soundOff: 'Feedback sonoro desativado.',
    dictionaryOn: 'Dicionario ativo com {count} regra(s).',
    dictionaryOff: 'Dicionario limpo.',
    modelStatsReset: 'Estatisticas de modelos resetadas.',
    interfaceLanguageChanged: 'Idioma da interface: {language}.',
    handsFreeActive: 'Modo hands-free ativo. Pressione {shortcut} para finalizar e transcrever.',
    waitingSwitchHandsFree:
      'Trocando para {model}. O modo hands-free sera ativado quando o novo worker ficar pronto.',
    waitingSwitchHold: 'Trocando para {model}. Aguarde o novo worker ficar pronto.',
    waitingBootHandsFree:
      'O modelo ainda esta carregando. O modo hands-free sera iniciado quando estiver pronto.',
    waitingBootHold: 'O modelo ainda esta carregando. Aguarde alguns segundos.',
    transcriptionBusy:
      'Aguarde a transcricao atual terminar antes de iniciar um novo ditado.',
    launchAtLoginOn: 'Inicializacao com o computador ativada.',
    launchAtLoginOff: 'Inicializacao com o computador desativada.',
    trayOpenApp: 'Abrir MegaFala',
    trayHideApp: 'Ocultar janela',
    trayQuit: 'Fechar',
  },
};

let mainWindow = null;
let overlayWindow = null;
let tray = null;
let serviceProcess = null;
let serviceReader = null;
let hotkeyProcess = null;
let hotkeyReader = null;
let audioProcess = null;
let audioReader = null;
let serviceToken = 0;
let hotkeyToken = 0;
let audioToken = 0;
let serviceRestartVersion = 0;
let hasPlayedLoadedFeedback = false;
let pasteLastRegisteredAccelerator = null;
let pasteLastRegisteredViaElectron = false;
let lastPasteLastRequestAt = 0;
const pendingOverlayFeedbacks = [];
let currentDictationStartedAt = 0;
let captureMuteDepth = 0;
let suppressStartSoundUntil = 0;
let suppressStartRequestsUntil = 0;
let ignoreNextHotkeyRelease = false;
let isQuitting = false;
let shouldStartHiddenOnLaunch = process.argv.some((arg) => arg === '--background');

function getDefaultModel() {
  return process.env.WHISPER_MODEL || 'small';
}

function normalizeLanguageSelection(input, supportedLanguages, fallbackLanguages) {
  const values = Array.isArray(input)
    ? input
    : String(input || '')
        .split(',')
        .map((value) => value.trim());

  const supportedSet = new Set(supportedLanguages);
  const languages = values
    .map((value) => String(value || '').trim().toLowerCase())
    .filter((value) => supportedSet.has(value));

  return languages.length > 0 ? [...new Set(languages)] : [...fallbackLanguages];
}

function normalizeDetectionLanguages(input) {
  return normalizeLanguageSelection(input, SUPPORTED_DETECTION_LANGUAGES, DEFAULT_LANGUAGES);
}

function normalizeDictionaryLanguages(input) {
  return normalizeLanguageSelection(input, SUPPORTED_DICTIONARY_LANGUAGES, DEFAULT_LANGUAGES);
}

function normalizeInterfaceLanguage(input) {
  const value = String(input || '').trim();
  return SUPPORTED_INTERFACE_LANGUAGES.includes(value) ? value : DEFAULT_INTERFACE_LANGUAGE;
}

function getTranslationBundle(language) {
  return MAIN_TRANSLATIONS[normalizeInterfaceLanguage(language)] || MAIN_TRANSLATIONS.en;
}

function translateMain(key, params = {}, language = state.interfaceLanguage) {
  const template =
    getTranslationBundle(language)[key] || MAIN_TRANSLATIONS.en[key] || String(key || '');

  return template.replace(/\{(\w+)\}/g, (_match, token) => String(params[token] ?? ''));
}

function capitalizeLabel(value, language = state.interfaceLanguage) {
  const text = String(value || '').trim();
  if (!text) {
    return text;
  }

  return text.replace(/^\p{L}/u, (match) => match.toLocaleUpperCase(language));
}

function getLocalizedDetectionLanguageName(code, language = state.interfaceLanguage) {
  const normalizedLanguage = normalizeInterfaceLanguage(language);
  const normalizedCode = String(code || '').trim().toLowerCase();

  try {
    return (
      new Intl.DisplayNames([normalizedLanguage], { type: 'language' }).of(normalizedCode) ||
      normalizedCode.toUpperCase()
    );
  } catch (_error) {
    return normalizedCode.toUpperCase();
  }
}

function formatDetectionLanguagesSummary(languages, language = state.interfaceLanguage) {
  const list = Array.isArray(languages) ? languages : [];
  const normalizedLanguage = normalizeInterfaceLanguage(language);

  if (list.length <= 3) {
    return list
      .map((code) =>
        capitalizeLabel(
          getLocalizedDetectionLanguageName(code, normalizedLanguage),
          normalizedLanguage,
        ),
      )
      .join(', ');
  }

  return normalizedLanguage === 'pt-BR' ? `${list.length} selecionados` : `${list.length} selected`;
}

function getLocalizedLanguageName(code, language = state.interfaceLanguage) {
  const normalizedCode = normalizeInterfaceLanguage(code);
  const normalizedLanguage = normalizeInterfaceLanguage(language);

  try {
    return new Intl.DisplayNames([normalizedLanguage], { type: 'language' }).of(normalizedCode);
  } catch (_error) {
    return normalizedCode;
  }
}

function normalizeModel(modelId) {
  const value = String(modelId || '').trim();
  return MODEL_OPTIONS.some((option) => option.id === value) ? value : getDefaultModel();
}

function createDictionaryEntryId() {
  return `dict_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function getModelOption(modelId) {
  return MODEL_OPTIONS.find((option) => option.id === modelId) || null;
}

function getModelDisplayName(modelId, language = state.interfaceLanguage) {
  const option = getModelOption(modelId);
  if (!option) {
    return modelId || 'model';
  }

  if (normalizeInterfaceLanguage(language) === 'pt-BR') {
    return option.label || modelId || 'modelo';
  }

  const labels = {
    tiny: 'Lite',
    base: 'Fast',
    small: 'Balanced',
    medium: 'Precise',
    'large-v3': 'Maximum',
  };

  return labels[option.id] || option.label || modelId || 'model';
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
    .filter(Boolean);
}

function normalizeDictionaryEntry(entry) {
  if (!entry || typeof entry !== 'object') {
    return null;
  }

  const sourceValues = (Array.isArray(entry.sources) ? entry.sources : [entry.source])
    .flatMap((value) => String(value || '').split(/\r?\n|;/))
    .map((value) => value.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const sources = [];
  const seenSources = new Set();

  for (const value of sourceValues) {
    const key = value.toLocaleLowerCase('pt-BR');
    if (seenSources.has(key)) {
      continue;
    }

    seenSources.add(key);
    sources.push(value);
  }
  const target = String(entry.target || '')
    .replace(/\s+/g, ' ')
    .trim();

  if (sources.length === 0 || !target) {
    return null;
  }

  return {
    id: String(entry.id || createDictionaryEntryId()),
    sources,
    target,
    languages: normalizeDictionaryLanguages(entry.languages),
  };
}

function normalizeDictionaryEntries(entries) {
  if (!Array.isArray(entries)) {
    return [];
  }

  const seen = new Set();
  return entries
    .map((entry) => normalizeDictionaryEntry(entry))
    .filter((entry) => {
      if (!entry) {
        return false;
      }

      const key =
        `${entry.sources.map((value) => value.toLocaleLowerCase('pt-BR')).join('|')}` +
        `__${entry.target}__${entry.languages.join(',')}`;
      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
}

function escapeRegExp(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildDictionaryPattern(source) {
  const normalizedSource = String(source || '').trim();
  const escapedSource = escapeRegExp(normalizedSource).replace(/\s+/g, '\\s+');
  return new RegExp(`(?<![\\p{L}\\p{N}_])${escapedSource}(?![\\p{L}\\p{N}_])`, 'giu');
}

function createDictionaryReplacementIndex(entries) {
  const buckets = {
    all: [],
    pt: [],
    en: [],
  };

  for (const entry of Array.isArray(entries) ? entries : []) {
    if (!entry || !Array.isArray(entry.sources) || !entry.target) {
      continue;
    }

    for (const source of entry.sources) {
      const normalizedSource = String(source || '').trim();
      if (!normalizedSource) {
        continue;
      }

      const compiledEntry = {
        source: normalizedSource,
        sourceLength: normalizedSource.length,
        target: entry.target,
        pattern: buildDictionaryPattern(normalizedSource),
      };

      buckets.all.push(compiledEntry);

      for (const language of Array.isArray(entry.languages) ? entry.languages : []) {
        if (language === 'pt' || language === 'en') {
          buckets[language].push(compiledEntry);
        }
      }
    }
  }

  for (const bucket of Object.values(buckets)) {
    bucket.sort((left, right) => right.sourceLength - left.sourceLength);
  }

  return buckets;
}

let dictionaryReplacementIndex = createDictionaryReplacementIndex([]);

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

function normalizeOverlayPosition(position) {
  if (!position || typeof position !== 'object') {
    return null;
  }

  const x = Number(position.x);
  const y = Number(position.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return null;
  }

  return {
    x: Math.round(x),
    y: Math.round(y),
  };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getShortcutFromEnv(name, fallback) {
  const value = String(process.env[name] || '')
    .trim()
    .toLowerCase();
  return value || fallback;
}

function formatShortcutForDisplay(shortcut, platform = process.platform) {
  const labels = String(shortcut || '')
    .split('+')
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean)
    .map((token) => {
      if (token === 'commandorcontrol') {
        return platform === 'darwin' ? 'Command' : 'Ctrl';
      }

      if (token === 'control' || token === 'ctrl') {
        return platform === 'darwin' ? 'Control' : 'Ctrl';
      }

      if (token === 'command' || token === 'cmd') {
        return 'Command';
      }

      if (token === 'option' || token === 'alt') {
        return platform === 'darwin' ? 'Option' : 'Alt';
      }

      if (token === 'windows' || token === 'super') {
        return platform === 'darwin' ? 'Command' : 'Win';
      }

      if (token === 'shift') {
        return 'Shift';
      }

      if (token === 'space') {
        return 'Space';
      }

      return token.length === 1 ? token.toUpperCase() : token;
    });

  return labels.join('+');
}

function shortcutToElectronAccelerator(shortcut) {
  const tokens = String(shortcut || '')
    .split('+')
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);

  if (tokens.length === 0) {
    return '';
  }

  const acceleratorTokens = tokens.map((token) => {
    switch (token) {
      case 'commandorcontrol':
      case 'control':
      case 'ctrl':
        return 'CommandOrControl';
      case 'command':
      case 'cmd':
        return 'Command';
      case 'option':
        return 'Option';
      case 'alt':
        return process.platform === 'darwin' ? 'Option' : 'Alt';
      case 'windows':
      case 'super':
        return 'Super';
      case 'shift':
        return 'Shift';
      case 'space':
        return 'Space';
      case 'escape':
      case 'esc':
        return 'Esc';
      case 'enter':
      case 'return':
        return 'Enter';
      default:
        return token.length === 1 ? token.toUpperCase() : '';
    }
  });

  if (acceleratorTokens.some((token) => !token)) {
    return '';
  }

  return acceleratorTokens.join('+');
}

function getDefaultsFromEnv() {
  return {
    shortcut: getShortcutFromEnv('FLOW_HOTKEY', DEFAULT_SHORTCUT),
    pasteLastShortcut: getShortcutFromEnv(
      'FLOW_PASTE_LAST_HOTKEY',
      DEFAULT_PASTE_LAST_SHORTCUT,
    ),
    allowedLanguages: normalizeDetectionLanguages(
      process.env.ALLOWED_LANGUAGES || DEFAULT_LANGUAGES.join(','),
    ),
    interfaceLanguage: normalizeInterfaceLanguage(process.env.INTERFACE_LANGUAGE),
    model: normalizeModel(getDefaultModel()),
    showOverlayBar: DEFAULT_SHOW_OVERLAY_BAR,
    soundEffectsEnabled: DEFAULT_SOUND_EFFECTS_ENABLED,
    launchAtLogin: DEFAULT_LAUNCH_AT_LOGIN,
    dictionaryEntries: [],
    overlayPosition: null,
  };
}

const defaults = getDefaultsFromEnv();

const state = {
  engineReady: false,
  listening: false,
  phase: 'booting',
  shortcut: defaults.shortcut,
  pasteLastShortcut: defaults.pasteLastShortcut,
  allowedLanguages: defaults.allowedLanguages,
  partial: '',
  latestFinal: '',
  latestLanguage: null,
  supportedDetectionLanguages: SUPPORTED_DETECTION_LANGUAGES,
  interfaceLanguage: defaults.interfaceLanguage,
  model: defaults.model,
  availableModels: MODEL_OPTIONS,
  modelStats: createEmptyStats(),
  device: 'unknown',
  deviceNote: '',
  serviceOnline: false,
  hotkeyOnline: false,
  hotkeyPressed: false,
  pendingStartMode: null,
  captureMode: null,
  dictationSessionId: null,
  switchingModel: false,
  notice: '',
  error: '',
  history: [],
  usageStats: createEmptyUsageStats(),
  showOverlayBar: defaults.showOverlayBar,
  soundEffectsEnabled: defaults.soundEffectsEnabled,
  launchAtLogin: defaults.launchAtLogin,
  dictionaryEntries: defaults.dictionaryEntries,
  overlayPosition: defaults.overlayPosition,
  pendingPaste: false,
  audioLevel: 0,
};

rebuildDictionaryReplacementIndex(defaults.dictionaryEntries);

app.setName(APP_NAME);

const singleInstanceLock = app.requestSingleInstanceLock();

if (!singleInstanceLock) {
  app.quit();
}

function getAppCodePath() {
  return app.getAppPath();
}

function getRuntimeBasePath() {
  return app.isPackaged ? process.resourcesPath : getAppCodePath();
}

function getProjectRoot() {
  return getAppCodePath();
}

function getPythonBin() {
  const venvPython = process.platform === 'win32'
    ? path.join(getProjectRoot(), '.venv', 'Scripts', 'python.exe')
    : path.join(getProjectRoot(), '.venv', 'bin', 'python');
  return process.env.PYTHON_BIN || (fs.existsSync(venvPython) ? venvPython : 'python');
}

function getWorkerExecutableName(workerName) {
  return process.platform === 'win32' ? `${workerName}.exe` : workerName;
}

function getWorkerLaunchSpec(workerName) {
  if (app.isPackaged) {
    return {
      command: path.join(getRuntimeBasePath(), 'bin', workerName, getWorkerExecutableName(workerName)),
      args: [],
    };
  }

  return {
    command: getPythonBin(),
    args: ['-u', path.join(getProjectRoot(), 'python', `${workerName}.py`)],
  };
}

function getAppIconPath() {
  return path.join(getProjectRoot(), 'src', 'assets', 'megaf.ico');
}

function getTrayIconAssetPath() {
  if (process.platform === 'darwin') {
    return path.join(getProjectRoot(), 'src', 'assets', 'megaf-trayTemplate.png');
  }

  return getAppIconPath();
}

function getTrayIconImage() {
  let image = nativeImage.createFromPath(getTrayIconAssetPath());
  if (image.isEmpty()) {
    image = nativeImage.createFromPath(getAppIconPath());
  }

  if (process.platform === 'darwin') {
    image.setTemplateImage(true);
    return image.resize({ width: 18, height: 18 });
  }

  return image.resize({ width: 16, height: 16 });
}

function getSettingsPath() {
  return path.join(getStorageDirectory(), 'settings.json');
}

function getLegacySettingsPath() {
  return path.join(app.getPath('userData'), 'settings.json');
}

function getStorageDirectory() {
  return path.join(app.getPath('userData'), 'store');
}

function getModelsDirectory() {
  return path.join(app.getPath('userData'), 'models');
}

function ensureRuntimeDirectories() {
  fs.mkdirSync(getStorageDirectory(), { recursive: true });
  fs.mkdirSync(getModelsDirectory(), { recursive: true });
}

function createEmptyPersistedState() {
  return {
    version: PERSISTENCE_VERSION,
    preferences: {
      allowedLanguages: defaults.allowedLanguages,
      interfaceLanguage: defaults.interfaceLanguage,
      model: defaults.model,
      showOverlayBar: defaults.showOverlayBar,
      soundEffectsEnabled: defaults.soundEffectsEnabled,
      launchAtLogin: defaults.launchAtLogin,
      dictionaryEntries: defaults.dictionaryEntries,
      overlayPosition: defaults.overlayPosition,
    },
    modelStats: createEmptyStats(),
    history: [],
    usageStats: createEmptyUsageStats(),
  };
}

function readJsonFile(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (_error) {
    return null;
  }
}

function normalizePersistedState(payload) {
  const source = payload && typeof payload === 'object' ? payload : {};
  const preferencesSource =
    source.preferences && typeof source.preferences === 'object' ? source.preferences : source;
  const shouldEnableLaunchAtLoginByDefault = Number(source.version) < PERSISTENCE_VERSION;

  return {
    version: PERSISTENCE_VERSION,
    preferences: {
      allowedLanguages: normalizeDetectionLanguages(preferencesSource.allowedLanguages),
      interfaceLanguage: normalizeInterfaceLanguage(preferencesSource.interfaceLanguage),
      model: normalizeModel(preferencesSource.model),
      showOverlayBar:
        typeof preferencesSource.showOverlayBar === 'boolean'
          ? preferencesSource.showOverlayBar
          : defaults.showOverlayBar,
      soundEffectsEnabled:
        typeof preferencesSource.soundEffectsEnabled === 'boolean'
          ? preferencesSource.soundEffectsEnabled
          : defaults.soundEffectsEnabled,
      launchAtLogin:
        typeof preferencesSource.launchAtLogin === 'boolean' && !shouldEnableLaunchAtLoginByDefault
          ? preferencesSource.launchAtLogin
          : defaults.launchAtLogin,
      dictionaryEntries: normalizeDictionaryEntries(preferencesSource.dictionaryEntries),
      overlayPosition: defaults.overlayPosition,
    },
    modelStats: normalizeStats(source.modelStats),
    history: normalizeHistory(source.history),
    usageStats: normalizeUsageStats(source.usageStats),
  };
}

function writeJsonFile(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
}

function loadPersistentState() {
  const persisted = readJsonFile(getSettingsPath());
  if (persisted) {
    return normalizePersistedState(persisted);
  }

  const legacy = readJsonFile(getLegacySettingsPath());
  if (legacy) {
    const migrated = normalizePersistedState(legacy);
    writeJsonFile(getSettingsPath(), migrated);
    return migrated;
  }

  return createEmptyPersistedState();
}

function savePersistentState() {
  const payload = {
    version: PERSISTENCE_VERSION,
    preferences: {
      allowedLanguages: state.allowedLanguages,
      interfaceLanguage: state.interfaceLanguage,
      model: state.model,
      showOverlayBar: state.showOverlayBar,
      soundEffectsEnabled: state.soundEffectsEnabled,
      launchAtLogin: state.launchAtLogin,
      dictionaryEntries: state.dictionaryEntries,
      overlayPosition: defaults.overlayPosition,
    },
    modelStats: state.modelStats,
    history: state.history,
    usageStats: state.usageStats,
  };

  writeJsonFile(getSettingsPath(), payload);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 840,
    minWidth: 980,
    minHeight: 720,
    autoHideMenuBar: true,
    show: false,
    title: APP_NAME,
    icon: getAppIconPath(),
    backgroundColor: '#f4f1eb',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      autoplayPolicy: 'no-user-gesture-required',
    },
  });

  mainWindow.loadFile(path.join(getProjectRoot(), 'src', 'renderer', 'index.html'));
  mainWindow.webContents.on('did-finish-load', () => {
    syncAudioControllerConfig();
  });
  mainWindow.once('ready-to-show', () => {
    if (shouldStartHiddenOnLaunch) {
      hideMainWindow();
      return;
    }

    showMainWindow({ focus: false });
  });
  mainWindow.on('close', (event) => {
    if (isQuitting) {
      return;
    }

    event.preventDefault();
    hideMainWindow();
  });
  mainWindow.on('closed', () => {
    mainWindow = null;
    refreshTrayMenu();
  });
}

function getOverlayBounds(preferredPosition = state.overlayPosition) {
  const normalizedPosition = normalizeOverlayPosition(preferredPosition);
  const point = normalizedPosition
    ? {
        x: normalizedPosition.x + Math.round(OVERLAY_WIDTH / 2),
        y: normalizedPosition.y + Math.round(OVERLAY_HEIGHT / 2),
      }
    : screen.getCursorScreenPoint();
  const display = screen.getDisplayNearestPoint(point);
  const { workArea } = display;
  const defaultPosition = {
    x: Math.round(workArea.x + (workArea.width - OVERLAY_WIDTH) / 2),
    y: Math.round(workArea.y + workArea.height - OVERLAY_HEIGHT - OVERLAY_MARGIN_BOTTOM),
  };
  const target = normalizedPosition || defaultPosition;
  const maxX = workArea.x + Math.max(0, workArea.width - OVERLAY_WIDTH);
  const maxY = workArea.y + Math.max(0, workArea.height - OVERLAY_HEIGHT);

  return {
    width: OVERLAY_WIDTH,
    height: OVERLAY_HEIGHT,
    x: clamp(target.x, workArea.x, maxX),
    y: clamp(target.y, workArea.y, maxY),
  };
}

function positionOverlayWindow(preferredPosition = state.overlayPosition, persist = false) {
  if (!overlayWindow || overlayWindow.isDestroyed()) {
    return null;
  }

  const hadPosition = Boolean(normalizeOverlayPosition(preferredPosition));
  const bounds = getOverlayBounds(preferredPosition);
  overlayWindow.setBounds(bounds, false);

  if (!hadPosition) {
    state.overlayPosition = {
      x: bounds.x,
      y: bounds.y,
    };
  }

  if (persist) {
    setState({
      overlayPosition: {
        x: bounds.x,
        y: bounds.y,
      },
    });
    savePersistentState();
  }

  return bounds;
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
    icon: getAppIconPath(),
    frame: false,
    transparent: true,
    resizable: false,
    movable: true,
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
      autoplayPolicy: 'no-user-gesture-required',
    },
  });

  overlayWindow.setAlwaysOnTop(true, 'screen-saver');
  overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  overlayWindow.setIgnoreMouseEvents(false);
  overlayWindow.setMenuBarVisibility(false);
  overlayWindow.loadFile(path.join(getProjectRoot(), 'src', 'renderer', 'overlay.html'));
  overlayWindow.webContents.on('did-finish-load', () => {
    flushPendingOverlayFeedbacks();
    syncAudioControllerConfig();
  });

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
    platform: process.platform,
    historyTotal: state.history.length,
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

  refreshTrayMenu();
}

function hasVisibleMainWindow() {
  return Boolean(mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible());
}

function showMainWindow(options = {}) {
  const { focus = true } = options;
  shouldStartHiddenOnLaunch = false;

  if (!mainWindow || mainWindow.isDestroyed()) {
    createWindow();
    return;
  }

  if (process.platform === 'darwin' && app.dock) {
    app.dock.show();
  }

  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }

  if (!mainWindow.isVisible()) {
    mainWindow.show();
  }

  if (focus) {
    mainWindow.focus();
  }

  refreshTrayMenu();
}

function hideMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  mainWindow.hide();

  if (process.platform === 'darwin' && app.dock) {
    app.dock.hide();
  }

  refreshTrayMenu();
}

function toggleMainWindowVisibility() {
  if (hasVisibleMainWindow()) {
    hideMainWindow();
    return;
  }

  showMainWindow();
}

function createTray() {
  if (tray) {
    return tray;
  }

  tray = new Tray(getTrayIconImage());
  tray.setToolTip(APP_NAME);
  tray.on('click', () => {
    toggleMainWindowVisibility();
  });
  tray.on('double-click', () => {
    showMainWindow();
  });
  refreshTrayMenu();
  return tray;
}

function refreshTrayMenu() {
  if (!tray) {
    return;
  }

  const visible = hasVisibleMainWindow();
  const menu = Menu.buildFromTemplate([
    {
      label: translateMain(visible ? 'trayHideApp' : 'trayOpenApp'),
      click: () => {
        if (visible) {
          hideMainWindow();
          return;
        }

        showMainWindow();
      },
    },
    { type: 'separator' },
    {
      label: translateMain('trayQuit'),
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(menu);
}

function syncLaunchAtLoginSetting() {
  app.setLoginItemSettings({
    openAtLogin: state.launchAtLogin,
    openAsHidden: state.launchAtLogin,
    args: ['--background'],
  });
}

function setOverlayAudioLevel(level) {
  const nextLevel = clamp(Number(level) || 0, 0, 1);
  const changed = Math.abs(nextLevel - state.audioLevel) >= 0.015 || (nextLevel === 0) !== (state.audioLevel === 0);
  state.audioLevel = nextLevel;

  if (!changed || !overlayWindow || overlayWindow.isDestroyed()) {
    return;
  }

  overlayWindow.webContents.send('overlay-audio-level', nextLevel);
}

function getServiceEnv() {
  return {
    ...process.env,
    WHISPER_MODEL: state.model,
    WHISPER_MODEL_DIR: getModelsDirectory(),
    ALLOWED_LANGUAGES: state.allowedLanguages.join(','),
    FLOW_HOTKEY: state.shortcut,
    FLOW_PASTE_LAST_HOTKEY: state.pasteLastShortcut,
    HF_HOME: path.join(getModelsDirectory(), 'hf-home'),
    HUGGINGFACE_HUB_CACHE: path.join(getModelsDirectory(), 'hub'),
    HF_HUB_DISABLE_SYMLINKS_WARNING: '1',
    HF_HUB_DISABLE_PROGRESS_BARS: '1',
    OBJC_DISABLE_INITIALIZE_FORK_SAFETY: 'YES',
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

function rebuildDictionaryReplacementIndex(entries = state.dictionaryEntries) {
  dictionaryReplacementIndex = createDictionaryReplacementIndex(entries);
}

function applyDictionaryReplacements(text, detectedLanguage) {
  const input = String(text || '').trim();
  if (!input || !Array.isArray(state.dictionaryEntries) || state.dictionaryEntries.length === 0) {
    return input;
  }

  const language = String(detectedLanguage || '')
    .trim()
    .toLowerCase();
  const scopedSources =
    !language || language === 'unknown'
      ? dictionaryReplacementIndex.all
      : dictionaryReplacementIndex[language] || dictionaryReplacementIndex.all;

  if (scopedSources.length === 0) {
    return input;
  }

  let output = input;
  const tokenPrefix = `__MEGAFALA_DICT_${Date.now().toString(36)}__`;
  const replacements = [];

  for (const entry of scopedSources) {
    output = output.replace(entry.pattern, () => {
      const token = `${tokenPrefix}${replacements.length}__`;
      replacements.push({
        token,
        target: entry.target,
      });
      return token;
    });
  }

  for (const replacement of replacements) {
    output = output.replaceAll(replacement.token, replacement.target);
  }

  return output;
}

function getNextDictationSessionId() {
  return Number(state.dictationSessionId || 0) + 1;
}

function normalizeCaptureMode(mode) {
  return mode === 'hands-free' ? 'hands-free' : 'hold';
}

function getWaitingNotice(captureMode) {
  if (state.switchingModel) {
    return captureMode === 'hands-free'
      ? translateMain('waitingSwitchHandsFree', {
          model: getModelDisplayName(state.model),
        })
      : translateMain('waitingSwitchHold', {
          model: getModelDisplayName(state.model),
        });
  }

  return captureMode === 'hands-free'
    ? translateMain('waitingBootHandsFree')
    : translateMain('waitingBootHold');
}

function isHandsFreeNotice(notice) {
  return String(notice || '').toLowerCase().includes('hands-free');
}

function clearHandsFreeNotice(notice = state.notice) {
  return isHandsFreeNotice(notice) ? '' : notice;
}

function extractSessionId(payload) {
  const value = Number(payload?.session_id);
  return Number.isInteger(value) && value > 0 ? value : null;
}

function isCurrentDictationSession(sessionId) {
  return sessionId === null || sessionId === state.dictationSessionId;
}

function hasOngoingTranscription() {
  return (
    state.phase === 'transcribing' ||
    state.pendingPaste ||
    (state.dictationSessionId !== null && !state.listening)
  );
}

function insertTextIntoFocusedApp(text) {
  return new Promise((resolve, reject) => {
    if (process.platform === 'darwin') {
      const previousClipboard = clipboard.readText();
      clipboard.writeText(String(text || ''));

      const appleScript = [
        'tell application "System Events"',
        '  keystroke "v" using command down',
        'end tell',
      ];
      const osascript = spawn('osascript', appleScript.flatMap((line) => ['-e', line]));
      let stderr = '';

      osascript.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });

      osascript.on('error', (error) => {
        clipboard.writeText(previousClipboard);
        reject(error);
      });

      osascript.on('close', (code) => {
        setTimeout(() => {
          if (previousClipboard) {
            clipboard.writeText(previousClipboard);
          } else {
            clipboard.clear();
          }
        }, 120);

        if (code === 0) {
          resolve();
          return;
        }

        reject(new Error(stderr || `osascript exited with code ${code}`));
      });
      return;
    }

    const scriptPath = path.join(getRuntimeBasePath(), 'scripts', 'send_text.ps1');
    const encodedText = Buffer.from(text, 'utf8').toString('base64');
    const powershell = spawn(
      'powershell.exe',
      ['-NoProfile', '-STA', '-ExecutionPolicy', 'Bypass', '-File', scriptPath, '-EncodedText', encodedText],
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

function getSystemAudioControllerScriptPath() {
  return path.join(getRuntimeBasePath(), 'scripts', 'system_audio_controller.ps1');
}

function sendOverlayFeedback(type, payload = {}) {
  const message = { type, payload };
  syncAudioControllerConfig();

  if (!overlayWindow || overlayWindow.isDestroyed() || overlayWindow.webContents.isLoading()) {
    pendingOverlayFeedbacks.push(message);
    return;
  }

  overlayWindow.webContents.send('overlay-feedback', message);
}

function resetDictationFeedbackState() {
  currentDictationStartedAt = 0;
}

function playHandsFreeSoundIfEligible() {
  if (!currentDictationStartedAt) {
    return;
  }

  if (Date.now() - currentDictationStartedAt < 1000) {
    return;
  }

  sendOverlayFeedback('play-sound', { sound: 'handsfree' });
}

function flushPendingOverlayFeedbacks() {
  if (!overlayWindow || overlayWindow.isDestroyed() || overlayWindow.webContents.isLoading()) {
    return;
  }

  while (pendingOverlayFeedbacks.length > 0) {
    overlayWindow.webContents.send('overlay-feedback', pendingOverlayFeedbacks.shift());
  }
}

function collectAppAudioPids() {
  const pids = new Set([process.pid]);

  try {
    for (const metric of app.getAppMetrics()) {
      const pid = Number(metric?.pid);
      if (Number.isInteger(pid) && pid > 0) {
        pids.add(pid);
      }
    }
  } catch (_error) {
    // Best effort. Fallback to known window processes below.
  }

  for (const windowRef of [mainWindow, overlayWindow]) {
    if (!windowRef || windowRef.isDestroyed()) {
      continue;
    }

    const pid = Number(windowRef.webContents.getOSProcessId());
    if (Number.isInteger(pid) && pid > 0) {
      pids.add(pid);
    }
  }

  return [...pids];
}

function syncAudioControllerConfig() {
  sendAudioCommand('configure', {
    excluded_pids: collectAppAudioPids(),
    duck_volume: 0,
  });
}

function sendAudioCommand(type, payload = {}) {
  if (!audioProcess || !audioProcess.stdin.writable) {
    return;
  }

  audioProcess.stdin.write(`${JSON.stringify({ type, payload })}\n`);
}

function engageCaptureMute() {
  if (process.platform === 'win32') {
    captureMuteDepth += 1;
    if (captureMuteDepth > 1) {
      return;
    }
    sendAudioCommand('capture-begin');
  }
}

function releaseCaptureMute(force = false) {
  if (process.platform === 'win32') {
    if (force) {
      const shouldNotify = captureMuteDepth > 0;
      captureMuteDepth = 0;
      if (shouldNotify) {
        sendAudioCommand('capture-end');
      }
      return;
    }

    if (captureMuteDepth <= 0) {
      return;
    }

    captureMuteDepth -= 1;
    if (captureMuteDepth > 0) {
      return;
    }
    sendAudioCommand('capture-end');
  }
}

function getLatestSavedTranscriptionText() {
  const latestHistoryEntry = state.history[0];
  if (latestHistoryEntry && typeof latestHistoryEntry.text === 'string' && latestHistoryEntry.text.trim()) {
    return latestHistoryEntry.text.trim();
  }

  if (typeof state.latestFinal === 'string' && state.latestFinal.trim()) {
    return state.latestFinal.trim();
  }

  return '';
}

function getLatestPersistedTranscriptionText() {
  try {
    const persisted = loadPersistentState();
    const latestHistoryEntry = persisted.history[0];
    if (latestHistoryEntry && typeof latestHistoryEntry.text === 'string' && latestHistoryEntry.text.trim()) {
      return latestHistoryEntry.text.trim();
    }
  } catch (_error) {
    // Best effort fallback for the paste-last shortcut.
  }

  return '';
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function requestPasteLatestTranscription(source = 'unknown') {
  const now = Date.now();
  if (now - lastPasteLastRequestAt < 300) {
    return;
  }

  lastPasteLastRequestAt = now;
  void pasteLatestTranscription(source);
}

async function pasteLatestTranscription() {
  const nextPhase = state.listening ? 'listening' : 'idle';

  setOverlayAudioLevel(0);
  setState({
    pendingPaste: true,
    phase: 'transcribing',
    error: '',
  });

  try {
    await delay(PASTE_SHORTCUT_SETTLE_DELAY_MS);
    const latestText = getLatestSavedTranscriptionText() || getLatestPersistedTranscriptionText();
    if (!latestText) {
      setState({
        error: 'Nenhuma transcricao salva disponivel para colar.',
      });
      return;
    }

    await insertTextIntoFocusedApp(normalizeTextForPaste(latestText));
    if (state.error === 'Nenhuma transcricao salva disponivel para colar.') {
      setState({
        error: '',
      });
    }
  } catch (error) {
    setState({
      error: `Falha ao colar a ultima transcricao: ${error.message}`,
    });
  } finally {
    setState({
      pendingPaste: false,
      phase: nextPhase,
    });
  }
}

function startListening(mode = 'hold') {
  const captureMode = normalizeCaptureMode(mode);

  if (Date.now() < suppressStartRequestsUntil) {
    return snapshotState();
  }

  if (!state.engineReady || !state.serviceOnline) {
    setState({
      pendingStartMode: captureMode,
      notice: getWaitingNotice(captureMode),
      error: '',
    });
    return snapshotState();
  }

  if (hasOngoingTranscription()) {
    releaseCaptureMute(true);
    setState({
      pendingStartMode: null,
      notice: translateMain('transcriptionBusy'),
      error: '',
    });
    return snapshotState();
  }

  if (state.listening || state.captureMode !== null) {
    if (captureMode === 'hands-free' && state.captureMode !== 'hands-free') {
      setState({
        captureMode,
        notice: translateMain('handsFreeActive', {
          shortcut: formatShortcutForDisplay(state.shortcut),
        }),
        error: '',
      });
      playHandsFreeSoundIfEligible();
    }
    return snapshotState();
  }

  const sessionId = getNextDictationSessionId();
  currentDictationStartedAt = Date.now();
  setOverlayAudioLevel(0);
  setState({
    captureMode,
    dictationSessionId: sessionId,
    pendingStartMode: null,
    notice:
      captureMode === 'hands-free'
        ? translateMain('handsFreeActive', {
            shortcut: formatShortcutForDisplay(state.shortcut),
          })
        : clearHandsFreeNotice(),
    error: '',
  });
  if (Date.now() >= suppressStartSoundUntil) {
    sendOverlayFeedback('play-sound', { sound: 'start', interrupt: true });
  }
  suppressStartSoundUntil = 0;
  suppressStartRequestsUntil = 0;
  engageCaptureMute();
  sendServiceCommand('start', { session_id: sessionId });
  return snapshotState();
}

function stopListening() {
  const nextNotice = clearHandsFreeNotice();
  const hadLiveCapture =
    state.captureMode !== null || state.listening || state.dictationSessionId !== null;
  resetDictationFeedbackState();
  releaseCaptureMute(true);

  if (!state.listening && !state.pendingStartMode && state.dictationSessionId === null) {
    setOverlayAudioLevel(0);
    setState({
      captureMode: null,
      notice: nextNotice,
    });
    return snapshotState();
  }

  if (!state.serviceOnline || !state.engineReady) {
    setOverlayAudioLevel(0);
    setState({
      pendingStartMode: null,
      captureMode: null,
      notice: nextNotice,
    });
    return snapshotState();
  }

  setState({
    pendingStartMode: null,
    captureMode: null,
    notice: nextNotice,
  });
  if (hadLiveCapture) {
    sendOverlayFeedback('play-sound', { sound: 'close', interrupt: true });
  }
  setOverlayAudioLevel(0);
  if (state.dictationSessionId !== null) {
    sendServiceCommand('stop', { session_id: state.dictationSessionId });
  }
  return snapshotState();
}

function cancelDictation(source = 'escape') {
  const hadActiveDictation =
    state.listening ||
    state.pendingStartMode !== null ||
    state.pendingPaste ||
    state.phase === 'transcribing' ||
    state.dictationSessionId !== null;

  if (!hadActiveDictation) {
    return snapshotState();
  }

  const nextNotice =
    source === 'escape' ? 'Ditado cancelado por Esc.' : 'Ditado cancelado.';
  const sessionId = state.dictationSessionId;
  resetDictationFeedbackState();

  setState({
    hotkeyPressed: false,
    listening: false,
    pendingStartMode: null,
    captureMode: null,
    dictationSessionId: null,
    pendingPaste: false,
    partial: '',
    phase: 'idle',
    notice: nextNotice,
    error: '',
  });
  setOverlayAudioLevel(0);
  releaseCaptureMute(true);
  sendOverlayFeedback('play-sound', { sound: 'cancel', interrupt: true });

  if (state.serviceOnline && state.engineReady && sessionId !== null) {
    sendServiceCommand('cancel', { session_id: sessionId });
  }

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
  savePersistentState();
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
  const sessionId = extractSessionId(payload);

  switch (event.type) {
    case 'ready':
      {
        const pendingStartMode = state.pendingStartMode;
        const shouldPlayLoadedFeedback = !hasPlayedLoadedFeedback;
        setOverlayAudioLevel(0);
        setState({
          engineReady: true,
          phase: 'idle',
          serviceOnline: true,
          model: payload.model || state.model,
          device: payload.device || state.device,
          deviceNote: payload.note || state.deviceNote,
          switchingModel: false,
          pendingPaste: false,
          notice: pendingStartMode !== 'hands-free' ? '' : state.notice,
          error: '',
        });
        if (shouldPlayLoadedFeedback) {
          hasPlayedLoadedFeedback = true;
          sendOverlayFeedback('loaded-ready', {
            sound: 'loaded',
          });
        }
        if (pendingStartMode === 'hands-free' || (pendingStartMode === 'hold' && state.hotkeyPressed)) {
          startListening(pendingStartMode);
        }
        break;
      }
    case 'state':
      if (!isCurrentDictationSession(sessionId)) {
        break;
      }
      if (!payload.listening || payload.phase !== 'listening') {
        setOverlayAudioLevel(0);
      }
      setState({
        listening: Boolean(payload.listening),
        dictationSessionId: payload.listening ? sessionId || state.dictationSessionId : state.dictationSessionId,
        phase:
          state.pendingPaste && (payload.phase === 'idle' || payload.phase === 'transcribing')
            ? 'transcribing'
            : payload.phase || state.phase,
      });

      if (!payload.listening && payload.phase === 'idle' && sessionId !== null) {
        setState({
          dictationSessionId: null,
        });
      }
      break;
    case 'level':
      if (!isCurrentDictationSession(sessionId)) {
        break;
      }
      setOverlayAudioLevel(payload.level);
      break;
    case 'partial':
      if (!isCurrentDictationSession(sessionId)) {
        break;
      }
      setState({
        partial: payload.text || '',
      });
      break;
    case 'final': {
      if (!isCurrentDictationSession(sessionId)) {
        break;
      }
      const text = String(payload.text || '').trim();
      if (!text) {
        break;
      }

      const resolvedText = applyDictionaryReplacements(text, payload.language);
      const pasteText = normalizeTextForPaste(resolvedText);
      const entry = {
        model: payload.model || state.model,
        text: resolvedText,
        language: payload.language || 'unknown',
        transcriptionMs: payload.transcription_ms || 0,
        audioDurationMs: payload.audio_duration_ms || 0,
        wordCount: countWords(resolvedText),
        timestamp: new Date().toISOString(),
      };
      const history = [entry, ...state.history];
      const usageStats = recordUsage(state.usageStats, entry);

      setState({
        latestFinal: resolvedText,
        latestLanguage: payload.language || 'unknown',
        partial: '',
        history,
        usageStats,
        dictationSessionId: sessionId,
        pendingPaste: true,
        phase: 'transcribing',
        error: '',
      });
      savePersistentState();

      recordModelTiming(payload.model || state.model, payload.transcription_ms);

      try {
        await insertTextIntoFocusedApp(pasteText);
      } catch (error) {
        setState({
          error: `Falha ao colar texto no campo ativo: ${error.message}`,
        });
      } finally {
        setState({
          dictationSessionId: state.listening ? state.dictationSessionId : null,
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
      resetDictationFeedbackState();
      releaseCaptureMute(true);
      setState({
        notice: '',
        error: payload.message || 'Erro no motor de ditado.',
        pendingPaste: false,
        pendingStartMode: null,
        captureMode: null,
        dictationSessionId: null,
        phase: 'error',
      });
      setOverlayAudioLevel(0);
      break;
    default:
      break;
  }
}

function handleHotkeyEvent(event) {
  const payload = event.payload || {};
  const hotkeyMode = normalizeCaptureMode(payload.mode);

  switch (event.type) {
    case 'ready':
      setState({
        hotkeyOnline: true,
        shortcut: payload.shortcut || state.shortcut,
        pasteLastShortcut:
          payload.paste_last_shortcut || payload.pasteLastShortcut || state.pasteLastShortcut,
      });
      break;
    case 'hotkey-pressed':
      if (hasOngoingTranscription()) {
        ignoreNextHotkeyRelease = true;
        releaseCaptureMute(true);
        setState({
          hotkeyPressed: false,
          notice: translateMain('transcriptionBusy'),
          error: '',
        });
        break;
      }
      setState({
        hotkeyPressed: true,
      });
      if (state.captureMode === 'hands-free' || state.pendingStartMode === 'hands-free') {
        suppressStartSoundUntil = Date.now() + 1200;
        suppressStartRequestsUntil = Date.now() + 450;
        ignoreNextHotkeyRelease = true;
        stopListening();
        break;
      }

      ignoreNextHotkeyRelease = false;
      startListening(hotkeyMode);
      break;
    case 'hotkey-mode-changed':
      startListening(hotkeyMode);
      break;
    case 'hotkey-released':
      setState({
        hotkeyPressed: false,
      });
      if (ignoreNextHotkeyRelease) {
        ignoreNextHotkeyRelease = false;
        break;
      }
      if (state.captureMode === 'hands-free' || state.pendingStartMode === 'hands-free') {
        break;
      }

      if (state.pendingStartMode === 'hold') {
        setState({
          pendingStartMode: null,
          notice: clearHandsFreeNotice(),
        });
      }
      stopListening();
      break;
    case 'cancel-requested':
      cancelDictation(payload.source || 'escape');
      break;
    case 'paste-last-requested':
      if (!pasteLastRegisteredViaElectron) {
        requestPasteLatestTranscription('python-hotkey-listener');
      }
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

function handleAudioControllerEvent(event) {
  const message = event?.payload?.message;

  switch (event.type) {
    case 'ready':
      syncAudioControllerConfig();
      if (captureMuteDepth > 0) {
        sendAudioCommand('capture-begin');
      }
      break;
    case 'warning':
      if (message) {
        console.warn('[audio-mute]', message);
      }
      break;
    case 'error':
      console.warn('[audio-mute]', message || 'Falha no controlador de audio do sistema.');
      break;
    default:
      break;
  }
}

function attachJsonReader(childProcess, onEvent, onInvalidJson) {
  if (childProcess.stdout) {
    childProcess.stdout.setEncoding('utf8');
  }

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

function configureTextPipes(childProcess) {
  if (childProcess.stdout) {
    childProcess.stdout.setEncoding('utf8');
  }

  if (childProcess.stderr) {
    childProcess.stderr.setEncoding('utf8');
  }
}

function unregisterPasteLastShortcut() {
  if (pasteLastRegisteredAccelerator) {
    globalShortcut.unregister(pasteLastRegisteredAccelerator);
    pasteLastRegisteredAccelerator = null;
  }

  pasteLastRegisteredViaElectron = false;
}

function registerPasteLastShortcut() {
  unregisterPasteLastShortcut();

  const accelerator = shortcutToElectronAccelerator(state.pasteLastShortcut);
  if (!accelerator) {
    setState({
      error: `Atalho invalido para colar a ultima transcricao: ${state.pasteLastShortcut}`,
    });
    return false;
  }

  try {
    const registered = globalShortcut.register(accelerator, () => {
      requestPasteLatestTranscription('electron-global-shortcut');
    });

    pasteLastRegisteredViaElectron = registered;
    if (!registered) {
      setState({
        error: `Nao foi possivel registrar o atalho global ${state.pasteLastShortcut} para colar a ultima transcricao.`,
      });
      return false;
    }

    pasteLastRegisteredAccelerator = accelerator;
    return true;
  } catch (error) {
    pasteLastRegisteredViaElectron = false;
    setState({
      error: `Falha ao registrar o atalho ${state.pasteLastShortcut}: ${error.message}`,
    });
    return false;
  }
}

function bootAudioController() {
  if (process.platform !== 'win32') {
    return;
  }

  const powershellScript = getSystemAudioControllerScriptPath();
  const localToken = ++audioToken;
  const localProcess = spawn(
    'powershell.exe',
    ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', powershellScript],
    {
      cwd: getRuntimeBasePath(),
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    },
  );

  configureTextPipes(localProcess);
  audioProcess = localProcess;
  audioReader = attachJsonReader(
    localProcess,
    (event) => {
      if (localToken !== audioToken) {
        return;
      }
      handleAudioControllerEvent(event);
    },
    (error) => {
      if (localToken !== audioToken) {
        return;
      }
      console.warn('[audio-mute] Saida invalida do controlador de audio:', error.message);
    },
  );

  localProcess.stderr.on('data', (chunk) => {
    if (localToken !== audioToken) {
      return;
    }

    const message = String(chunk || '').trim();
    if (message) {
      console.warn('[audio-mute]', message);
    }
  });

  localProcess.on('error', (error) => {
    if (localToken !== audioToken) {
      return;
    }

    console.warn('[audio-mute] Nao foi possivel iniciar o controlador de audio:', error.message);
  });

  localProcess.on('close', () => {
    if (localToken !== audioToken) {
      return;
    }

    audioProcess = null;
    audioReader = null;
  });
}

function bootDictationService() {
  const launchSpec = getWorkerLaunchSpec('dictation_service');
  const localToken = ++serviceToken;
  const localProcess = spawn(launchSpec.command, launchSpec.args, {
    cwd: getRuntimeBasePath(),
    env: getServiceEnv(),
    stdio: ['pipe', 'pipe', 'pipe'],
    windowsHide: true,
  });

  configureTextPipes(localProcess);
  serviceProcess = localProcess;
  setOverlayAudioLevel(0);
  setState({
    phase: 'booting',
    serviceOnline: true,
    engineReady: false,
    listening: false,
    captureMode: null,
    dictationSessionId: null,
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
      setOverlayAudioLevel(0);
      setState({
        error: `Saida invalida do worker Python: ${error.message}`,
      });
    },
  );

  localProcess.stderr.on('data', (chunk) => {
    if (localToken !== serviceToken) {
      return;
    }

    const message = String(chunk || '').trim();
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

    setOverlayAudioLevel(0);
    releaseCaptureMute(true);
    setState({
      serviceOnline: false,
      engineReady: false,
      phase: 'error',
      pendingStartMode: null,
      captureMode: null,
      dictationSessionId: null,
      error: `Nao foi possivel iniciar o worker Python: ${error.message}`,
    });
  });

  localProcess.on('close', (code) => {
    if (localToken !== serviceToken) {
      return;
    }

    serviceProcess = null;
    setOverlayAudioLevel(0);
    releaseCaptureMute(true);
    setState({
      serviceOnline: false,
      engineReady: false,
      listening: false,
      pendingStartMode: null,
      captureMode: null,
      dictationSessionId: null,
      phase: 'offline',
      partial: '',
      error: code === 0 ? state.error : `Worker Python encerrado com codigo ${code}.`,
    });
  });
}

function bootHotkeyListener() {
  const launchSpec = getWorkerLaunchSpec('hotkey_listener');
  const localToken = ++hotkeyToken;
  const localProcess = spawn(launchSpec.command, launchSpec.args, {
    cwd: getRuntimeBasePath(),
    env: getServiceEnv(),
    stdio: ['pipe', 'pipe', 'pipe'],
    windowsHide: true,
  });

  configureTextPipes(localProcess);
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

    const message = String(chunk || '').trim();
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
  resetDictationFeedbackState();
  releaseCaptureMute(true);
  setState({
    engineReady: false,
    serviceOnline: false,
    listening: false,
    hotkeyPressed: false,
    pendingStartMode: null,
    captureMode: null,
    dictationSessionId: null,
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
  const nextLanguages = Object.prototype.hasOwnProperty.call(patch, 'allowedLanguages')
    ? normalizeDetectionLanguages(patch.allowedLanguages)
    : state.allowedLanguages;
  const nextInterfaceLanguage = Object.prototype.hasOwnProperty.call(patch, 'interfaceLanguage')
    ? normalizeInterfaceLanguage(patch.interfaceLanguage)
    : state.interfaceLanguage;
  const nextModel = patch.model ? normalizeModel(patch.model) : state.model;
  const nextShowOverlayBar =
    typeof patch.showOverlayBar === 'boolean' ? patch.showOverlayBar : state.showOverlayBar;
  const nextSoundEffectsEnabled =
    typeof patch.soundEffectsEnabled === 'boolean'
      ? patch.soundEffectsEnabled
      : state.soundEffectsEnabled;
  const nextLaunchAtLogin =
    typeof patch.launchAtLogin === 'boolean' ? patch.launchAtLogin : state.launchAtLogin;
  const nextDictionaryEntries = Object.prototype.hasOwnProperty.call(patch, 'dictionaryEntries')
    ? normalizeDictionaryEntries(patch.dictionaryEntries)
    : state.dictionaryEntries;

  const modelChanged = nextModel !== state.model;
  const languagesChanged = nextLanguages.join(',') !== state.allowedLanguages.join(',');
  const interfaceLanguageChanged = nextInterfaceLanguage !== state.interfaceLanguage;
  const overlayChanged = nextShowOverlayBar !== state.showOverlayBar;
  const soundEffectsChanged = nextSoundEffectsEnabled !== state.soundEffectsEnabled;
  const launchAtLoginChanged = nextLaunchAtLogin !== state.launchAtLogin;
  const dictionaryChanged =
    JSON.stringify(nextDictionaryEntries) !== JSON.stringify(state.dictionaryEntries);

  let notice = state.notice;
  if (languagesChanged) {
    notice = translateMain(
      'activeLanguages',
      {
        summary: formatDetectionLanguagesSummary(nextLanguages, nextInterfaceLanguage),
      },
      nextInterfaceLanguage,
    );
  } else if (modelChanged) {
    notice = translateMain(
      'switchingModel',
      { model: getModelDisplayName(nextModel, nextInterfaceLanguage) },
      nextInterfaceLanguage,
    );
  } else if (overlayChanged) {
    notice = translateMain(
      nextShowOverlayBar ? 'overlayOn' : 'overlayOff',
      {},
      nextInterfaceLanguage,
    );
  } else if (soundEffectsChanged) {
    notice = translateMain(
      nextSoundEffectsEnabled ? 'soundOn' : 'soundOff',
      {},
      nextInterfaceLanguage,
    );
  } else if (launchAtLoginChanged) {
    notice = translateMain(
      nextLaunchAtLogin ? 'launchAtLoginOn' : 'launchAtLoginOff',
      {},
      nextInterfaceLanguage,
    );
  } else if (dictionaryChanged) {
    notice =
      nextDictionaryEntries.length > 0
        ? `Dicionário ativo com ${nextDictionaryEntries.length} regra(s).`
        : 'Dicionário limpo.';
  }

  if (dictionaryChanged) {
    notice = nextDictionaryEntries.length > 0
      ? translateMain(
          'dictionaryOn',
          { count: nextDictionaryEntries.length },
          nextInterfaceLanguage,
        )
      : translateMain('dictionaryOff', {}, nextInterfaceLanguage);
  }

  setState({
    allowedLanguages: nextLanguages,
    interfaceLanguage: nextInterfaceLanguage,
    model: nextModel,
    showOverlayBar: nextShowOverlayBar,
    soundEffectsEnabled: nextSoundEffectsEnabled,
    launchAtLogin: nextLaunchAtLogin,
    dictionaryEntries: nextDictionaryEntries,
    notice,
    error: '',
  });
  if (dictionaryChanged) {
    rebuildDictionaryReplacementIndex(nextDictionaryEntries);
  }

  savePersistentState();

  if (launchAtLoginChanged) {
    syncLaunchAtLoginSetting();
  }

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
    notice: translateMain('modelStatsReset'),
  });
  savePersistentState();
  return snapshotState();
}

ipcMain.handle('copy-text', async (_event, text) => {
  clipboard.writeText(String(text || ''));
  return true;
});

function shutdownChildren() {
  resetDictationFeedbackState();
  releaseCaptureMute(true);

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

  try {
    sendAudioCommand('shutdown');
  } catch (_error) {
    // Best effort.
  }
}

ipcMain.handle('get-state', async () => snapshotState());
ipcMain.handle('update-settings', async (_event, patch) => applySettings(patch || {}));
ipcMain.handle('reset-model-stats', async () => resetModelStats());
ipcMain.on('overlay-drag-move', (_event, position) => {
  positionOverlayWindow(position);
});
ipcMain.on('overlay-drag-end', (_event, position) => {
  positionOverlayWindow(position, true);
});

app.on('second-instance', () => {
  showMainWindow();
});

app.whenReady().then(() => {
  app.setAppUserModelId(APP_ID);
  ensureRuntimeDirectories();

  const persistedState = loadPersistentState();
  setState({
    allowedLanguages: persistedState.preferences.allowedLanguages,
    interfaceLanguage: persistedState.preferences.interfaceLanguage,
    model: persistedState.preferences.model,
    modelStats: persistedState.modelStats,
    history: persistedState.history,
    usageStats: persistedState.usageStats,
    showOverlayBar: persistedState.preferences.showOverlayBar,
    soundEffectsEnabled: persistedState.preferences.soundEffectsEnabled,
    launchAtLogin: persistedState.preferences.launchAtLogin,
    dictionaryEntries: persistedState.preferences.dictionaryEntries,
    overlayPosition: defaults.overlayPosition,
  });
  shouldStartHiddenOnLaunch =
    shouldStartHiddenOnLaunch || Boolean(app.getLoginItemSettings().wasOpenedAsHidden);
  rebuildDictionaryReplacementIndex(persistedState.preferences.dictionaryEntries);
  syncLaunchAtLoginSetting();
  registerPasteLastShortcut();

  createTray();
  createWindow();
  createOverlayWindow();
  bootAudioController();
  bootDictationService();
  bootHotkeyListener();

  screen.on('display-added', positionOverlayWindow);
  screen.on('display-removed', positionOverlayWindow);
  screen.on('display-metrics-changed', positionOverlayWindow);

  app.on('activate', () => {
    showMainWindow();
    if (!overlayWindow || overlayWindow.isDestroyed()) {
      createOverlayWindow();
    }
  });
});

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('will-quit', () => {
  unregisterPasteLastShortcut();
  shutdownChildren();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin' && isQuitting) {
    app.quit();
  }
});
