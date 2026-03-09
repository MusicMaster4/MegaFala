const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('flowOverlay', {
  getState: () => ipcRenderer.invoke('get-state'),
  dragTo: (position) => ipcRenderer.send('overlay-drag-move', position),
  endDrag: (position) => ipcRenderer.send('overlay-drag-end', position),
  onStateUpdate: (callback) => {
    const listener = (_event, state) => callback(state);
    ipcRenderer.on('app-state', listener);

    return () => {
      ipcRenderer.removeListener('app-state', listener);
    };
  },
  onAudioLevelUpdate: (callback) => {
    const listener = (_event, level) => callback(level);
    ipcRenderer.on('overlay-audio-level', listener);

    return () => {
      ipcRenderer.removeListener('overlay-audio-level', listener);
    };
  },
  onFeedback: (callback) => {
    const listener = (_event, feedback) => callback(feedback);
    ipcRenderer.on('overlay-feedback', listener);

    return () => {
      ipcRenderer.removeListener('overlay-feedback', listener);
    };
  },
});
