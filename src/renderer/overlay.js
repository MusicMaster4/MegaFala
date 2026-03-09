const overlayEls = {
  shell: document.getElementById('overlay-shell'),
  pill: document.getElementById('overlay-pill'),
  badge: document.getElementById('overlay-badge'),
  wave: document.getElementById('overlay-wave'),
  loader: document.getElementById('overlay-loader'),
  readySequence: document.getElementById('overlay-ready-sequence'),
  readyLabel: document.getElementById('overlay-ready-label'),
  glyph: document.getElementById('overlay-glyph'),
};

let dragState = null;
let queuedPoint = null;
let dragFrame = 0;
let levelFrame = 0;
let currentAudioLevel = 0;
let targetAudioLevel = 0;
let lastOverlayMode = 'idle';
let currentOverlayState = {
  phase: 'idle',
  captureMode: null,
  audioLevel: 0,
};
let soundEffectsEnabled = true;
let feedbackTimer = null;
let activeFeedback = null;
let activeSoundKey = null;
let soundDrainScheduled = false;

const overlayReadyLabels = {
  en: 'READY',
  'pt-BR': 'PRONTO',
  es: 'LISTO',
  fr: 'PRET',
  de: 'BEREIT',
  it: 'PRONTO',
  nl: 'KLAAR',
  el: 'ETOIMO',
  ru: 'GOTOVO',
  'zh-CN': '就绪',
  ja: '準備完了',
  ko: '준비됨',
  ar: 'جاهز',
  hi: 'तैयार',
  tr: 'HAZIR',
};

const feedbackSounds = {
  loaded: new Audio('../assets/audio/loaded.mp3'),
  start: new Audio('../assets/audio/start.mp3'),
  close: new Audio('../assets/audio/close.mp3'),
  cancel: new Audio('../assets/audio/cancel.mp3'),
  handsfree: new Audio('../assets/audio/handsfree.mp3'),
};
const soundQueue = [];

const waveBars = Array.from(overlayEls.wave.querySelectorAll('span'));
const barWeights = [0.46, 0.78, 1, 0.78, 0.46];

for (const audio of Object.values(feedbackSounds)) {
  audio.preload = 'auto';
  audio.volume = 0.25;
  audio.load();
}

function getOverlayMode(state) {
  switch (state.phase) {
    case 'listening':
      return 'recording';
    case 'transcribing':
    case 'booting':
      return 'loading';
    case 'offline':
    case 'error':
      return 'error';
    default:
      return 'idle';
  }
}

function isHandsFreeActive(state) {
  return state.phase === 'listening' && state.captureMode === 'hands-free';
}

function flushDrag() {
  dragFrame = 0;
  if (!queuedPoint) {
    return;
  }

  window.flowOverlay.dragTo(queuedPoint);
  queuedPoint = null;
}

function queueDrag(point) {
  queuedPoint = point;
  if (!dragFrame) {
    dragFrame = window.requestAnimationFrame(flushDrag);
  }
}

function getDragPoint(event) {
  if (!dragState) {
    return null;
  }

  return {
    x: Math.round(event.screenX - dragState.offsetX),
    y: Math.round(event.screenY - dragState.offsetY),
  };
}

function stopDrag(event) {
  if (!dragState) {
    return;
  }

  const point = event ? getDragPoint(event) : queuedPoint;
  dragState = null;
  overlayEls.shell.classList.remove('overlay-shell--dragging');

  if (dragFrame) {
    window.cancelAnimationFrame(dragFrame);
    dragFrame = 0;
  }

  if (point) {
    window.flowOverlay.endDrag(point);
  }
  queuedPoint = null;
}

function startDrag(event) {
  if (event.button !== 0) {
    return;
  }

  dragState = {
    offsetX: event.clientX,
    offsetY: event.clientY,
    pointerId: event.pointerId,
  };
  overlayEls.shell.classList.add('overlay-shell--dragging');
  overlayEls.pill.setPointerCapture(event.pointerId);
  event.preventDefault();
}

function handlePointerMove(event) {
  if (!dragState || event.pointerId !== dragState.pointerId) {
    return;
  }

  const point = getDragPoint(event);
  if (!point) {
    return;
  }

  queueDrag(point);
}

function renderOverlay(state) {
  currentOverlayState = {
    phase: state.phase,
    captureMode: state.captureMode ?? null,
    audioLevel: state.audioLevel ?? targetAudioLevel,
  };

  const mode = getOverlayMode(state);
  const handsFree = isHandsFreeActive(state);
  if (mode !== 'idle' && activeFeedback) {
    clearActiveFeedback();
  }

  overlayEls.shell.dataset.mode = mode;
  overlayEls.shell.dataset.handsFree = handsFree ? 'true' : 'false';
  overlayEls.shell.dataset.feedback = activeFeedback || 'none';
  overlayEls.wave.classList.toggle('hidden', mode !== 'recording');
  overlayEls.loader.classList.toggle('hidden', mode !== 'loading');
  overlayEls.readySequence.classList.toggle('hidden', activeFeedback !== 'ready');
  overlayEls.glyph.classList.toggle('hidden', mode === 'recording' || mode === 'loading');
  overlayEls.badge.classList.toggle('hidden', !handsFree);
  overlayEls.badge.setAttribute('aria-hidden', handsFree ? 'false' : 'true');

  if (mode !== 'recording') {
    setAudioLevel(0);
  } else if (lastOverlayMode !== 'recording') {
    setAudioLevel(state.audioLevel || 0);
  }

  lastOverlayMode = mode;
}

function stopAllSounds() {
  soundQueue.length = 0;
  activeSoundKey = null;
  for (const audio of Object.values(feedbackSounds)) {
    audio.pause();
    audio.currentTime = 0;
  }
}

function stopActiveSound() {
  if (!activeSoundKey) {
    return;
  }

  const audio = feedbackSounds[activeSoundKey];
  activeSoundKey = null;
  if (!audio) {
    return;
  }

  audio.pause();
  audio.currentTime = 0;
}

function drainSoundQueue() {
  soundDrainScheduled = false;
  if (!soundEffectsEnabled || activeSoundKey || soundQueue.length === 0) {
    return;
  }

  const soundKey = soundQueue.shift();
  const audio = feedbackSounds[soundKey];
  if (!audio) {
    drainSoundQueue();
    return;
  }

  activeSoundKey = soundKey;
  audio.currentTime = 0;
  const playResult = audio.play();
  if (playResult && typeof playResult.catch === 'function') {
    playResult.catch(() => {
      activeSoundKey = null;
      drainSoundQueue();
    });
  }
}

function scheduleSoundDrain() {
  if (soundDrainScheduled) {
    return;
  }

  soundDrainScheduled = true;
  window.requestAnimationFrame(drainSoundQueue);
}

function queueSound(soundKey, options = {}) {
  if (!soundEffectsEnabled || !feedbackSounds[soundKey]) {
    return;
  }

  if (options.interrupt) {
    soundQueue.length = 0;
    stopActiveSound();
    soundQueue.unshift(soundKey);
  } else {
    soundQueue.push(soundKey);
  }

  scheduleSoundDrain();
}

function clearActiveFeedback() {
  if (feedbackTimer) {
    window.clearTimeout(feedbackTimer);
    feedbackTimer = null;
  }

  activeFeedback = null;
  overlayEls.shell.dataset.feedback = 'none';
}

function showReadyFeedback(soundKey) {
  clearActiveFeedback();
  activeFeedback = 'ready';
  renderOverlay(currentOverlayState);
  queueSound(soundKey);
  feedbackTimer = window.setTimeout(() => {
    clearActiveFeedback();
    renderOverlay(currentOverlayState);
  }, 1100);
}

function applyWaveLevel(level) {
  const clampedLevel = Math.max(0, Math.min(1, Number(level) || 0));
  const visualLevel = Math.min(1, clampedLevel * 2);

  waveBars.forEach((bar, index) => {
    const intensity = Math.min(1, visualLevel * barWeights[index]);
    // Base height 4px, maximum height scaled up for a taller wave
    const height = 4 + intensity * 16; 
    const opacity = 0.4 + intensity * 0.6;
    
    // We use Math.round to avoid sub-pixel height rendering (which causes distortion)
    bar.style.height = `${Math.round(height)}px`;
    bar.style.opacity = opacity.toFixed(2);
  });
}

function animateWave() {
  levelFrame = 0;
  const delta = targetAudioLevel - currentAudioLevel;
  if (Math.abs(delta) < 0.004) {
    currentAudioLevel = targetAudioLevel;
    applyWaveLevel(currentAudioLevel);
    return;
  }

  currentAudioLevel += delta * 0.34;
  applyWaveLevel(currentAudioLevel);
  levelFrame = window.requestAnimationFrame(animateWave);
}

function setAudioLevel(level) {
  targetAudioLevel = Math.max(0, Math.min(1, Number(level) || 0));
  if (Math.abs(targetAudioLevel - currentAudioLevel) < 0.004) {
    currentAudioLevel = targetAudioLevel;
    applyWaveLevel(currentAudioLevel);
    return;
  }

  if (!levelFrame) {
    levelFrame = window.requestAnimationFrame(animateWave);
  }
}

function bindDrag() {
  overlayEls.pill.addEventListener('pointerdown', startDrag);
  overlayEls.pill.addEventListener('pointermove', handlePointerMove);
  overlayEls.pill.addEventListener('pointerup', stopDrag);
  overlayEls.pill.addEventListener('pointercancel', stopDrag);
  overlayEls.pill.addEventListener('lostpointercapture', () => {
    stopDrag();
  });
}

function bindSoundLifecycle() {
  for (const [soundKey, audio] of Object.entries(feedbackSounds)) {
    const release = () => {
      if (activeSoundKey !== soundKey) {
        return;
      }
      activeSoundKey = null;
      scheduleSoundDrain();
    };

    audio.addEventListener('ended', release);
    audio.addEventListener('error', release);
  }
}

function handleFeedback(feedback) {
  if (!feedback || typeof feedback !== 'object') {
    return;
  }

  switch (feedback.type) {
    case 'loaded-ready':
      showReadyFeedback(feedback.payload?.sound || 'loaded');
      break;
    case 'play-sound':
      queueSound(feedback.payload?.sound, {
        interrupt: Boolean(feedback.payload?.interrupt),
      });
      break;
    default:
      break;
  }
}

function initTheme() {
  const syncTheme = () => {
    const savedTheme = localStorage.getItem('megafala-theme') || 'dark';
    if (document.documentElement.getAttribute('data-theme') !== savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    }

    const savedLanguage = localStorage.getItem('megafala-interface-language') || 'en';
    document.documentElement.lang = savedLanguage;
    document.documentElement.dir = savedLanguage === 'ar' ? 'rtl' : 'ltr';
    overlayEls.readyLabel.textContent = overlayReadyLabels[savedLanguage] || overlayReadyLabels.en;
  };
  syncTheme();
  window.addEventListener('storage', syncTheme);
  setInterval(syncTheme, 500); // Polling as fallback across electron windows
}

async function bootstrap() {
  initTheme();
  const initialState = await window.flowOverlay.getState();
  soundEffectsEnabled = Boolean(initialState.soundEffectsEnabled);
  applyWaveLevel(initialState.audioLevel || 0);
  renderOverlay(initialState);
  bindDrag();
  bindSoundLifecycle();

  window.flowOverlay.onStateUpdate((state) => {
    soundEffectsEnabled = Boolean(state.soundEffectsEnabled);
    if (!soundEffectsEnabled) {
      stopAllSounds();
    }
    renderOverlay(state);
  });
  window.flowOverlay.onAudioLevelUpdate((level) => {
    if (lastOverlayMode !== 'recording') {
      return;
    }

    setAudioLevel(level);
  });
  window.flowOverlay.onFeedback((feedback) => {
    handleFeedback(feedback);
  });
}

bootstrap();
