const {ipcMain, app, shell} = require('electron');
const {ThemesProtocolHandler} = require('./scripts/main/theme-protocol');
const {ComponentsProtocolHandler} = require('./scripts/main/components-protocol');
const {ArcWindowsManager} = require('./scripts/main/windows-manager');
const {UpdateStatus} = require('./scripts/main/update-status');
const {AppMenuService} = require('./scripts/main/app-menu-service');
const {ArcMainMenu} = require('./scripts/main/main-menu');
const {Oauth2Identity} = require('@advanced-rest-client/electron-oauth2');
const {DriveExport} = require('@advanced-rest-client/electron-drive');
const {PreferencesManager} = require('./scripts/packages/arc-preferences/main');
const {SessionManager} = require('@advanced-rest-client/electron-session-state/main');
const {AppOptions} = require('./scripts/main/app-options');
const {RemoteApi} = require('./scripts/main/remote-api');
const {ContentSearchService} = require('./scripts/packages/search-service/main');
const {AppPrompts} = require('./scripts/main/app-prompts.js');
const {SourcesManager} = require('./scripts/packages/sources-manager/main');
const log = require('./scripts/main/logger');
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
    log.debug('Registering arc-file protocol');
    app.setAsDefaultProtocolClient('arc-file');
    app.on('open-url', (event, url) => {
      log.debug('arc-file protocol handles ', url);
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
    log.debug('Initializing themes protocol');
    const tp = new ThemesProtocolHandler();
    tp.register();
    this.themesProtocol = tp;
    const cp = new ComponentsProtocolHandler();
    cp.register();
    this.componentsProtocol = cp;
  }
  /**
   * Processes start arguments
   * @return {Object} [description]
   */
  _processArguments() {
    const startupOptions = new AppOptions();
    startupOptions.parse();
    if (startupOptions.debug) {
      log.level = 'debug';
    }
    return startupOptions;
  }
  /**
   * Called when the application is ready to start.
   * @return {Promise}
   */
  _readyHandler() {
    log.debug('Ready event handled. Initializing application.');
    return this._initializePreferencesManager()
    .then(() => {
      log.debug('Preferences initialized');
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
      log.debug('Protocols ready');
      this._initializeMenu();
      this._initializeWindowsManager();
      this._initializeUpdateStatus();
      this._initializeGoogleDriveIntegration();
      this._initializeSessionManager();
      this._initializeSearchService();
      this._initializeApplicationMenu();
      this.remote = new RemoteApi(this.wm);
      this.wm.open();
      if (!this.isDebug()) {
        this.us.start(this.initOptions.settingsFile);
      }
      this.prompts = new AppPrompts();
      this.prompts.listen();
      Oauth2Identity.listen();
      log.info('Application is now ready.');
    })
    .catch((cause) => {
      log.error('Unable to start the application.', cause.message);
      log.error(cause);
    });
  }

  _initializePreferencesManager() {
    log.debug('Initializing preferences manager.');
    this.prefs = new PreferencesManager(this.initOptions);
    this.prefs.observe();
    this.prefs.on('settings-changed', this._settingsChangeHandler.bind(this));
    global.arcPreferences = this.prefs;
    log.debug('Loading user configuration.');
    return this.prefs.load()
    .then((settings) => {
      log.debug('User configuration ready.');
      if (settings.popupMenuExperimentEnabled) {
        log.info('Enabling menu popup experiment.');
        if (this.menu) {
          this.menu.enableAppMenuPopup();
        } else {
          this.__menuAppPopupEnabled = true;
        }
      }
    });
  }

  _initializeSourcesManager() {
    log.debug('Initializing sources manager.');
    this.sourcesManager = new SourcesManager(this.prefs, this.initOptions);
    this.sourcesManager.listen();
    global.arcSources = this.sourcesManager;
  }

  _initializeMenu() {
    log.debug('Initializing application menu (system menu).');
    this.menu = new ArcMainMenu();
    this.menu.build();
    log.debug('Listening for system menu events.');
    this.menu.on('menu-action', (action, win) => {
      this._menuHandler(action, win);
    });
    if (this.__menuAppPopupEnabled) {
      this.__menuAppPopupEnabled = undefined;
      this.menu.enableAppMenuPopup();
    }
  }

  _initializeApplicationMenu() {
    log.debug('Initializing app menu service (popup listener).');
    const instance = new AppMenuService(this.wm, this.sourcesManager);
    instance.listen();
    this.appMenuService = instance;
  }

  _initializeGoogleDriveIntegration() {
    log.debug('Initializing Google Drive integration.');
    this.gdrive = new DriveExport();
    this.gdrive.listen();
  }

  _initializeSessionManager() {
    log.debug('Initializing session manager.');
    this.sm = new SessionManager({appUrls: [
      'https://advancedrestclient-1155.appspot.com',
      'advancedrestclient.com'
    ]});
    this.sm.listen();
    this.sm.on('cookie-changed', (cookies) =>
      this.wm.notifyAll('cookie-changed', cookies));
  }
  /**
   * Initializes `ContentSearchService`
   */
  _initializeSearchService() {
    log.debug('Initializing content search service.');
    ContentSearchService.listen(this.menu);
  }

  _initializeWindowsManager() {
    log.debug('Initializing windows manager.');
    this.wm = new ArcWindowsManager(this.initOptions);
    this.wm.listen();
  }

  _initializeUpdateStatus() {
    log.info('Initializing update manager.');
    this.us = new UpdateStatus(this.wm, this.menu);
    this.us.listen();
  }
  /**
   * Quits when all windows are closed.
   */
  _allClosedHandler() {
    log.debug('All windows are now closed.');
    if (process.platform !== 'darwin') {
      log.debug('Quiting main thread.');
      app.quit();
    } else {
      log.debug('Keeping main thread running.');
    }
  }
  /**
   * On OS X it's common to re-create a window in the app when the
   * dock icon is clicked and there are no other windows open.
   */
  _activateHandler() {
    log.debug('Activating window.');
    if (!this.wm.hasWindow) {
      this.wm.open();
    } else {
      this.wm.restoreLast();
    }
  }
  /**
   * Event handler for menu actions.
   *
   * @param {String} action Action type to perform
   * @param {BrowserWindow} win
   */
  _menuHandler(action, win) {
    log.debug('Handing menu command: ' + action);
    if (action.indexOf('application') === 0) {
      this._handleApplicationAction(action.substr(12), win);
      return;
    }
    if (action.indexOf('request') === 0) {
      win.webContents.send('request-action', action.substr(8));
      return;
    }
    log.warn('Menu command not handled: ' + action);
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
        log.debug('Quiting the app.');
        app.quit();
        break;
      case 'new-window':
        log.debug('Opening new window.');
        this.wm.open();
        break;
      case 'task-manager':
        log.debug('Opening task manager.');
        this.wm.openTaskManager();
        break;
      case 'open-privacy-policy':
      case 'open-documentation':
      case 'open-faq':
      case 'open-discussions':
      case 'report-issue':
      case 'search-issues':
      case 'web-session-help':
        log.debug('Running help action.');
        let {HelpManager} = require('./scripts/main/help-manager');
        HelpManager.helpWith(action);
        break;
      case 'popup-menu':
        log.debug('Toggling popup menu.');
        this.appMenuService.togglePopupMenu();
        break;
      default:
        log.debug('Sending action to the UI thred.', action);
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
    log.debug('Opening external URL: ' + url);
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
      case 'releaseChannel':
        this.us.updateReleaseChannel(value);
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
