const overlayEls = {
  shell: document.getElementById('overlay-shell'),
  wave: document.getElementById('overlay-wave'),
  loader: document.getElementById('overlay-loader'),
  glyph: document.getElementById('overlay-glyph'),
};

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

function renderOverlay(state) {
  const mode = getOverlayMode(state);
  overlayEls.shell.dataset.mode = mode;
  overlayEls.wave.classList.toggle('hidden', mode !== 'recording');
  overlayEls.loader.classList.toggle('hidden', mode !== 'loading');
  overlayEls.glyph.classList.toggle('hidden', mode === 'recording' || mode === 'loading');
}

async function bootstrap() {
  const initialState = await window.flowOverlay.getState();
  renderOverlay(initialState);

  window.flowOverlay.onStateUpdate((state) => {
    renderOverlay(state);
  });
}

bootstrap();
