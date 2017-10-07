const electron = require('electron');
const app = electron.app;
const ipc = require('electron').ipcMain;
const dialog = require('electron').dialog;
const {ArcWindowsManager} = require('./scripts/windows-manager');
const log = require('electron-log');
const {autoUpdater} = require('electron-updater');
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.info('App starting...');

class Arc {
  constructor() {
    this.wm = new ArcWindowsManager();
  }

  attachListeners() {
    app.on('ready', this._readyHandler.bind(this));
    app.on('window-all-closed', this._allClosedHandler.bind(this));
    app.on('activate', this._activateHandler.bind(this));
  }

  _readyHandler() {
    this.wm.open();
    autoUpdater.checkForUpdates();
  }
  // Quits when all windows are closed.
  _allClosedHandler() {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  }
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  _activateHandler() {
    if (!this.wm.hasWindow) {
      this.wm.open();
    }
  }

  notifyWindows(type, ...args) {
    this.wm.notifyAll(type, args);
  }
}

const arcApp = new Arc();
arcApp.attachListeners();

// TODO: // move this to seperate file that is responsible for IPC
ipc.on('save-dialog', function(event, args) {
  args = args || {};
  const options = {
    title: 'Save to file'
  };
  if (args.file) {
    options.nameFieldLabel = args.file;
  }
  dialog.showSaveDialog(options, function(filename) {
    event.sender.send('saved-file', filename);
  });
});

ipc.on('new-window', function() {
  arcApp.wm.open();
});

ipc.on('toggle-devtools', (event) => {
  event.sender.webContents.toggleDevTools();
});

// Auto updater
autoUpdater.on('checking-for-update', () => {
  arcApp.notifyWindows('autoupdate-checking-for-update');
});
autoUpdater.on('update-available', (info) => {
  arcApp.notifyWindows('autoupdate-update-available', info);
});
autoUpdater.on('update-not-available', (info) => {
  arcApp.notifyWindows('autoupdate-update-not-available', info);
});
autoUpdater.on('error', (err) => {
  arcApp.notifyWindows('autoupdate-error', err);
});
autoUpdater.on('download-progress', (progressObj) => {
  arcApp.notifyWindows('autoupdate-download-progress', progressObj);
});
autoUpdater.on('update-downloaded', (info) => {
  arcApp.notifyWindows('autoupdate-update-downloaded', info);
  // autoUpdater.quitAndInstall();
});
