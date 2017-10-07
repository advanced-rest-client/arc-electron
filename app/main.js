const electron = require('electron');
const app = electron.app;
const ipc = require('electron').ipcMain;
const dialog = require('electron').dialog;
const {ArcWindowsManager} = require('./scripts/windows-manager');
const {UpdateStatus} = require('./scripts/update-status');
const {ArcMainMenu} = require('./scripts/main-menu');

class Arc {
  constructor() {
    this.menu = new ArcMainMenu();
    this.wm = new ArcWindowsManager();
    this.us = new UpdateStatus(this.wm, this.menu);

    this._listenMenu(this.menu);
  }

  attachListeners() {
    app.on('ready', this._readyHandler.bind(this));
    app.on('window-all-closed', this._allClosedHandler.bind(this));
    app.on('activate', this._activateHandler.bind(this));
  }

  _readyHandler() {
    this.wm.open();
    this.us.start();
    this.menu.build();
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

  _listenMenu(menu) {
    menu.on('menu-action', this._menuHandler.bind(this));
  }

  _menuHandler(action, win) {
    if (action.indexOf('application') === 0) {
      return this._handleApplicationAction(action.substr(12), win);
    }
    if (action.indexOf('request') === 0) {
      return win.webContents.send('request-action', action.substr(8));
    }
  }

  _handleApplicationAction(action, win) {
    var windowCommand = 'command';
    switch (action) {
      case 'install-update':
        this.us.installUpdate();
      break;
      case 'check-for-update':
        this.us.check();
      break;
      case 'quit':
        app.quit();
      break;
      case 'show-settings':
      case 'about':
      case 'open-license':
        win.webContents.send(windowCommand, action);
      break;
      case 'new-window':
        this.wm.open();
      break;
      case 'open-privacy-policy':
      case 'open-documentation':
      case 'open-faq':
      case 'open-discussions':
      case 'report-issue':
      case 'search-issues':
        let {HelpManager} = require('./scripts/help-manager');
        HelpManager.helpWith(action);
      break;
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
