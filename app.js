// Scrips are moved to scripts/renderer/preload.js so node integration can be disabled
// in the application window.
/**
 * Class responsible for initializing the main ARC elements
 * and setup base options.
 * Also serves as a communication bridge between main process and app window.
 *
 * This is only supported in the Electron platform.
 *
 * In ARC node integration is disabled as responses received from the server
 * can be executed in preview window. Any script would instantly get access
 * to whole electron and node environment. As a consequence the script
 * would have access to user system. Classes that need access to electron / node
 * API are loaded in sandbox in the preload script and initialized here.
 * Scripts can't use `require()` or any other node function.
 */
class ArcInit {
  /**
   * @constructor
   */
  constructor() {
    /* global ipc, ArcContextMenu, ArcElectronDrive, OAuth2Handler,
    ThemeManager, ArcPreferencesProxy, CookieBridge, WorkspaceManager,
    FilesystemProxy, ElectronAmfService, versionInfo, WindowSearchService,
    UpgradeHelper, ImportFilePrePprocessor */
    this.created = false;
    this.contextActions = new ArcContextMenu();
    this.driveBridge = new ArcElectronDrive();
    this.oauth2Proxy = new OAuth2Handler();
    this.themeManager = new ThemeManager();
    this.prefProxy = new ArcPreferencesProxy();
    this.cookieBridge = new CookieBridge();
    this.fs = new FilesystemProxy();
    this.amfService = new ElectronAmfService();
    this.search = new WindowSearchService();
  }
  /**
   * @return {ImportFilePrePprocessor} Instance of import processor class.
   */
  get importPreprocessor() {
    if (!this.__importPreprocessor) {
      this.__importPreprocessor = new ImportFilePrePprocessor();
    }
    return this.__importPreprocessor;
  }
  /**
   * Reference to the main application window.
   *
   * @return {HtmlElement}
   */
  get app() {
    return document.getElementById('app');
  }
  /**
   * Listens for application events to create a communication
   * bridge between main process and the app.
   */
  listen() {
    this.contextActions.listenMainEvents();
    window.onbeforeunload = this.beforeUnloadWindow.bind(this);
    this.driveBridge.listen();
    this.oauth2Proxy.listen();
    this.themeManager.listen();
    this.prefProxy.observe();
    this.cookieBridge.listen();
    this.fs.listen();
    this.amfService.listen();
    this.search.listen();

    ipc.on('checking-for-update', () => {
      this.updateEventHandler('checking-for-update');
    });
    ipc.on('update-available', (info) => {
      this.updateEventHandler('update-available', info);
    });
    ipc.on('update-not-available', () => {
      this.updateEventHandler('update-not-available');
    });
    ipc.on('autoupdate-error', (error) => {
      this.updateEventHandler('autoupdate-error', error);
    });
    ipc.on('download-progress', (progressObj) => {
      this.updateEventHandler('download-progress', progressObj);
    });
    ipc.on('update-downloaded', (info) => {
      this.updateEventHandler('update-downloaded', info);
    });
    ipc.on('command', this.commandHandler.bind(this));
    ipc.on('request-action', this.execRequestAction.bind(this));
    ipc.on('theme-editor-preview', this._themePreviewHandler.bind(this));
    ipc.on('window-state-info', this._stateInfoHandler.bind(this));
    ipc.on('app-navigate', this._appNavHandler.bind(this));
    ipc.on('popup-app-menu-opened', this._popupMenuOpened.bind(this));
    ipc.on('popup-app-menu-closed', this._popupMenuClosed.bind(this));
  }
  /**
   * Requests initial state information from the main process for current
   * window.
   */
  requestState() {
    ipc.send('window-state-request');
  }
  /**
   * Handler for the `window-state-info` event from the main process.
   * Setups properties to be passed to the ARC application.
   *
   * When this is called it creates application window and places it in the
   * document body.
   *
   * @param {Event} e
   * @param {Object} info Main proces initil properties. See `AppOptions` class
   * for more details.
   */
  _stateInfoHandler(e, info) {
    info = info || {};
    const initConfig = info;
    if (!initConfig.workspaceIndex) {
      initConfig.workspaceIndex = 0;
    }
    this.workspaceIndex = initConfig.workspaceIndex;
    if (!window.ArcConfig) {
      window.ArcConfig = {};
    }
    this.initConfig = initConfig;
    window.ArcConfig.initConfig = initConfig;
    this.initApp()
    .then(() => this.upgradeApp())
    .then(() => this.removeLoader())
    .then(() => console.log('Application window is now ready.'));
  }
  /**
   * Initialized the application when window is ready.
   *
   * @return {Promise}
   */
  initApp() {
    // console.info('Initializing renderer window...');
    const opts = {};
    if (this.initConfig.workspacePath) {
      opts.filePath = this.initConfig.workspacePath;
    }
    this.workspaceManager = new WorkspaceManager(this.workspaceIndex, opts);
    this.workspaceManager.observe();
    let appConfig;
    return this.prefProxy.load()
    .then((cnf) => {
      appConfig = cnf;
      return this._createApp(cnf);
    })
    .then(() => {
      return this.themeManager.loadTheme(appConfig.theme)
      // Theme is not a fatal error
      .catch(() => {});
    })
    .catch((cause) => this.reportFatalError(cause));
  }
  /**
   * Reports fatal application error.
   *
   * @param {Error} err Error object
   */
  reportFatalError(err) {
    console.error(err);
    ipc.send('fatal-error', err.message);
  }
  /**
   * Creates application main element.
   *
   * @param {Object} config Current configuration.
   * @return {Promise} Promise resolved when element is loaded and ready
   * rendered.
   */
  _createApp(config) {
    if (this.created) {
      return Promise.resolve();
    }
    return this._importHref('src/arc-electron.html')
    .then(() => {
      const app = document.createElement('arc-electron');
      app.id = 'app';
      app.config = config;
      this._setupApp(app);
      document.body.appendChild(app);
      this.created = true;
    });
  }

  _importHref(href) {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'import';
      link.href = href;
      link.setAttribute('import-href', '');
      link.setAttribute('async', '');
      const callbacks = {
        load: function() {
          callbacks.cleanup();
          resolve();
        },
        error: function() {
          callbacks.cleanup();
          reject();
        },
        cleanup: function() {
          link.removeEventListener('load', callbacks.load);
          link.removeEventListener('error', callbacks.error);
        }
      };
      link.addEventListener('load', callbacks.load);
      link.addEventListener('error', callbacks.error);
      document.head.appendChild(link);
    });
  }
  /**
   * Sets up the application properties.
   *
   * @param {ArcElectron} app App electron element.
   */
  _setupApp(app) {
    // console.info('Initializing ARC app');
    // app.componentsDir = this.initConfig.appComponents;
    app.appVersion = versionInfo.appVersion;
    app.browserVersion = versionInfo.chrome;
    app.initApplication();
  }
  /**
   * Because window has to be setup from the main process
   * (setting app init values) the window sends reload
   * information to the main process so it can re-set the
   * window after it's reloaded.
   */
  beforeUnloadWindow() {
    ipc.send('window-reloading');
  }
  /**
   * Handles events related to the application auto-update action.
   *
   * @param {String} type
   * @param {Object|undefined} args
   */
  updateEventHandler(type, args) {
    const app = this.app;
    if (!app) {
      return;
    }
    // console.log('updateEventHandler', message);
    app.updateState = type;
    if (args) {
      console.log(type, args);
    }
    if (type === 'update-downloaded') {
      app.hasAppUpdate = true;
    }
  }
  /**
   * Handler for application command.
   *
   * @param {EventEmitter} e Node's event
   * @param {String} action
   * @param {Array} args
   */
  commandHandler(e, action, ...args) {
    // console.info('Renderer command handled: ', action);
    const app = this.app;
    switch (action) {
      case 'show-settings': app.openSettings(); break;
      case 'about': app.openAbout(); break;
      case 'open-license': app.openLicense(); break;
      case 'import-data': app.openImport(); break;
      case 'export-data': app.openExport(); break;
      case 'open-saved': app.openSaved(); break;
      case 'open-history': app.openHistory(); break;
      case 'open-drive': app.openDrivePicker(); break;
      case 'open-messages': app.openInfoCenter(); break;
      case 'login-external-webservice': app.openWebUrl(); break;
      case 'open-cookie-manager': app.openCookieManager(); break;
      case 'open-hosts-editor': app.openHostRules(); break;
      case 'get-tabs-count': this.sendTabsCount(e, args[0]); break;
      case 'activate-tab': this.activateTab(e, args[0], args[1]); break;
      case 'get-request-data': this.getRequestData(e, args[0], args[1]); break;
      case 'open-themes': app.openThemesPanel(); break;
      case 'open-requests-workspace': app.openWorkspace(); break;
      case 'open-web-socket': app.openWebSocket(); break;
      case 'popup-menu': this._toggleMenuWindow(); break;
      case 'process-external-file': this.processExternalFile(args[0]); break;
      case 'open-onboarding': app.openOnboarding(); break;
      default:
        console.warn('Unknown command', action, args);
    }
  }

  processExternalFile(filePath) {
    return this.importPreprocessor.processFile(filePath)
    .catch((cause) => {
      this.app.notifyError(cause.message);
      console.error(cause);
    });
  }

  /**
   * Remote API command.
   * Sends number of tabs command to the main process.
   *
   * @param {EventEmitter} e
   * @param {Number} callId
   */
  sendTabsCount(e, callId) {
    const cnt = this.app.getTabsCount();
    e.sender.send('current-tabs-count', callId, false, cnt);
  }
  /**
   * Remote API command.
   * Activates a tab in current window.
   *
   * @param {EventEmitter} e
   * @param {Number} callId
   * @param {Number} tabId ID of a tab
   */
  activateTab(e, callId, tabId) {
    this.app.workspace.selected = tabId;
    e.sender.send('tab-activated', callId, false);
  }
  /**
   * Remote API command.
   * Sends request data to the main process.
   *
   * Because of limitations of sending the data between
   * renderer and main process objects like FormData of
   * file data won't be sent.
   *
   * @param {EventEmitter} e
   * @param {Number} callId
   * @param {Number} tabId ID of a tab
   */
  getRequestData(e, callId, tabId) {
    const request = this.app.workspace.activeRequests[tabId];
    e.sender.send('request-data', callId, false, request);
  }
  /**
   * Handles action performed in main thread (menu action) related to
   * a request.
   *
   * @param {EventEmitter} e
   * @param {String} action Action name to perform.
   */
  execRequestAction(e, action, ...args) {
    // console.info('Renderer request command handled: ', action);
    const app = this.app;
    switch (action) {
      case 'save':
        app.saveOpened({
          source: 'shortcut'
        });
        break;
      case 'save-as':
        app.saveOpened();
        break;
      case 'new-tab':
        app.newRequestTab();
        break;
      case 'send-current':
        app.sendCurrentTab();
        break;
      case 'update-request':
        app.updateRequestTab(args[0], args[1]);
        break;
      case 'close-tab':
        app.closeActiveTab();
        break;
      default:
        throw new Error('Unrecognized action ' + action);
    }
  }
  /**
   * Handler for `theme-editor-preview` event. Current;ly this system is not
   * in use
   *
   * @param {EventEmitter} e
   * @param {Object} stylesMap
   */
  _themePreviewHandler(e, stylesMap) {
    this.themeLoader.previewThemes(stylesMap);
  }
  /**
   * Handler for `app-navigare` event dispatched by the IO process.
   * It dispatches navigate event recognized by ARC to perform navigation
   * action.
   *
   * @param {Object} e
   * @param {Object} detail
   */
  _appNavHandler(e, detail) {
    this.app.dispatchEvent(new CustomEvent('navigate', {
      bubbles: true,
      cancelable: true,
      detail
    }));
  }

  _toggleMenuWindow() {
    const app = this.app;
    if (!app.menuConfig) {
      app.menuConfig = {};
    }
    const state = !app.menuConfig.menuDisabled;
    app.set(`menuConfig.menuDisabled`, state);
  }

  _popupMenuOpened(e, type) {
    this._menuToggleOption(type, true);
  }

  _popupMenuClosed(e, type) {
    this._menuToggleOption(type, false);
  }

  _menuToggleOption(type, value) {
    const app = this.app;
    if (!app.menuConfig) {
      app.menuConfig = {};
    }
    let key;
    switch (type) {
      case 'history-menu': key = 'hideHistory'; break;
      case 'saved-menu': key = 'hideSaved'; break;
      case 'projects-menu': key = 'hideProjects'; break;
      case 'rest-api-menu': key = 'hideApis'; break;
      case '*': key = 'menuDisabled'; break;
      default:
        console.warn('Unknown menu state');
        return;
    }
    app.set(`menuConfig.${key}`, value);
  }

  removeLoader() {
    const loader = document.querySelector('.loader');
    if (!loader) {
      return;
    }
    loader.classList.add('end');
    setTimeout(() => {
      loader.parentNode.removeChild(loader);
    }, 150);
  }

  upgradeApp() {
    return this.prefProxy.load()
    .then((cnf) => {
      const inst = new UpgradeHelper(cnf.upgrades);
      const upgrades = inst.getUpgrades();
      if (!upgrades || upgrades.length === 0) {
        return;
      }
      console.info('Applying upgrades...');
      return inst.upgrade(upgrades);
    });
  }
}

const initScript = new ArcInit();
initScript.listen();
initScript.requestState();
