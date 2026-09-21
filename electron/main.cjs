const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { getDb, loadState, saveState, login, listUsers, createUserAccount, resetUserPassword, setUserStatus } = require('./database.cjs');

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: "Shivraj Masala Business Management",
    icon: path.join(__dirname, '..', 'build', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    },
  });

  if (app.isPackaged) {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  } else {
    win.loadURL('http://localhost:5173');
  }
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  getDb();

  ipcMain.handle('state:load', () => loadState());

  ipcMain.handle('state:save', (_e, snapshot) =>
    saveState(snapshot)
  );

  ipcMain.handle('auth:login', (_e, credentials) =>
    login(credentials?.username, credentials?.password)
  );

  ipcMain.handle('auth:users:list', () => listUsers());
  ipcMain.handle('auth:users:create', (_e, data) => createUserAccount(data));
  ipcMain.handle('auth:users:reset-password', (_e, data) => resetUserPassword(data?.id, data?.password));
  ipcMain.handle('auth:users:set-status', (_e, data) => setUserStatus(data?.id, data?.status));

  ipcMain.handle('backup:create', async () => {
    const result = await dialog.showSaveDialog({
      title: 'Save Business Backup',
      defaultPath: `shivraj-backup-${new Date().toISOString().slice(0, 10)}.db`,
      filters: [
        {
          name: 'SQLite Database',
          extensions: ['db']
        }
      ]
    });

    if (result.canceled || !result.filePath) {
      return { ok: false };
    }

    const source = path.join(
      app.getPath('userData'),
      'shivraj-masale.db'
    );

    fs.copyFileSync(source, result.filePath);

    return {
      ok: true,
      path: result.filePath
    };
  });

  // ── Invoice PDF: Save to userData/invoices/ ──
  ipcMain.handle('invoice:save-pdf', (_e, data) => {
    try {
      const { filename, base64 } = data || {};
      if (!filename || !base64) return { ok: false, error: 'Missing filename or PDF data.' };
      // Sanitise filename: keep only safe characters
      const safeName = String(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
      const invoicesDir = path.join(app.getPath('userData'), 'invoices');
      if (!fs.existsSync(invoicesDir)) fs.mkdirSync(invoicesDir, { recursive: true });
      const filePath = path.join(invoicesDir, safeName);
      fs.writeFileSync(filePath, Buffer.from(base64, 'base64'));
      return { ok: true, path: filePath };
    } catch (err) {
      return { ok: false, error: String(err.message || err) };
    }
  });

  // ── WhatsApp: Open wa.me URL securely ──
  ipcMain.handle('whatsapp:open', async (_e, data) => {
    try {
      const { phone, message } = data || {};
      if (!phone || !/^\d{10,15}$/.test(String(phone))) {
        return { ok: false, error: 'Invalid phone number.' };
      }
      const encoded = encodeURIComponent(String(message || ''));
      const url = `https://wa.me/${phone}?text=${encoded}`;
      // Security: only allow https://wa.me/ URLs
      if (!url.startsWith('https://wa.me/')) {
        return { ok: false, error: 'Invalid WhatsApp URL.' };
      }
      await shell.openExternal(url);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: String(err.message || err) };
    }
  });

  // ── Invoice PDF: Open with default viewer ──
  ipcMain.handle('invoice:open-pdf', async (_e, filePath) => {
    try {
      if (!filePath || !fs.existsSync(String(filePath))) {
        return { ok: false, error: 'PDF file not found.' };
      }
      const result = await shell.openPath(String(filePath));
      // shell.openPath returns an empty string on success, error message on failure
      return result ? { ok: false, error: result } : { ok: true };
    } catch (err) {
      return { ok: false, error: String(err.message || err) };
    }
  });

  // ── Invoice PDF: Reveal in File Explorer ──
  ipcMain.handle('invoice:show-in-folder', (_e, filePath) => {
    try {
      if (!filePath || !fs.existsSync(String(filePath))) {
        return { ok: false, error: 'PDF file not found.' };
      }
      shell.showItemInFolder(String(filePath));
      return { ok: true };
    } catch (err) {
      return { ok: false, error: String(err.message || err) };
    }
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});