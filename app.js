const ipc = require('electron').ipcRenderer;
const log = require('electron-log');
const {ArcPreferencesRenderer} = require('./scripts/renderer/arc-preferences');
const {ThemeLoader} = require('./scripts/renderer/theme-loader');
const {ArcContextMenu} = require('./scripts/renderer/context-menu');
/**
 * Class responsible for initializing the main ARC elements
 * and setup base options.
 * Also serves as a communication bridge etween main process and app window.
 */
class ArcInit {
  /**
   * @constructor
   */
  constructor() {
    this.created = false;
    this.workspaceScript = undefined;
    this.settingsScript = undefined;
    this.themeLoader = new ThemeLoader();
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
    this.contextActions = new ArcContextMenu();
    ipc.on('window-state-info', this._stateInfoHandler.bind(this));
    window.onbeforeunload = this.beforeUnloadWindow.bind(this);
    const updateHandler = this.updateEventHandler.bind(this);
    ipc.on('checking-for-update', updateHandler);
    ipc.on('update-available', updateHandler);
    ipc.on('update-not-available', updateHandler);
    ipc.on('autoupdate-error', updateHandler);
    ipc.on('download-progress', updateHandler);
    ipc.on('update-downloaded', updateHandler);
    ipc.on('command', this.commandHandler.bind(this));
    ipc.on('request-action', this.execRequestAction.bind(this));
    ipc.on('theme-editor-preview', this._themePreviewHandler.bind(this));
    this.themeLoader.listen();
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
    if (info.settingsFile) {
      this.settingsScript = info.settingsFile;
    }
    if (info.workspaceFile) {
      this.workspaceScript = info.workspaceFile;
      this.themeLoader.setupSettingsFile(this.workspaceScript);
    }
    this.initApp();
  }
  /**
   * Initialized the application when window is ready.
   *
   * @return {Promise}
   */
  initApp() {
    log.info('Initializing renderer window...');
    return this.initPreferences()
    .then((settings) => this.themeApp(settings))
    .then(() => this._createApp())
    .catch((cause) => this.reportFatalError(cause));
  }
  /**
   * Reports fatal application error.
   *
   * @param {Error} err Error object
   */
  reportFatalError(err) {
    ipc.send('fatal-error', err.message);
  }
  /**
   * Creates application main element.
   *
   * @return {Promise} Promise resolved when element is loaded and ready
   * rendered.
   */
  _createApp() {
    if (this.created) {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      Polymer.Base.importHref('src/arc-electron.html', () => {
        resolve();
      }, () => {
        reject(new Error('Unable to load ARC app'));
      });
    })
    .then(() => {
      log.info('Initializing arc-electron element...');
      const app = document.createElement('arc-electron');
      app.id = 'app';
      this._setupApp(app);
      document.body.appendChild(app);
      this.created = true;
    });
  }
  /**
   * Initializes and reads application settings.
   *
   * @return {Promise} Promise resolved to current settings.
   */
  initPreferences() {
    log.info('Initializing app preferences...');
    this.__prefs = new ArcPreferencesRenderer(this.settingsScript);
    this.__prefs.observe();
    return this.__prefs.loadSettings();
  }
  /**
   * Sets up application theme.
   *
   * @param {String} settings Current application settings.
   * @return {Promise} Promise resolved when the application theme is
   * set and ready.
   */
  themeApp(settings) {
    log.info('Initializing app theme.');
    let id;
    if (settings.theme) {
      id = settings.theme;
    } else {
      id = this.themeLoader.defaultTheme;
    }
    return this.themeLoader.activateTheme(id)
    .catch((cause) => {
      if (id === this.themeLoader.defaultTheme) {
        log.error('Unable to load theme file.', cause);
        return;
      }
      return this.themeLoader.activateTheme(this.themeLoader.defaultTheme);
    })
    .catch((cause) => {
      log.error('Unable to load default theme file.', cause);
    });
  }
  /**
   * Sets up the application properties.
   *
   * @param {ArcElectron} app App electron element.
   */
  _setupApp(app) {
    if (this.workspaceScript) {
      app.workspaceScript = this.workspaceScript;
    }
    if (this.settingsScript) {
      app.settingsScript = this.settingsScript;
    }
    log.info('Initializing ARC app');
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
   * @param {Object} sender
   * @param {Array} message
   */
  updateEventHandler(sender, message) {
    const app = this.app;
    console.log('updateEventHandler', message);
    app.updateState = message;
    if (message[0] === 'update-downloaded') {
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
    log.info('Renderer command handled: ', action);
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
    }
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
    log.info('Renderer request command handled: ', action);
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
}

const initScript = new ArcInit();
initScript.listen();
initScript.requestState();
