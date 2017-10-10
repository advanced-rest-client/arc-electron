const electron = require('electron');
const app = electron.app;
const ipc = require('electron').ipcMain;
const dialog = require('electron').dialog;
const {ArcWindowsManager} = require('./scripts/windows-manager');
const {UpdateStatus} = require('./scripts/update-status');
const {ArcMainMenu} = require('./scripts/main-menu');
const {ArcIdentity} = require('./scripts/oauth2');
const {DriveExport} = require('./scripts/drive-export');

class Arc {
  constructor() {
    this._registerProtocols();
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
  /**
   * Registers application protocol and adds a handler.
   * The handler will be called when a user navigate to `protocol://data`
   * url in a browser. This is used when opening / creating a file from
   * Google Drive menu.
   */
  _registerProtocols() {
    app.setAsDefaultProtocolClient('arc-file');
    app.on('open-url', (event, url) => {
      event.preventDefault();
      var fileData = url.substr(11);
      var parts = fileData.split('/');
      switch (parts[0]) {
        case 'drive':
          // arc-file://drive/open/file-id
          // arc-file://drive/create/file-id
          this.wm.open('/request/drive/' + parts[1] + '/' + parts[2]);
        break;
      }
    });
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
        this.us.check({
          notify: true
        });
      break;
      case 'quit':
        app.quit();
      break;
      case 'show-settings':
      case 'about':
      case 'open-license':
      case 'import-data':
      case 'export-data':
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

ipc.on('oauth-2-get-token', (event, options) => {
  ArcIdentity.getAuthToken(options)
  .then(token => {
    event.sender.send('oauth-2-token-ready', token);
  })
  .catch(cause => {
    event.sender.send('oauth-2-token-error', cause);
  });
});
ipc.on('check-for-update', () => {
  arcApp.us.check({
    notify: false
  });
});
ipc.on('install-update', () => {
  arcApp.us.installUpdate();
});

ipc.on('google-drive-data-save', (event, requestId, content, type, fileName) => {
  var config = {
    resource: {
      name: fileName,
      description: 'Advanced REST client data export file.'
    },
    media: {
      mimeType: type || 'application/json',
      body: content
    }
  };
  const drive = new DriveExport();
  drive.create(config)
  .then(result => {
    event.sender.send('google-drive-data-save-result', requestId, result);
  })
  .catch(cause => {
    event.sender.send('google-drive-data-save-error', requestId, cause);
  });
});

ipc.on('drive-request-save', (event, requestId, request, fileName) => {
  var driveId;
  if (request.driveId) {
    driveId = request.driveId;
    delete request.driveId;
  }
  var config = {
    resource: {
      name: fileName + '.arc',
    },
    media: {
      mimeType: 'application/json',
      body: request
    }
  };
  const drive = new DriveExport();
  var promise;
  if (driveId) {
    promise = drive.update(driveId, config);
  } else {
    config.resource.description = request.description || 'Advanced REST client export file.';
    promise = drive.create(config);
  }

  promise
  .then(result => {
    event.sender.send('drive-request-save-result', requestId, result);
  })
  .catch(cause => {
    event.sender.send('drive-request-save-error', requestId, cause);
  });
});
