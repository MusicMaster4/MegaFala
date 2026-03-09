const overlayEls = {
  shell: document.getElementById('overlay-shell'),
  pill: document.getElementById('overlay-pill'),
  badge: document.getElementById('overlay-badge'),
  wave: document.getElementById('overlay-wave'),
  loader: document.getElementById('overlay-loader'),
  glyph: document.getElementById('overlay-glyph'),
};

let dragState = null;
let queuedPoint = null;
let dragFrame = 0;
let levelFrame = 0;
let currentAudioLevel = 0;
let targetAudioLevel = 0;
let lastOverlayMode = 'idle';

const waveBars = Array.from(overlayEls.wave.querySelectorAll('span'));
const barWeights = [0.46, 0.78, 1, 0.78, 0.46];

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
  const mode = getOverlayMode(state);
  const handsFree = isHandsFreeActive(state);
  overlayEls.shell.dataset.mode = mode;
  overlayEls.shell.dataset.handsFree = handsFree ? 'true' : 'false';
  overlayEls.wave.classList.toggle('hidden', mode !== 'recording');
  overlayEls.loader.classList.toggle('hidden', mode !== 'loading');
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

function applyWaveLevel(level) {
  const clampedLevel = Math.max(0, Math.min(1, Number(level) || 0));
  const visualLevel = Math.min(1, clampedLevel * 2);
  overlayEls.shell.style.setProperty('--overlay-level', visualLevel.toFixed(3));

  waveBars.forEach((bar, index) => {
    const intensity = Math.min(1, visualLevel * barWeights[index]);
    const height = 3 + intensity * 12;
    const opacity = 0.34 + intensity * 0.66;
    const scale = 0.82 + intensity * 0.24;
    bar.style.height = `${height.toFixed(2)}px`;
    bar.style.opacity = opacity.toFixed(3);
    bar.style.transform = `scaleY(${scale.toFixed(3)})`;
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

async function bootstrap() {
  const initialState = await window.flowOverlay.getState();
  applyWaveLevel(initialState.audioLevel || 0);
  renderOverlay(initialState);
  bindDrag();

  window.flowOverlay.onStateUpdate((state) => {
    renderOverlay(state);
  });
  window.flowOverlay.onAudioLevelUpdate((level) => {
    if (lastOverlayMode !== 'recording') {
      return;
    }

    setAudioLevel(level);
  });
}

bootstrap();
