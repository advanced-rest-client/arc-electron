const {ipcMain, dialog, app, BrowserWindow} = require('electron');
const {ArcWindowsManager} = require('./scripts/main/windows-manager');
const {UpdateStatus} = require('./scripts/main/update-status');
const {ArcMainMenu} = require('./scripts/main/main-menu');
const {ArcIdentity} = require('./scripts/main/oauth2');
const {DriveExport} = require('./scripts/main/drive-export');
const {SessionManager} = require('./scripts/main/session-manager');
const {AppOptions} = require('./scripts/main/app-options');
const {RemoteApi} = require('./scripts/main/remote-api');
const {AppDefaults} = require('./scripts/main/app-defaults');
const log = require('electron-log');

class Arc {
  constructor() {
    this._registerProtocols();
    const startupOptions = this._processArguments();
    this.menu = new ArcMainMenu();
    this.wm = new ArcWindowsManager(startupOptions.getOptions());
    this.us = new UpdateStatus(this.wm, this.menu);
    this.sm = new SessionManager(this.wm);
    this.remote = new RemoteApi(this.wm);
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
    log.info('Registering arc-file protocol');
    app.setAsDefaultProtocolClient('arc-file');
    app.on('open-url', (event, url) => {
      log.info('arc-file protocol handles ', url);
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
  // processes start arguments
  _processArguments() {
    const startupOptions = new AppOptions();
    startupOptions.parse();
    return startupOptions;
  }

  _readyHandler() {
    const defaults = new AppDefaults();
    return defaults.prepareEnvironment()
    .catch(cause => {
      log.error('Unable to prepare the environment.', cause.message);
      log.error(cause);
    })
    .then(() => {
      log.info('Application is now ready');
      this.wm.open();
      if (!this.isDebug()) {
        this.us.start();
      }
      this.menu.build();
      this.sm.start();
    });
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
      case 'open-saved':
      case 'open-history':
      case 'open-drive':
      case 'open-messages':
      case 'show-settings':
      case 'about':
      case 'open-license':
      case 'import-data':
      case 'export-data':
      case 'find':
      case 'login-external-webservice':
      case 'open-cookie-manager':
      case 'open-hosts-editor':
      case 'open-themes':
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
      case 'web-session-help':
        let {HelpManager} = require('./scripts/main/help-manager');
        HelpManager.helpWith(action);
      break;
      case 'task-manager':
        this.wm.openTaskManager();
      break;
    }
  }
  /**
   * Returns true if current instance is being debugged.
   *
   * @return {Boolean} [description]
   */
  isDebug() {
    return !!process.argv.find(i => i.indexOf('--inspect') !== -1);
  }
}

const arcApp = new Arc();
arcApp.attachListeners();

// Unit testing
if (process.env.NODE_ENV === 'test') {
  const testInterface = require('./scripts/main/test-interface');
  testInterface(app, arcApp);
}

if (arcApp.isDebug()) {
  global.arcApp = arcApp;
}

// TODO: // move this to seperate file that is responsible for IPC
ipcMain.on('save-dialog', function(event, args) {
  args = args || {};
  const options = {
    title: 'Save to file'
  };
  if (args.file) {
    options.defaultPath = args.file;
  }
  dialog.showSaveDialog(options, function(filename) {
    event.sender.send('saved-file', filename);
  });
});

ipcMain.on('new-window', function() {
  arcApp.wm.open();
});

ipcMain.on('toggle-devtools', (event) => {
  event.sender.webContents.toggleDevTools();
});

ipcMain.on('oauth-2-get-token', (event, options) => {
  ArcIdentity.getAuthToken(options)
  .then(token => {
    event.sender.send('oauth-2-token-ready', token);
  })
  .catch(cause => {
    event.sender.send('oauth-2-token-error', cause);
  });
});
ipcMain.on('oauth-2-launch-web-flow', (event, options) => {
  ArcIdentity.launchWebAuthFlow(options)
  .then(token => {
    event.sender.send('oauth-2-token-ready', token);
  })
  .catch(cause => {
    event.sender.send('oauth-2-token-error', cause);
  });
});
ipcMain.on('check-for-update', () => {
  arcApp.us.check({
    notify: false
  });
});
ipcMain.on('install-update', () => {
  arcApp.us.installUpdate();
});

ipcMain.on('google-drive-data-save', (event, requestId, content, type, fileName) => {
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

ipcMain.on('drive-request-save', (event, requestId, request, fileName) => {
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
    var result = {
      message: cause.message || 'Unknown Goodle Drive save error',
      stack: cause.stack || ''
    };
    event.sender.send('drive-request-save-error', requestId, result);
  });
});

ipcMain.on('open-web-url', (event, url, purpose) => {
  switch (purpose) {
    case 'web-session': arcApp.sm.openWebBrowser(url); break;
  }
});

ipcMain.on('cookies-session', (event, data) => {
  arcApp.sm.handleRequest(event.sender, data);
});

ipcMain.on('open-theme-editor', (event, data) => {
  log.info('Starting theme editor');
  const windowId = event.sender.id;
  const {ThemesEditor} = require('./scripts/main/themes-editor.js');
  const editor = new ThemesEditor(windowId, data);
  editor.run();
});

ipcMain.on('reload-app-required', (event, message) => {
  message = message || 'To complete the action reload the application.';
  const win = BrowserWindow.fromWebContents(event.sender);
  dialog.showMessageBox(win, {
    type: 'info',
    buttons: ['Reload', 'Later'],
    defaultId: 0,
    cancelId: 1,
    title: 'Reload Advanced REST Client?',
    message: message,
  }, (response) => {
    if (response === 0) {
      arcApp.wm.reloadWindows();
    }
  });
});
