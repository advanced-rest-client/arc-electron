const electron = require('electron');
const app = electron.app;
const ipc = require('electron').ipcMain;
const dialog = require('electron').dialog;
const {ArcWindowsManager} = require('./scripts/windows-manager');
const {UpdateStatus} = require('./scripts/update-status');

class Arc {
  constructor() {
    this.wm = new ArcWindowsManager();
    this.us = new UpdateStatus(this.wm);
  }

  attachListeners() {
    app.on('ready', this._readyHandler.bind(this));
    app.on('window-all-closed', this._allClosedHandler.bind(this));
    app.on('activate', this._activateHandler.bind(this));
  }

  _readyHandler() {
    this.wm.open();
    this.us.start();
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
