const { contextBridge, ipcRenderer } = require('electron');

console.log('[Preload] Script loading...');

try {
  const path = require('path');
  const backupDir = path.join(process.env.APPDATA || path.join(process.env.USERPROFILE, 'AppData\\Roaming'), 'hosts-manager', 'backups');
  
  window.electronAPI = {
    backupDir: backupDir,
    isServiceReady: () => ipcRenderer.invoke('is-service-ready'),
    getHosts: () => ipcRenderer.invoke('get-hosts'),
    addHost: (host) => ipcRenderer.invoke('add-host', host),
    updateHost: (oldHost, newHost) => ipcRenderer.invoke('update-host', oldHost, newHost),
    deleteHost: (host) => ipcRenderer.invoke('delete-host', host),
    deleteHosts: (hosts) => ipcRenderer.invoke('delete-hosts', hosts),
    createBackup: () => ipcRenderer.invoke('create-backup'),
    restoreBackup: (backupPath) => ipcRenderer.invoke('restore-backup', backupPath),
    getBackups: () => ipcRenderer.invoke('get-backups'),
    undo: () => ipcRenderer.invoke('undo'),
    redo: () => ipcRenderer.invoke('redo'),
    canUndo: () => ipcRenderer.invoke('can-undo'),
    canRedo: () => ipcRenderer.invoke('can-redo'),
    openHostsFile: () => ipcRenderer.invoke('open-hosts-file'),
    showFolder: (folderPath) => ipcRenderer.invoke('show-folder', folderPath),
    validateIP: (ip) => ipcRenderer.invoke('validate-ip', ip),
    validateDomain: (domain) => ipcRenderer.invoke('validate-domain', domain),
    confirmDialog: (options) => ipcRenderer.invoke('confirm-dialog', options),
    showMessage: (options) => ipcRenderer.invoke('show-message', options)
  };

  console.log('[Preload] API exposed directly');
} catch (error) {
  console.error('[Preload] Error:', error);
}
