const modelLabelMap = {
  tiny: 'Lite',
  base: 'Rápido',
  small: 'Equilibrado',
  medium: 'Preciso',
  'large-v3': 'Máximo',
};

const compactNumber = new Intl.NumberFormat('pt-BR', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

const integerNumber = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 0,
});

const els = {
  historyList: document.getElementById('history-list'),
  historyCount: document.getElementById('history-count'),
  historySearch: document.getElementById('history-search'),
  shortcutLabel: document.getElementById('shortcut-label'),
  noticeStrip: document.getElementById('notice-strip'),
  langPt: document.getElementById('lang-pt'),
  langEn: document.getElementById('lang-en'),
  modelList: document.getElementById('model-list'),
  resetStats: document.getElementById('reset-stats'),
  activeModelLabel: document.getElementById('active-model-label'),
  deviceLabel: document.getElementById('device-label'),
  deviceNote: document.getElementById('device-note'),
  streakValue: document.getElementById('streak-value'),
  daysUsedValue: document.getElementById('days-used-value'),
  wordsTotalValue: document.getElementById('words-total-value'),
  wpmValue: document.getElementById('wpm-value'),
  openSettings: document.getElementById('open-settings'),
  closeSettings: document.getElementById('close-settings'),
  settingsDrawer: document.getElementById('settings-drawer'),
  settingsBackdrop: document.getElementById('settings-backdrop'),
  showOverlayBar: document.getElementById('show-overlay-bar'),
  soundEffectsEnabled: document.getElementById('sound-effects-enabled'),
  themeRadios: document.querySelectorAll('input[name="theme"]'),
};

let renderedHistory = [];
let historyFilter = '';
let lastState = null;
let settingsOpen = false;
let settingsCloseTimer = null;
let toastHideTimer = null;

const SETTINGS_CLOSE_DELAY_MS = 500;
const TOAST_HIDE_DELAY_MS = 3200;

function initTheme() {
  const savedTheme = localStorage.getItem('megafala-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  
  for (const radio of els.themeRadios) {
    if (radio.value === savedTheme) {
      radio.checked = true;
    }
    
    radio.addEventListener('change', (e) => {
      if (e.target.checked) {
        const newTheme = e.target.value;
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('megafala-theme', newTheme);
      }
    });
  }
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatShortcut(shortcut) {
  return String(shortcut || '')
    .split('+')
    .map((part) => {
      const token = part.trim().toLowerCase();
      if (token === 'commandorcontrol' || token === 'ctrl') {
        return 'Ctrl';
      }
      if (token === 'shift') {
        return 'Shift';
      }
      if (token === 'space') {
        return 'Space';
      }
      if (token === 'alt') {
        return 'Alt';
      }
      if (token === 'windows' || token === 'left windows' || token === 'right windows') {
        return 'Win';
      }
      return token.length === 1 ? token.toUpperCase() : token;
    })
    .join('+');
}

function formatLanguage(language) {
  if (!language || language === 'unknown') {
    return '--';
  }

  if (language === 'pt') {
    return 'PT';
  }

  if (language === 'en') {
    return 'EN';
  }

  return String(language).toUpperCase();
}

function formatMs(ms) {
  const value = Number(ms) || 0;
  return value > 0 ? `${Math.round(value)} ms` : '--';
}

function formatModel(modelId) {
  return modelLabelMap[modelId] || modelId || '--';
}

function formatDaysLabel(value) {
  const amount = Number(value) || 0;
  return `${integerNumber.format(amount)} ${amount === 1 ? 'dia' : 'dias'}`;
}

function formatWordsLabel(value) {
  const amount = Number(value) || 0;
  return amount >= 1000 ? compactNumber.format(amount) : integerNumber.format(amount);
}

function renderUsageSummary(summary) {
  const stats = summary || {};
  els.streakValue.textContent = formatDaysLabel(stats.streakDays);
  els.daysUsedValue.textContent = formatDaysLabel(stats.totalDays);
  els.wordsTotalValue.textContent = `${formatWordsLabel(stats.totalWords)} palavras`;
  els.wpmValue.textContent = `${integerNumber.format(Math.round(stats.averageWpm || 0))} WPM`;
}

function getFilteredHistory(history) {
  const list = Array.isArray(history) ? history : [];
  const query = historyFilter.trim().toLocaleLowerCase('pt-BR');
  if (!query) {
    return list;
  }

  const terms = query.split(/\s+/).filter(Boolean);
  return list.filter((entry) => {
    const haystack = String(entry.text || '').toLocaleLowerCase('pt-BR');
    return terms.every((term) => haystack.includes(term));
  });
}

function renderHistory(history, historyTotal) {
  const sourceHistory = Array.isArray(history) ? history : [];
  renderedHistory = getFilteredHistory(sourceHistory);

  if (sourceHistory.length === 0) {
    els.historyList.innerHTML = '<div class="history-empty">Nenhuma transcrição ainda.</div>';
    els.historyCount.textContent = '0 mensagens';
    return;
  }

  if (renderedHistory.length === 0) {
    els.historyList.innerHTML = '<div class="history-empty">Nenhuma transcrição encontrada para essa busca.</div>';
    els.historyCount.textContent = '0 resultados';
    return;
  }

  els.historyCount.textContent = historyFilter.trim()
    ? `${integerNumber.format(renderedHistory.length)} resultados`
    : `${integerNumber.format(historyTotal || renderedHistory.length)} mensagens`;
  els.historyList.innerHTML = renderedHistory
    .map((entry, index) => {
      const timestamp = new Date(entry.timestamp);
      const timeLabel = timestamp.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const dateLabel = timestamp.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
      });
      const wordCount = Number(entry.wordCount) || 0;

      return `
        <article class="history-item">
          <div class="history-item__time">
            <strong>${timeLabel}</strong>
            <span>${dateLabel}</span>
          </div>
          <div class="history-item__body">
            <p>${escapeHtml(entry.text)}</p>
            <div class="history-item__meta">
              <span>${escapeHtml(formatModel(entry.model))}</span>
              <span>${escapeHtml(formatLanguage(entry.language))}</span>
              <span>${escapeHtml(formatMs(entry.transcriptionMs))}</span>
              <span>${integerNumber.format(wordCount)} palavras</span>
            </div>
          </div>
          <button class="copy-button" data-history-index="${index}" type="button">Copiar</button>
        </article>
      `;
    })
    .join('');
}

function renderLanguages(allowedLanguages) {
  const languages = allowedLanguages || [];
  els.langPt.checked = languages.includes('pt');
  els.langEn.checked = languages.includes('en');
}

function renderPreferences(state) {
  els.showOverlayBar.checked = Boolean(state.showOverlayBar);
  els.soundEffectsEnabled.checked = Boolean(state.soundEffectsEnabled);
}

function renderModels(state) {
  const stats = state.modelStats || {};
  const currentModel = state.model;
  const isBusy = state.switchingModel || state.phase === 'booting';

  els.modelList.innerHTML = (state.availableModels || [])
    .map((option) => {
      const itemStats = stats[option.id] || {};
      const active = option.id === currentModel ? ' model-card--active' : '';
      const disabled = isBusy ? ' model-card--disabled' : '';
      return `
        <button class="model-card${active}${disabled}" data-model="${option.id}" type="button" ${isBusy ? 'disabled' : ''}>
          <div class="model-card__top">
            <strong>${escapeHtml(option.label)}</strong>
            <span>${escapeHtml(option.id)}</span>
          </div>
          <p>${escapeHtml(option.description)}</p>
          <div class="model-card__stats">
            <span>Média ${escapeHtml(formatMs(itemStats.averageMs))}</span>
            <span>${integerNumber.format(itemStats.count || 0)} usos</span>
          </div>
        </button>
      `;
    })
    .join('');

  for (const button of els.modelList.querySelectorAll('[data-model]')) {
    button.addEventListener('click', async () => {
      if (isBusy) {
        return;
      }
      const model = button.getAttribute('data-model');
      const nextState = await window.flowLocal.updateSettings({ model });
      renderState(nextState);
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

  window.requestAnimationFrame(() => {
    els.noticeStrip.classList.add('is-visible');
  });

  if (autoHide) {
    toastHideTimer = window.setTimeout(() => {
      hideToast();
    }, TOAST_HIDE_DELAY_MS);
  }
}

function renderState(state) {
  lastState = state;
  const device = state.device ? String(state.device).toUpperCase() : '--';

  els.shortcutLabel.textContent = formatShortcut(state.shortcut) || '--';
  els.activeModelLabel.textContent = `${formatModel(state.model)} (${state.model})`;
  els.deviceLabel.textContent = device;
  els.deviceNote.textContent = state.deviceNote || 'Sem observações.';

  renderUsageSummary(state.usageSummary);
  renderLanguages(state.allowedLanguages);
  renderPreferences(state);
  renderModels(state);
  renderHistory(state.history, state.historyTotal);

  if (state.error) {
    showToast(state.error, false);
  } else {
    hideToast();
  }
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

async function updateLanguages(nextLanguages) {
  const safeLanguages = nextLanguages.length > 0 ? nextLanguages : ['pt'];
  const state = await window.flowLocal.updateSettings({ allowedLanguages: safeLanguages });
  renderState(state);
}

function setupHandlers() {
  for (const checkbox of [els.langPt, els.langEn]) {
    checkbox.addEventListener('change', () => {
      const nextLanguages = [els.langPt.checked ? 'pt' : null, els.langEn.checked ? 'en' : null].filter(Boolean);
      updateLanguages(nextLanguages);
    });
  }

  els.resetStats.addEventListener('click', async () => {
    const state = await window.flowLocal.resetModelStats();
    renderState(state);
  });

  els.openSettings.addEventListener('click', () => {
    setSettingsOpen(true);
  });

  els.closeSettings.addEventListener('click', () => {
    setSettingsOpen(false);
  });

  els.settingsBackdrop.addEventListener('click', () => {
    setSettingsOpen(false);
  });

  els.showOverlayBar.addEventListener('change', async () => {
    const state = await window.flowLocal.updateSettings({
      showOverlayBar: els.showOverlayBar.checked,
    });
    renderState(state);
  });

  els.soundEffectsEnabled.addEventListener('change', async () => {
    const state = await window.flowLocal.updateSettings({
      soundEffectsEnabled: els.soundEffectsEnabled.checked,
    });
    renderState(state);
  });

  els.historySearch.addEventListener('input', () => {
    historyFilter = els.historySearch.value || '';
    if (lastState) {
      renderHistory(lastState.history, lastState.historyTotal);
    }
  });

  els.historyList.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-history-index]');
    if (!button) {
      return;
    }

    const index = Number(button.getAttribute('data-history-index'));
    const entry = renderedHistory[index];
    if (!entry) {
      return;
    }

    await window.flowLocal.copyText(entry.text);
    const originalLabel = button.textContent;
    button.textContent = 'Copiado';
    window.setTimeout(() => {
      if (button.isConnected) {
        button.textContent = originalLabel;
      }
    }, 1200);
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && settingsOpen) {
      setSettingsOpen(false);
    }
  });
}

async function bootstrap() {
  initTheme();
  const initialState = await window.flowLocal.getState();
  renderState(initialState);

  window.flowLocal.onStateUpdate((state) => {
    renderState(state);
  });

  setupHandlers();
}

bootstrap();
