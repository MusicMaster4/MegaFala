const SUPPORTED_INTERFACE_LANGUAGES = [
  'en', 'pt-BR', 'es', 'fr', 'de', 'it', 'nl', 'el', 'ru', 'zh-CN', 'ja', 'ko', 'ar', 'hi', 'tr',
];

const TRANSLATIONS = {
  en: {
    appTagline: 'Write at the speed of thought.',
    globalShortcut: 'Global shortcut',
    dictionary: 'Dictionary',
    settings: 'Settings',
    streak: 'Streak',
    daysUsed: 'Days used',
    wordsSpoken: 'Words spoken',
    averageWpm: 'Average WPM',
    latestTranscriptions: 'Latest transcriptions',
    historyCopy: 'Local history for the latest 100 messages.',
    search: 'Search',
    historySearchPlaceholder: 'Search words in transcriptions...',
    noTranscriptions: 'No transcriptions yet.',
    noSearchResults: 'No transcriptions found for this search.',
    settingsCopy: 'Appearance, language, and AI model preferences.',
    interfaceLanguage: 'Interface language',
    interfaceLanguageCopy: 'Search and switch the app language instantly. The app defaults to English.',
    searchLanguage: 'Search language',
    languageSearchPlaceholder: 'Search your language...',
    noLanguageResults: 'No languages match your search.',
    selectedLanguage: 'Selected',
    appearance: 'Appearance',
    darkMode: 'Dark mode',
    lightMode: 'Light mode',
    floatingBar: 'Floating bar',
    showOverlay: 'Show global overlay',
    showOverlayCopy: 'Display the recording indicator above any app.',
    soundEffects: 'Sound feedback',
    soundEffectsCopy: 'Play sounds on load, start, stop, cancel, and hands-free activation.',
    detectionLanguages: 'Detection languages',
    transcriptionModels: 'Transcription models',
    resetAverage: 'Reset average',
    systemDiagnostics: 'System diagnostics',
    activeModel: 'Active model',
    processing: 'Processing',
    backend: 'Backend',
    close: 'Close',
    noNotes: 'No notes.',
    dictionaryCopy: 'Replace terms automatically in the final text.',
    dictionarySources: 'Rule inputs',
    dictionarySourcesPlaceholder: 'One variation per line\nmega fala\nmegafala',
    dictionarySourcesHint: 'Add as many variations as needed. Use one entry per line.',
    dictionaryTarget: 'Final replacement',
    dictionaryTargetPlaceholder: 'Example: MegaFala',
    activeLanguages: 'Active languages',
    cancelEditing: 'Cancel editing',
    addRule: 'Add rule',
    saveRule: 'Save rule',
    activeRules: 'Active rules',
    dictionaryRulesCopy: 'Replacement happens before the text enters history and the active field.',
    noRules: 'No rules yet.',
    entries: 'Inputs',
    output: 'Output',
    edit: 'Edit',
    remove: 'Remove',
    fillRuleError: 'Fill in the inputs and the replacement.',
    copy: 'Copy',
    copied: 'Copied',
  },
  'pt-BR': {
    appTagline: 'Escreva na velocidade do pensamento.',
    globalShortcut: 'Atalho global',
    dictionary: 'Dicionário',
    settings: 'Configurações',
    streak: 'Sequência',
    daysUsed: 'Dias de uso',
    wordsSpoken: 'Palavras faladas',
    averageWpm: 'Média WPM',
    latestTranscriptions: 'Últimas transcrições',
    historyCopy: 'Histórico local das últimas 100 mensagens.',
    search: 'Pesquisar',
    historySearchPlaceholder: 'Buscar palavras nas transcrições...',
    noTranscriptions: 'Nenhuma transcrição ainda.',
    noSearchResults: 'Nenhuma transcrição encontrada para essa busca.',
    settingsCopy: 'Ajustes de aparência, idioma e modelo de IA.',
    interfaceLanguage: 'Idioma da interface',
    interfaceLanguageCopy: 'Pesquise e troque o idioma do app na hora. O padrão é inglês.',
    searchLanguage: 'Pesquisar idioma',
    languageSearchPlaceholder: 'Pesquise seu idioma...',
    noLanguageResults: 'Nenhum idioma corresponde à busca.',
    selectedLanguage: 'Selecionado',
    appearance: 'Aparência',
    darkMode: 'Modo escuro',
    lightMode: 'Modo claro',
    floatingBar: 'Barra flutuante',
    showOverlay: 'Exibir overlay global',
    showOverlayCopy: 'Mostra o indicador de gravação acima de qualquer app.',
    soundEffects: 'Sons de feedback',
    soundEffectsCopy: 'Toca sons ao carregar, iniciar, encerrar, cancelar e ativar hands-free.',
    detectionLanguages: 'Idiomas de detecção',
    transcriptionModels: 'Modelos de transcrição',
    resetAverage: 'Resetar média',
    systemDiagnostics: 'Diagnóstico do sistema',
    activeModel: 'Modelo ativo',
    processing: 'Processamento',
    backend: 'Backend',
    close: 'Fechar',
    noNotes: 'Sem observações.',
    dictionaryCopy: 'Troque termos automaticamente no texto final.',
    dictionarySources: 'Entradas da regra',
    dictionarySourcesPlaceholder: 'Uma variação por linha\nmega fala\nmegafala',
    dictionarySourcesHint: 'Adicione quantas variações quiser. Use uma entrada por linha.',
    dictionaryTarget: 'Substituição final',
    dictionaryTargetPlaceholder: 'Ex.: MegaFala',
    activeLanguages: 'Idiomas ativos',
    cancelEditing: 'Cancelar edição',
    addRule: 'Adicionar regra',
    saveRule: 'Salvar regra',
    activeRules: 'Regras ativas',
    dictionaryRulesCopy: 'A substituição acontece antes do texto entrar no histórico e no campo ativo.',
    noRules: 'Nenhuma regra cadastrada.',
    entries: 'Entradas',
    output: 'Saída',
    edit: 'Editar',
    remove: 'Remover',
    fillRuleError: 'Preencha as entradas e a substituição.',
    copy: 'Copiar',
    copied: 'Copiado',
  },
};

Object.assign(TRANSLATIONS, {
  es: { settings: 'Configuración', interfaceLanguage: 'Idioma de la interfaz', interfaceLanguageCopy: 'Busca y cambia el idioma de la app al instante. El valor predeterminado es inglés.', searchLanguage: 'Buscar idioma', languageSearchPlaceholder: 'Busca tu idioma...', selectedLanguage: 'Seleccionado', appearance: 'Apariencia', darkMode: 'Modo oscuro', lightMode: 'Modo claro', floatingBar: 'Barra flotante', detectionLanguages: 'Idiomas de detección', transcriptionModels: 'Modelos de transcripción', systemDiagnostics: 'Diagnóstico del sistema', close: 'Cerrar', dictionary: 'Diccionario' },
  fr: { settings: 'Paramètres', interfaceLanguage: "Langue de l'interface", interfaceLanguageCopy: "Recherchez et changez instantanément la langue de l'application. Anglais par défaut.", searchLanguage: 'Rechercher une langue', languageSearchPlaceholder: 'Recherchez votre langue...', selectedLanguage: 'Sélectionné', appearance: 'Apparence', darkMode: 'Mode sombre', lightMode: 'Mode clair', floatingBar: 'Barre flottante', detectionLanguages: 'Langues de détection', transcriptionModels: 'Modèles de transcription', systemDiagnostics: 'Diagnostic système', close: 'Fermer', dictionary: 'Dictionnaire' },
  de: { settings: 'Einstellungen', interfaceLanguage: 'Sprache der Oberfläche', interfaceLanguageCopy: 'Suche und wechsle die App-Sprache sofort. Standard ist Englisch.', searchLanguage: 'Sprache suchen', languageSearchPlaceholder: 'Sprache suchen...', selectedLanguage: 'Ausgewählt', appearance: 'Darstellung', darkMode: 'Dunkelmodus', lightMode: 'Hellmodus', floatingBar: 'Schwebende Leiste', detectionLanguages: 'Erkennungssprachen', transcriptionModels: 'Transkriptionsmodelle', systemDiagnostics: 'Systemdiagnose', close: 'Schließen', dictionary: 'Wörterbuch' },
  it: { settings: 'Impostazioni', interfaceLanguage: "Lingua dell'interfaccia", interfaceLanguageCopy: "Cerca e cambia subito la lingua dell'app. La predefinita è l'inglese.", searchLanguage: 'Cerca lingua', languageSearchPlaceholder: 'Cerca la tua lingua...', selectedLanguage: 'Selezionato', appearance: 'Aspetto', darkMode: 'Modalità scura', lightMode: 'Modalità chiara', floatingBar: 'Barra flottante', detectionLanguages: 'Lingue di rilevamento', transcriptionModels: 'Modelli di trascrizione', systemDiagnostics: 'Diagnostica di sistema', close: 'Chiudi', dictionary: 'Dizionario' },
  nl: { settings: 'Instellingen', interfaceLanguage: 'Interfacetaal', interfaceLanguageCopy: 'Zoek en wissel direct van app-taal. Engels is de standaard.', searchLanguage: 'Taal zoeken', languageSearchPlaceholder: 'Zoek je taal...', selectedLanguage: 'Geselecteerd', appearance: 'Weergave', darkMode: 'Donkere modus', lightMode: 'Lichte modus', floatingBar: 'Zwevende balk', detectionLanguages: 'Detectietalen', transcriptionModels: 'Transcriptiemodellen', systemDiagnostics: 'Systeemdiagnostiek', close: 'Sluiten', dictionary: 'Woordenboek' },
  el: { settings: 'Ρυθμίσεις', interfaceLanguage: 'Γλώσσα διεπαφής', interfaceLanguageCopy: 'Αναζητήστε και αλλάξτε άμεσα τη γλώσσα της εφαρμογής. Προεπιλογή είναι τα αγγλικά.', searchLanguage: 'Αναζήτηση γλώσσας', languageSearchPlaceholder: 'Αναζητήστε τη γλώσσα σας...', selectedLanguage: 'Επιλεγμένο', appearance: 'Εμφάνιση', darkMode: 'Σκούρο θέμα', lightMode: 'Ανοιχτό θέμα', floatingBar: 'Πλωτή μπάρα', detectionLanguages: 'Γλώσσες ανίχνευσης', transcriptionModels: 'Μοντέλα απομαγνητοφώνησης', systemDiagnostics: 'Διαγνωστικά συστήματος', close: 'Κλείσιμο', dictionary: 'Λεξικό' },
  ru: { settings: 'Настройки', interfaceLanguage: 'Язык интерфейса', interfaceLanguageCopy: 'Ищите и мгновенно переключайте язык приложения. По умолчанию английский.', searchLanguage: 'Поиск языка', languageSearchPlaceholder: 'Найдите свой язык...', selectedLanguage: 'Выбран', appearance: 'Внешний вид', darkMode: 'Тёмная тема', lightMode: 'Светлая тема', floatingBar: 'Плавающая панель', detectionLanguages: 'Языки распознавания', transcriptionModels: 'Модели транскрипции', systemDiagnostics: 'Диагностика системы', close: 'Закрыть', dictionary: 'Словарь' },
  'zh-CN': { settings: '设置', interfaceLanguage: '界面语言', interfaceLanguageCopy: '搜索并立即切换应用语言。默认语言为英语。', searchLanguage: '搜索语言', languageSearchPlaceholder: '搜索你的语言...', selectedLanguage: '已选择', appearance: '外观', darkMode: '深色模式', lightMode: '浅色模式', floatingBar: '悬浮条', detectionLanguages: '检测语言', transcriptionModels: '转录模型', systemDiagnostics: '系统诊断', close: '关闭', dictionary: '词典' },
  ja: { settings: '設定', interfaceLanguage: 'インターフェース言語', interfaceLanguageCopy: '言語を検索してすぐに切り替えられます。既定は英語です。', searchLanguage: '言語を検索', languageSearchPlaceholder: '言語を検索...', selectedLanguage: '選択中', appearance: '表示', darkMode: 'ダークモード', lightMode: 'ライトモード', floatingBar: 'フローティングバー', detectionLanguages: '検出言語', transcriptionModels: '文字起こしモデル', systemDiagnostics: 'システム診断', close: '閉じる', dictionary: '辞書' },
  ko: { settings: '설정', interfaceLanguage: '인터페이스 언어', interfaceLanguageCopy: '언어를 검색하고 즉시 앱 언어를 바꿀 수 있습니다. 기본값은 영어입니다.', searchLanguage: '언어 검색', languageSearchPlaceholder: '언어 검색...', selectedLanguage: '선택됨', appearance: '화면', darkMode: '다크 모드', lightMode: '라이트 모드', floatingBar: '플로팅 바', detectionLanguages: '감지 언어', transcriptionModels: '전사 모델', systemDiagnostics: '시스템 진단', close: '닫기', dictionary: '사전' },
  ar: { settings: 'الإعدادات', interfaceLanguage: 'لغة الواجهة', interfaceLanguageCopy: 'ابحث عن لغة التطبيق وبدلها فورًا. اللغة الافتراضية هي الإنجليزية.', searchLanguage: 'ابحث عن لغة', languageSearchPlaceholder: 'ابحث عن لغتك...', selectedLanguage: 'محدد', appearance: 'المظهر', darkMode: 'الوضع الداكن', lightMode: 'الوضع الفاتح', floatingBar: 'الشريط العائم', detectionLanguages: 'لغات الاكتشاف', transcriptionModels: 'نماذج النسخ', systemDiagnostics: 'تشخيص النظام', close: 'إغلاق', dictionary: 'القاموس' },
  hi: { settings: 'सेटिंग्स', interfaceLanguage: 'इंटरफ़ेस भाषा', interfaceLanguageCopy: 'अपनी भाषा खोजें और तुरंत ऐप की भाषा बदलें। डिफ़ॉल्ट अंग्रेज़ी है।', searchLanguage: 'भाषा खोजें', languageSearchPlaceholder: 'अपनी भाषा खोजें...', selectedLanguage: 'चयनित', appearance: 'रूप', darkMode: 'डार्क मोड', lightMode: 'लाइट मोड', floatingBar: 'फ़्लोटिंग बार', detectionLanguages: 'पता लगाने की भाषाएँ', transcriptionModels: 'ट्रांसक्रिप्शन मॉडल', systemDiagnostics: 'सिस्टम डायग्नोस्टिक्स', close: 'बंद करें', dictionary: 'शब्दकोश' },
  tr: { settings: 'Ayarlar', interfaceLanguage: 'Arayüz dili', interfaceLanguageCopy: 'Dil arayın ve uygulama dilini anında değiştirin. Varsayılan İngilizcedir.', searchLanguage: 'Dil ara', languageSearchPlaceholder: 'Dilini ara...', selectedLanguage: 'Seçili', appearance: 'Görünüm', darkMode: 'Koyu mod', lightMode: 'Açık mod', floatingBar: 'Yüzen çubuk', detectionLanguages: 'Algılama dilleri', transcriptionModels: 'Döküm modelleri', systemDiagnostics: 'Sistem tanıları', close: 'Kapat', dictionary: 'Sözlük' },
});

const MODEL_LABELS = {
  tiny: { en: 'Lite', 'pt-BR': 'Lite' },
  base: { en: 'Fast', 'pt-BR': 'Rápido' },
  small: { en: 'Balanced', 'pt-BR': 'Equilibrado' },
  medium: { en: 'Precise', 'pt-BR': 'Preciso' },
  'large-v3': { en: 'Maximum', 'pt-BR': 'Máximo' },
};

const MODEL_DESCRIPTIONS = {
  tiny: { en: 'Minimum latency for quick tests.', 'pt-BR': 'Latência mínima para testes rápidos.' },
  base: { en: 'Better than tiny while staying very fast.', 'pt-BR': 'Melhor que tiny, ainda bem ágil.' },
  small: { en: 'A solid middle ground for daily use.', 'pt-BR': 'Bom meio-termo para uso diário.' },
  medium: { en: 'More quality with moderate latency.', 'pt-BR': 'Mais qualidade com latência moderada.' },
  'large-v3': { en: 'Highest accuracy with a heavier local cost.', 'pt-BR': 'Maior precisão com custo local mais alto.' },
};

const els = {
  historyList: document.getElementById('history-list'),
  historyCount: document.getElementById('history-count'),
  historySearch: document.getElementById('history-search'),
  shortcutLabel: document.getElementById('shortcut-label'),
  noticeStrip: document.getElementById('notice-strip'),
  langPt: document.getElementById('lang-pt'),
  langEn: document.getElementById('lang-en'),
  langPtLabel: document.getElementById('lang-pt-label'),
  langEnLabel: document.getElementById('lang-en-label'),
  modelList: document.getElementById('model-list'),
  resetStats: document.getElementById('reset-stats'),
  activeModelLabel: document.getElementById('active-model-label'),
  deviceLabel: document.getElementById('device-label'),
  deviceNote: document.getElementById('device-note'),
  streakValue: document.getElementById('streak-value'),
  daysUsedValue: document.getElementById('days-used-value'),
  wordsTotalValue: document.getElementById('words-total-value'),
  wpmValue: document.getElementById('wpm-value'),
  openDictionary: document.getElementById('open-dictionary'),
  closeDictionary: document.getElementById('close-dictionary'),
  dictionaryWindow: document.getElementById('dictionary-window'),
  dictionaryBackdrop: document.getElementById('dictionary-backdrop'),
  dictionaryForm: document.getElementById('dictionary-form'),
  dictionarySources: document.getElementById('dictionary-sources'),
  dictionaryTarget: document.getElementById('dictionary-target'),
  dictionaryLangPt: document.getElementById('dictionary-lang-pt'),
  dictionaryLangEn: document.getElementById('dictionary-lang-en'),
  dictionaryLangPtLabel: document.getElementById('dictionary-lang-pt-label'),
  dictionaryLangEnLabel: document.getElementById('dictionary-lang-en-label'),
  dictionaryList: document.getElementById('dictionary-list'),
  dictionaryCount: document.getElementById('dictionary-count'),
  cancelDictionaryEdit: document.getElementById('cancel-dictionary-edit'),
  submitDictionaryRule: document.getElementById('submit-dictionary-rule'),
  openSettings: document.getElementById('open-settings'),
  closeSettings: document.getElementById('close-settings'),
  settingsDrawer: document.getElementById('settings-drawer'),
  settingsBackdrop: document.getElementById('settings-backdrop'),
  showOverlayBar: document.getElementById('show-overlay-bar'),
  soundEffectsEnabled: document.getElementById('sound-effects-enabled'),
  themeRadios: document.querySelectorAll('input[name="theme"]'),
  interfaceLanguageSearch: document.getElementById('interface-language-search'),
  interfaceLanguageList: document.getElementById('interface-language-list'),
  translatable: document.querySelectorAll('[data-i18n]'),
  translatablePlaceholders: document.querySelectorAll('[data-i18n-placeholder]'),
};

let renderedHistory = [];
let historyFilter = '';
let lastState = null;
let settingsOpen = false;
let settingsCloseTimer = null;
let dictionaryOpen = false;
let dictionaryCloseTimer = null;
let editingDictionaryRuleId = null;
let toastHideTimer = null;

const SETTINGS_CLOSE_DELAY_MS = 500;
const TOAST_HIDE_DELAY_MS = 3200;

function locale() {
  return lastState?.interfaceLanguage || 'en';
}

function t(key) {
  return (TRANSLATIONS[locale()] && TRANSLATIONS[locale()][key]) || TRANSLATIONS.en[key] || key;
}

function intFmt(value) {
  return new Intl.NumberFormat(locale(), { maximumFractionDigits: 0 }).format(Number(value) || 0);
}

function compactFmt(value) {
  return new Intl.NumberFormat(locale(), {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Number(value) || 0);
}

function langName(code, displayLocale = locale()) {
  try {
    return new Intl.DisplayNames([displayLocale], { type: 'language' }).of(code) || code;
  } catch (_error) {
    return code;
  }
}

function capitalizeLanguageLabel(value) {
  const text = String(value || '').trim();
  if (!text) return text;
  return text.replace(/^\p{L}/u, (match) => match.toLocaleUpperCase(locale()));
}

function esc(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function countLabel(count, singular, plural) {
  return `${intFmt(count)} ${count === 1 ? singular : plural}`;
}

function modelLabel(modelId) {
  return (MODEL_LABELS[modelId] && (MODEL_LABELS[modelId][locale()] || MODEL_LABELS[modelId].en)) || modelId || '--';
}

function modelDescription(modelId) {
  return (MODEL_DESCRIPTIONS[modelId] && (MODEL_DESCRIPTIONS[modelId][locale()] || MODEL_DESCRIPTIONS[modelId].en)) || modelId || '--';
}

function formatMs(ms) {
  const value = Number(ms) || 0;
  return value > 0 ? `${Math.round(value)} ms` : '--';
}

function formatShortcut(shortcut) {
  return String(shortcut || '')
    .split('+')
    .map((part) => {
      const token = part.trim().toLowerCase();
      if (token === 'commandorcontrol' || token === 'ctrl') return 'Ctrl';
      if (token === 'shift') return 'Shift';
      if (token === 'space') return 'Space';
      if (token === 'alt') return 'Alt';
      if (token === 'windows' || token === 'left windows' || token === 'right windows') return 'Win';
      return token.length === 1 ? token.toUpperCase() : token;
    })
    .join('+');
}

function initTheme() {
  const savedTheme = localStorage.getItem('megafala-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  for (const radio of els.themeRadios) {
    if (radio.value === savedTheme) {
      radio.checked = true;
    }
    radio.addEventListener('change', (event) => {
      if (event.target.checked) {
        document.documentElement.setAttribute('data-theme', event.target.value);
        localStorage.setItem('megafala-theme', event.target.value);
      }
    });
  }
}

function applyTranslations() {
  document.documentElement.lang = locale();
  document.documentElement.dir = locale() === 'ar' ? 'rtl' : 'ltr';
  localStorage.setItem('megafala-interface-language', locale());

  for (const element of els.translatable) {
    element.textContent = t(element.dataset.i18n);
  }

  for (const element of els.translatablePlaceholders) {
    element.setAttribute('placeholder', t(element.dataset.i18nPlaceholder));
  }

  els.langPtLabel.textContent = capitalizeLanguageLabel(langName('pt'));
  els.langEnLabel.textContent = capitalizeLanguageLabel(langName('en'));
  els.dictionaryLangPtLabel.textContent = capitalizeLanguageLabel(langName('pt'));
  els.dictionaryLangEnLabel.textContent = capitalizeLanguageLabel(langName('en'));
  els.submitDictionaryRule.textContent = editingDictionaryRuleId ? t('saveRule') : t('addRule');
}

function renderUsageSummary(summary = {}) {
  const singularDay = locale() === 'pt-BR' ? 'dia' : 'day';
  const pluralDay = locale() === 'pt-BR' ? 'dias' : 'days';
  const wordsLabel = locale() === 'pt-BR' ? 'palavras' : 'words';
  const words = Number(summary.totalWords) || 0;

  els.streakValue.textContent = countLabel(summary.streakDays || 0, singularDay, pluralDay);
  els.daysUsedValue.textContent = countLabel(summary.totalDays || 0, singularDay, pluralDay);
  els.wordsTotalValue.textContent = `${words >= 1000 ? compactFmt(words) : intFmt(words)} ${wordsLabel}`;
  els.wpmValue.textContent = `${intFmt(Math.round(summary.averageWpm || 0))} WPM`;
}

function renderInterfaceLanguages() {
  const query = String(els.interfaceLanguageSearch.value || '').trim().toLocaleLowerCase(locale());
  const items = SUPPORTED_INTERFACE_LANGUAGES
    .map((code) => ({
      code,
      nativeName: capitalizeLanguageLabel(langName(code, code)),
      localName: capitalizeLanguageLabel(langName(code)),
    }))
    .filter((item) => {
      const searchText = `${item.code} ${item.nativeName} ${item.localName}`.toLocaleLowerCase(locale());
      return !query || searchText.includes(query);
    });

  if (items.length === 0) {
    els.interfaceLanguageList.innerHTML = `<div class="history-empty">${esc(t('noLanguageResults'))}</div>`;
    return;
  }

  els.interfaceLanguageList.innerHTML = items
    .map((item) => `
      <button
        class="interface-language-card${item.code === locale() ? ' interface-language-card--active' : ''}"
        data-interface-language="${esc(item.code)}"
        type="button"
      >
        <div class="interface-language-card__copy">
          <strong>${esc(item.nativeName)}</strong>
          <span>${esc(item.localName)}</span>
        </div>
        <span class="interface-language-card__meta">${esc(item.code === locale() ? t('selectedLanguage') : item.code)}</span>
      </button>
    `)
    .join('');
}

function renderHistory(history, total) {
  const list = Array.isArray(history) ? history : [];
  const query = historyFilter.trim().toLocaleLowerCase(locale());
  renderedHistory = !query
    ? list
    : list.filter((entry) => String(entry.text || '').toLocaleLowerCase(locale()).includes(query));

  const messageSingular = locale() === 'pt-BR' ? 'mensagem' : 'message';
  const messagePlural = locale() === 'pt-BR' ? 'mensagens' : 'messages';
  const resultSingular = locale() === 'pt-BR' ? 'resultado' : 'result';
  const resultPlural = locale() === 'pt-BR' ? 'resultados' : 'results';
  const wordsLabel = locale() === 'pt-BR' ? 'palavras' : 'words';

  if (list.length === 0) {
    els.historyList.innerHTML = `<div class="history-empty">${esc(t('noTranscriptions'))}</div>`;
    els.historyCount.textContent = countLabel(0, messageSingular, messagePlural);
    return;
  }

  if (renderedHistory.length === 0) {
    els.historyList.innerHTML = `<div class="history-empty">${esc(t('noSearchResults'))}</div>`;
    els.historyCount.textContent = countLabel(0, resultSingular, resultPlural);
    return;
  }

  els.historyCount.textContent = historyFilter.trim()
    ? countLabel(renderedHistory.length, resultSingular, resultPlural)
    : countLabel(total || renderedHistory.length, messageSingular, messagePlural);

  els.historyList.innerHTML = renderedHistory
    .map((entry, index) => {
      const timestamp = new Date(entry.timestamp);
      return `
        <article class="history-item">
          <div class="history-item__time">
            <strong>${timestamp.toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' })}</strong>
            <span>${timestamp.toLocaleDateString(locale(), { day: '2-digit', month: '2-digit' })}</span>
          </div>
          <div class="history-item__body">
            <p>${esc(entry.text)}</p>
            <div class="history-item__meta">
              <span>${esc(modelLabel(entry.model))}</span>
              <span>${esc(capitalizeLanguageLabel(langName(entry.language || 'en')))}</span>
              <span>${esc(formatMs(entry.transcriptionMs))}</span>
              <span>${intFmt(entry.wordCount || 0)} ${wordsLabel}</span>
            </div>
          </div>
          <button class="copy-button" data-history-index="${index}" type="button">${esc(t('copy'))}</button>
        </article>
      `;
    })
    .join('');
}

function renderDictionary(entries) {
  const list = Array.isArray(entries) ? entries : [];
  const ruleSingular = locale() === 'pt-BR' ? 'regra' : 'rule';
  const rulePlural = locale() === 'pt-BR' ? 'regras' : 'rules';

  els.dictionaryCount.textContent = countLabel(list.length, ruleSingular, rulePlural);
  if (list.length === 0) {
    els.dictionaryList.innerHTML = `<div class="history-empty">${esc(t('noRules'))}</div>`;
    return;
  }

  els.dictionaryList.innerHTML = list
    .map((entry) => `
      <article class="dictionary-item">
        <div class="dictionary-item__content">
          <div class="dictionary-item__panel">
            <span class="dictionary-item__label">${esc(t('entries'))}</span>
            <div class="dictionary-chip-list">
              ${(entry.sources || []).map((source) => `<span class="dictionary-source-chip">${esc(source)}</span>`).join('')}
            </div>
          </div>
          <div class="dictionary-item__panel">
            <span class="dictionary-item__label">${esc(t('output'))}</span>
            <strong class="dictionary-item__target">${esc(entry.target)}</strong>
          </div>
          <div class="dictionary-item__meta">
            ${(entry.languages || []).map((language) => `<span class="dictionary-chip">${esc(capitalizeLanguageLabel(langName(language)))}</span>`).join('')}
          </div>
        </div>
        <div class="dictionary-item__actions">
          <button class="secondary-button" data-dictionary-edit="${esc(entry.id)}" type="button">${esc(t('edit'))}</button>
          <button class="copy-button" data-dictionary-remove="${esc(entry.id)}" type="button">${esc(t('remove'))}</button>
        </div>
      </article>
    `)
    .join('');
}

function renderModels(state) {
  const stats = state.modelStats || {};
  const isBusy = state.switchingModel || state.phase === 'booting';
  const avgLabel = locale() === 'pt-BR' ? 'Média' : 'Avg';
  const useSingular = locale() === 'pt-BR' ? 'uso' : 'use';
  const usePlural = locale() === 'pt-BR' ? 'usos' : 'uses';

  els.modelList.innerHTML = (state.availableModels || [])
    .map((option) => {
      const itemStats = stats[option.id] || {};
      return `
        <button class="model-card${option.id === state.model ? ' model-card--active' : ''}${isBusy ? ' model-card--disabled' : ''}" data-model="${option.id}" type="button" ${isBusy ? 'disabled' : ''}>
          <div class="model-card__top">
            <strong>${esc(modelLabel(option.id))}</strong>
            <span>${esc(option.id)}</span>
          </div>
          <p>${esc(modelDescription(option.id))}</p>
          <div class="model-card__stats">
            <span>${avgLabel} ${esc(formatMs(itemStats.averageMs))}</span>
            <span>${countLabel(itemStats.count || 0, useSingular, usePlural)}</span>
          </div>
        </button>
      `;
    })
    .join('');

  for (const button of els.modelList.querySelectorAll('[data-model]')) {
    button.addEventListener('click', async () => {
      if (isBusy) return;
      renderState(await window.flowLocal.updateSettings({ model: button.getAttribute('data-model') }));
    });
  }
}

function hideToast() {
  if (toastHideTimer) {
    window.clearTimeout(toastHideTimer);
    toastHideTimer = null;
  }
  els.noticeStrip.classList.remove('is-visible', 'toast--error');
  els.noticeStrip.classList.add('hidden');
  els.noticeStrip.textContent = '';
}

function showToast(message, autoHide = true) {
  if (!message) {
    hideToast();
    return;
  }
  if (toastHideTimer) {
    window.clearTimeout(toastHideTimer);
    toastHideTimer = null;
  }
  els.noticeStrip.textContent = message;
  els.noticeStrip.classList.remove('hidden', 'toast--error');
  els.noticeStrip.classList.add('toast--error');
  window.requestAnimationFrame(() => els.noticeStrip.classList.add('is-visible'));
  if (autoHide) {
    toastHideTimer = window.setTimeout(hideToast, TOAST_HIDE_DELAY_MS);
  }
}

function renderState(state) {
  lastState = state;
  applyTranslations();
  renderInterfaceLanguages();
  hideToast();

  els.shortcutLabel.textContent = formatShortcut(state.shortcut) || '--';
  els.activeModelLabel.textContent = `${modelLabel(state.model)} (${state.model})`;
  els.deviceLabel.textContent = state.device ? String(state.device).toUpperCase() : '--';
  els.deviceNote.textContent = state.deviceNote || t('noNotes');
  els.showOverlayBar.checked = Boolean(state.showOverlayBar);
  els.soundEffectsEnabled.checked = Boolean(state.soundEffectsEnabled);
  els.langPt.checked = (state.allowedLanguages || []).includes('pt');
  els.langEn.checked = (state.allowedLanguages || []).includes('en');

  renderUsageSummary(state.usageSummary || {});
  renderHistory(state.history, state.historyTotal);
  renderDictionary(state.dictionaryEntries);
  renderModels(state);
}

function setSettingsOpen(open) {
  if (settingsCloseTimer) {
    window.clearTimeout(settingsCloseTimer);
    settingsCloseTimer = null;
  }
  settingsOpen = Boolean(open);
  document.body.classList.toggle('settings-open', settingsOpen);

  if (settingsOpen) {
    els.settingsDrawer.classList.remove('hidden');
    els.settingsBackdrop.classList.remove('hidden');
    window.requestAnimationFrame(() => {
      els.settingsDrawer.classList.add('is-visible');
      els.settingsBackdrop.classList.add('is-visible');
      els.settingsDrawer.setAttribute('aria-hidden', 'false');
    });
    return;
  }

  els.settingsDrawer.classList.remove('is-visible');
  els.settingsBackdrop.classList.remove('is-visible');
  els.settingsDrawer.setAttribute('aria-hidden', 'true');
  settingsCloseTimer = window.setTimeout(() => {
    els.settingsDrawer.classList.add('hidden');
    els.settingsBackdrop.classList.add('hidden');
    settingsCloseTimer = null;
  }, SETTINGS_CLOSE_DELAY_MS);
}

function setDictionaryOpen(open) {
  if (dictionaryCloseTimer) {
    window.clearTimeout(dictionaryCloseTimer);
    dictionaryCloseTimer = null;
  }
  dictionaryOpen = Boolean(open);
  document.body.classList.toggle('dictionary-open', dictionaryOpen);

  if (dictionaryOpen) {
    resetDictionaryForm(lastState?.allowedLanguages || ['pt']);
    els.dictionaryWindow.classList.remove('hidden');
    els.dictionaryBackdrop.classList.remove('hidden');
    window.requestAnimationFrame(() => {
      els.dictionaryWindow.classList.add('is-visible');
      els.dictionaryBackdrop.classList.add('is-visible');
      els.dictionaryWindow.setAttribute('aria-hidden', 'false');
      els.dictionarySources.focus();
    });
    return;
  }

  els.dictionaryWindow.classList.remove('is-visible');
  els.dictionaryBackdrop.classList.remove('is-visible');
  els.dictionaryWindow.setAttribute('aria-hidden', 'true');
  dictionaryCloseTimer = window.setTimeout(() => {
    els.dictionaryWindow.classList.add('hidden');
    els.dictionaryBackdrop.classList.add('hidden');
    dictionaryCloseTimer = null;
  }, SETTINGS_CLOSE_DELAY_MS);
}

function parseDictionarySources(value) {
  const nextSources = [];
  const seenSources = new Set();
  for (const item of String(value || '')
    .split(/\r?\n|;/)
    .map((part) => part.replace(/\s+/g, ' ').trim())
    .filter(Boolean)) {
    const key = item.toLocaleLowerCase(locale());
    if (seenSources.has(key)) continue;
    seenSources.add(key);
    nextSources.push(item);
  }
  return nextSources;
}

function resetDictionaryForm(fallbackLanguages) {
  els.dictionaryForm.reset();
  editingDictionaryRuleId = null;
  els.dictionaryLangPt.checked = fallbackLanguages.includes('pt');
  els.dictionaryLangEn.checked = fallbackLanguages.includes('en');
  applyTranslations();
}

function selectedDetectionLanguages() {
  const list = [els.langPt.checked ? 'pt' : null, els.langEn.checked ? 'en' : null].filter(Boolean);
  return list.length > 0 ? list : ['pt'];
}

function selectedDictionaryLanguages(fallbackLanguages) {
  const list = [els.dictionaryLangPt.checked ? 'pt' : null, els.dictionaryLangEn.checked ? 'en' : null].filter(Boolean);
  return list.length > 0 ? list : fallbackLanguages;
}

function setupHandlers() {
  for (const checkbox of [els.langPt, els.langEn]) {
    checkbox.addEventListener('change', async () => {
      renderState(await window.flowLocal.updateSettings({ allowedLanguages: selectedDetectionLanguages() }));
    });
  }

  els.interfaceLanguageSearch.addEventListener('input', renderInterfaceLanguages);
  els.interfaceLanguageList.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-interface-language]');
    if (!button) return;
    const nextLanguage = button.getAttribute('data-interface-language');
    if (nextLanguage && nextLanguage !== locale()) {
      renderState(await window.flowLocal.updateSettings({ interfaceLanguage: nextLanguage }));
    }
  });

  els.resetStats.addEventListener('click', async () => {
    renderState(await window.flowLocal.resetModelStats());
  });
  els.openSettings.addEventListener('click', () => setSettingsOpen(true));
  els.closeSettings.addEventListener('click', () => setSettingsOpen(false));
  els.settingsBackdrop.addEventListener('click', () => setSettingsOpen(false));
  els.openDictionary.addEventListener('click', () => setDictionaryOpen(true));
  els.closeDictionary.addEventListener('click', () => setDictionaryOpen(false));
  els.dictionaryBackdrop.addEventListener('click', () => setDictionaryOpen(false));

  els.showOverlayBar.addEventListener('change', async () => {
    renderState(await window.flowLocal.updateSettings({ showOverlayBar: els.showOverlayBar.checked }));
  });
  els.soundEffectsEnabled.addEventListener('change', async () => {
    renderState(await window.flowLocal.updateSettings({ soundEffectsEnabled: els.soundEffectsEnabled.checked }));
  });

  els.historySearch.addEventListener('input', () => {
    historyFilter = els.historySearch.value || '';
    if (lastState) renderHistory(lastState.history, lastState.historyTotal);
  });

  els.historyList.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-history-index]');
    if (!button) return;
    const entry = renderedHistory[Number(button.getAttribute('data-history-index'))];
    if (!entry) return;
    await window.flowLocal.copyText(entry.text);
    const originalLabel = button.textContent;
    button.textContent = t('copied');
    window.setTimeout(() => {
      if (button.isConnected) button.textContent = originalLabel;
    }, 1200);
  });

  els.dictionaryForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const sources = parseDictionarySources(els.dictionarySources.value);
    const target = (els.dictionaryTarget.value || '').trim();
    const fallbackLanguages = lastState?.allowedLanguages?.length ? lastState.allowedLanguages : ['pt'];
    const languages = selectedDictionaryLanguages(fallbackLanguages);

    if (!sources.length || !target) {
      return;
    }

    const currentEntries = [...(lastState?.dictionaryEntries || [])];
    const nextEntry = { id: editingDictionaryRuleId || undefined, sources, target, languages };
    const nextEntries = editingDictionaryRuleId
      ? currentEntries.map((entry) => (entry.id === editingDictionaryRuleId ? nextEntry : entry))
      : [...currentEntries, nextEntry];

    renderState(await window.flowLocal.updateSettings({ dictionaryEntries: nextEntries }));
    resetDictionaryForm(languages);
    els.dictionarySources.focus();
  });

  els.dictionaryList.addEventListener('click', async (event) => {
    const editButton = event.target.closest('[data-dictionary-edit]');
    if (editButton) {
      const entry = (lastState?.dictionaryEntries || []).find((item) => item.id === editButton.getAttribute('data-dictionary-edit'));
      if (!entry) return;
      editingDictionaryRuleId = entry.id;
      els.dictionarySources.value = (entry.sources || []).join('\n');
      els.dictionaryTarget.value = entry.target || '';
      els.dictionaryLangPt.checked = (entry.languages || []).includes('pt');
      els.dictionaryLangEn.checked = (entry.languages || []).includes('en');
      applyTranslations();
      els.dictionarySources.focus();
      return;
    }

    const removeButton = event.target.closest('[data-dictionary-remove]');
    if (!removeButton) return;

    const entryId = removeButton.getAttribute('data-dictionary-remove');
    renderState(await window.flowLocal.updateSettings({
      dictionaryEntries: (lastState?.dictionaryEntries || []).filter((entry) => entry.id !== entryId),
    }));
    if (editingDictionaryRuleId === entryId) {
      resetDictionaryForm(lastState?.allowedLanguages || ['pt']);
    }
  });

  els.cancelDictionaryEdit.addEventListener('click', () => {
    resetDictionaryForm(lastState?.allowedLanguages || ['pt']);
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && dictionaryOpen) {
      setDictionaryOpen(false);
      return;
    }
    if (event.key === 'Escape' && settingsOpen) {
      setSettingsOpen(false);
    }
  });
}

async function bootstrap() {
  initTheme();
  renderState(await window.flowLocal.getState());
  window.flowLocal.onStateUpdate((state) => renderState(state));
  setupHandlers();
}

bootstrap();
