const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('flowOverlay', {
  getState: () => ipcRenderer.invoke('get-state'),
  onStateUpdate: (callback) => {
    const listener = (_event, state) => callback(state);
    ipcRenderer.on('app-state', listener);

    return () => {
      ipcRenderer.removeListener('app-state', listener);
    };
  },
});
