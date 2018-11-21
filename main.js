const {ipcMain, app, shell} = require('electron');
const {ThemesProtocolHandler} = require('./scripts/main/theme-protocol');
const {ArcWindowsManager} = require('./scripts/main/windows-manager');
const {UpdateStatus} = require('./scripts/main/update-status');
const {AppMenuService} = require('./scripts/main/app-menu-service');
const {ArcMainMenu} = require('./scripts/main/main-menu');
const {Oauth2Identity} = require('@advanced-rest-client/electron-oauth2');
const {DriveExport} = require('@advanced-rest-client/electron-drive');
const {PreferencesManager} = require('@advanced-rest-client/arc-electron-preferences/main');
const {SessionManager} = require('@advanced-rest-client/electron-session-state/main');
const {AppOptions} = require('./scripts/main/app-options');
const {RemoteApi} = require('./scripts/main/remote-api');
const {ContentSearchService} = require('@advanced-rest-client/arc-electron-search-service/main');
const {AppPrompts} = require('./scripts/main/app-prompts.js');
const {SourcesManager} = require('./scripts/packages/sources-manager/main');
const log = require('electron-log');
/**
 * Main application object controling app's lifecycle.
 */
class Arc {
  /**
   * @constructor
   */
  constructor() {
    const startupOptions = this._processArguments();
    this.initOptions = startupOptions.getOptions();
    this._registerProtocols();
  }
  /**
   * Attaches used event listeners to the `electron.app` object.
   */
  attachListeners() {
    app.on('ready', this._readyHandler.bind(this));
    app.on('window-all-closed', this._allClosedHandler.bind(this));
    app.on('activate', this._activateHandler.bind(this));
    // The most general events
    ipcMain.on('open-external-url', this._externalUrlHandler.bind(this));
  }
  /**
   * Registers application protocol and adds a handler.
   * The handler will be called when a user navigate to `protocol://data`
   * url in a browser. This is used when opening / creating a file from
   * Google Drive menu.
   */
  _registerProtocols() {
    // protocol.registerStandardSchemes(['themes']);
    log.info('Registering arc-file protocol');
    app.setAsDefaultProtocolClient('arc-file');
    app.on('open-url', (event, url) => {
      log.info('arc-file protocol handles ', url);
      event.preventDefault();
      let fileData = url.substr(11);
      let parts = fileData.split('/');
      switch (parts[0]) {
        case 'drive':
          // arc-file://drive/open/file-id
          // arc-file://drive/create/file-id
          this.wm.open('/request/drive/' + parts[1] + '/' + parts[2]);
        break;
      }
    });
  }
  /**
   * Registers protocols that can be registered only after the `ready`
   * event is dispatched.
   */
  _initializeProtocolsReady() {
    const tp = new ThemesProtocolHandler({
      debug: this.initOptions.debug
    });
    tp.register();
    this.themesProtocol = tp;
  }
  /**
   * Processes start arguments
   * @return {Object} [description]
   */
  _processArguments() {
    const startupOptions = new AppOptions();
    startupOptions.parse();
    return startupOptions;
  }
  /**
   * Called when the application is ready to start.
   * @return {Promise}
   */
  _readyHandler() {
    return this._initializePreferencesManager()
    .then(() => {
      this._initializeSourcesManager();
      this._initializeProtocolsReady();
      const {AppDefaults} = require('./scripts/main/app-defaults');
      const defaults = new AppDefaults();
      return defaults.prepareEnvironment(this.sourcesManager);
    })
    .catch((cause) => {
      log.error('Unable to prepare the environment.', cause.message);
      log.error(cause);
    })
    .then(() => {
      this._initializeMenu();
      this._initializeWindowsManager();
      this._initializeUpdateStatus();
      this._initializeGoogleDriveIntegration();
      this._initializeSessionManager();
      this._initializeSearchService();
      this._initializeApplicationMenu();
      this.remote = new RemoteApi(this.wm);
      log.info('Application is now ready');
      this.wm.open();
      if (!this.isDebug()) {
        this.us.start();
      }
      this.prompts = new AppPrompts();
      this.prompts.listen();
      this._listenMenu();
      Oauth2Identity.listen();
    })
    .catch((cause) => {
      log.error('Unable to start the application.', cause.message);
      log.error(cause);
    });
  }

  _initializePreferencesManager() {
    this.prefs = new PreferencesManager(this.initOptions);
    this.prefs.observe();
    this.prefs.on('settings-changed', this._settingsChangeHandler.bind(this));
    global.arcPreferences = this.prefs;
    return this.prefs.load()
    .then((settings) => {
      if (settings.popupMenuExperimentEnabled) {
        if (this.menu) {
          this.menu.enableAppMenuPopup();
        } else {
          this.__menuAppPopupEnabled = true;
        }
      }
    });
  }

  _initializeSourcesManager() {
    this.sourcesManager = new SourcesManager(this.prefs, this.initOptions);
    this.sourcesManager.listen();
    global.arcSources = this.sourcesManager;
  }

  _initializeMenu() {
    this.menu = new ArcMainMenu();
    this.menu.build();
    if (this.__menuAppPopupEnabled) {
      this.__menuAppPopupEnabled = undefined;
      this.menu.enableAppMenuPopup();
    }
  }

  _initializeGoogleDriveIntegration() {
    this.gdrive = new DriveExport();
    this.gdrive.listen();
  }

  _initializeSessionManager() {
    this.sm = new SessionManager({appUrls: [
      'https://advancedrestclient-1155.appspot.com',
      'advancedrestclient.com'
    ]});
    this.sm.listen();
    this.sm.on('cookie-changed', (cookies) =>
      this.wm.notifyAll('cookie-changed', cookies));
  }
  /**
   * Initializes `ContentSearchService` from
   * `@advanced-rest-client/arc-electron-search-service`
   */
  _initializeSearchService() {
    ContentSearchService.prefsManager = this.prefs;
    ContentSearchService.startupOptions = this.initOptions;
    ContentSearchService.listen(this.menu);
  }

  _initializeWindowsManager() {
    this.wm = new ArcWindowsManager(this.initOptions, this.sourcesManager);
    this.wm.listen();
  }

  _initializeUpdateStatus() {
    this.us = new UpdateStatus(this.wm, this.menu);
    this.us.listen();
  }

  _initializeApplicationMenu() {
    const instance = new AppMenuService(this.wm, this.sourcesManager);
    instance.listen();
    this.appMenuService = instance;
  }
  /**
   * Quits when all windows are closed.
   */
  _allClosedHandler() {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  }
  /**
   * On OS X it's common to re-create a window in the app when the
   * dock icon is clicked and there are no other windows open.
   */
  _activateHandler() {
    if (!this.wm.hasWindow) {
      this.wm.open();
    } else {
      this.wm.restoreLast();
    }
  }
  /**
   * Listens on menu actions.
   */
  _listenMenu() {
    this.menu.on('menu-action', this._menuHandler.bind(this));
  }
  /**
   * Event handler for menu actions.
   *
   * @param {String} action Action type to perform
   * @param {BrowserWindow} win
   */
  _menuHandler(action, win) {
    if (action.indexOf('application') === 0) {
      this._handleApplicationAction(action.substr(12), win);
      return;
    }
    if (action.indexOf('request') === 0) {
      win.webContents.send('request-action', action.substr(8));
      return;
    }
  }
  /**
   * Handles `application` group of commands
   *
   * @param {String} action Application action.
   * @param {BrowserWindow} win Target window.
   */
  _handleApplicationAction(action, win) {
    let windowCommand = 'command';
    switch (action) {
      case 'quit':
        app.quit();
        break;
      case 'new-window':
        this.wm.open();
        break;
      case 'task-manager':
        this.wm.openTaskManager();
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
      case 'popup-menu':
        this.appMenuService.togglePopupMenu();
        break;
      default:
        win.webContents.send(windowCommand, action);
    }
  }
  /**
   * Returns true if current instance is being debugged.
   *
   * @return {Boolean} [description]
   */
  isDebug() {
    return !!process.argv.find((i) => i.indexOf('--inspect') !== -1);
  }
  /**
   * Handles opening an URL in a browser action.
   * @param {Event} e
   * @param {String} url The URL to open.
   */
  _externalUrlHandler(e, url) {
    if (!url) {
      return;
    }
    shell.openExternal(url);
  }
  /**
   * Handler for settings change.
   * @param {String} name Changed property name
   * @param {any} value Changed value
   */
  _settingsChangeHandler(name, value) {
    switch (name) {
      case 'popupMenuExperimentEnabled':
        if (this.menu) {
          if (value) {
            this.menu.enableAppMenuPopup();
          } else {
            this.menu.disableAppMenuPopup();
          }
        }
        break;
    }
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
