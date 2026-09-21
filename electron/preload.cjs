const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('desktopAPI', {
  loadState: () => ipcRenderer.invoke('state:load'),
  saveState: (snapshot) => ipcRenderer.invoke('state:save', snapshot),
  login: (credentials) => ipcRenderer.invoke('auth:login', credentials),
  createBackup: () => ipcRenderer.invoke('backup:create'),
  listAuthUsers: () => ipcRenderer.invoke('auth:users:list'),
  createAuthUser: (data) => ipcRenderer.invoke('auth:users:create', data),
  resetAuthPassword: (data) => ipcRenderer.invoke('auth:users:reset-password', data),
  setAuthUserStatus: (data) => ipcRenderer.invoke('auth:users:set-status', data),
  // Invoice PDF & WhatsApp sharing
  saveInvoicePDF: (filename, base64) => ipcRenderer.invoke('invoice:save-pdf', { filename, base64 }),
  openWhatsApp: (phone, message) => ipcRenderer.invoke('whatsapp:open', { phone, message }),
  openInvoicePDF: (filePath) => ipcRenderer.invoke('invoice:open-pdf', filePath),
  showInvoiceInFolder: (filePath) => ipcRenderer.invoke('invoice:show-in-folder', filePath),
});
