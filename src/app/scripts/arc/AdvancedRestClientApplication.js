/* eslint-disable no-unused-vars */
import { ApplicationPage } from '../../ApplicationPage.js';
import { findRoute, navigate } from '../lib/route.js';
import { html } from '../../../../web_modules/lit-html/lit-html.js';
import { MonacoLoader } from '../../../../web_modules/@advanced-rest-client/monaco-support/index.js';
import '../../arc-alert-dialog.js';
import '../../../../web_modules/@polymer/font-roboto-local/roboto.js';
import '../../../../web_modules/@advanced-rest-client/arc-request-ui/arc-request-workspace.js';
import '../../../../web_modules/@advanced-rest-client/arc-models/project-model.js';
import '../../../../web_modules/@advanced-rest-client/arc-models/url-history-model.js';
import '../../../../web_modules/@advanced-rest-client/arc-models/websocket-url-history-model.js';
import '../../../../web_modules/@advanced-rest-client/arc-models/history-data-model.js';
import '../../../../web_modules/@advanced-rest-client/arc-models/client-certificate-model.js';
import '../../../../web_modules/@advanced-rest-client/arc-models/variables-model.js';
import '../../../../web_modules/@advanced-rest-client/arc-models/auth-data-model.js';
import '../../../../web_modules/@advanced-rest-client/arc-models/request-model.js';
import '../../../../web_modules/@advanced-rest-client/arc-models/host-rules-model.js';
import '../../../../web_modules/@advanced-rest-client/arc-models/rest-api-model.js';
import '../../../../web_modules/@advanced-rest-client/arc-models/url-indexer.js';
import '../../../../web_modules/@advanced-rest-client/arc-menu/arc-menu.js';
import '../../../../web_modules/@advanced-rest-client/requests-list/history-panel.js';
import '../../../../web_modules/@advanced-rest-client/requests-list/saved-panel.js';
import '../../../../web_modules/@advanced-rest-client/client-certificates/client-certificates-panel.js';
import '../../../../web_modules/@advanced-rest-client/arc-ie/arc-data-export.js';
import '../../../../web_modules/@advanced-rest-client/arc-environment/variables-overlay.js';
import { ArcNavigationEventTypes, ProjectActions, ConfigEventTypes } from '../../../../web_modules/@advanced-rest-client/arc-events/index.js';
import { ArcModelEvents } from '../../../../web_modules/@advanced-rest-client/arc-models/index.js';
import { Request } from './Request.js';

/* global PreferencesProxy, OAuth2Handler, WindowManagerProxy, ArcContextMenu, ThemeManager, logger, EncryptionService, WorkspaceManager, ipc, CookieBridge, ImportFilePreProcessor, FilesystemProxy, ApplicationSearchProxy */

/** @typedef {import('../../../preload/PreferencesProxy').PreferencesProxy} PreferencesProxy */
/** @typedef {import('../../../preload/ArcContextMenu').ArcContextMenu} ArcContextMenu */
/** @typedef {import('../../../preload/WindowProxy').WindowProxy} WindowManagerProxy */
/** @typedef {import('../../../preload/ThemeManager').ThemeManager} ThemeManager */
/** @typedef {import('../../../preload/EncryptionService').EncryptionService} EncryptionService */
/** @typedef {import('../../../preload/WorkspaceManager').WorkspaceManager} WorkspaceManager */
/** @typedef {import('../../../preload/ImportFilePreProcessor').ImportFilePreProcessor} ImportFilePreProcessor */
/** @typedef {import('../../../preload/FilesystemProxy').FilesystemProxy} FilesystemProxy */
/** @typedef {import('../../../preload/ApplicationSearchProxy').ApplicationSearchProxy} ApplicationSearchProxy */
/** @typedef {import('../../../types').ArcAppInitOptions} ArcAppInitOptions */
/** @typedef {import('lit-html').TemplateResult} TemplateResult */
/** @typedef {import('@advanced-rest-client/electron-oauth2/renderer/OAuth2Handler').OAuth2Handler} OAuth2Handler */
/** @typedef {import('@advanced-rest-client/arc-types').Config.ARCConfig} ARCConfig */
/** @typedef {import('@advanced-rest-client/arc-events').ARCRequestNavigationEvent} ARCRequestNavigationEvent */
/** @typedef {import('@advanced-rest-client/arc-events').ARCProjectNavigationEvent} ARCProjectNavigationEvent */
/** @typedef {import('@advanced-rest-client/arc-events').ARCNavigationEvent} ARCNavigationEvent */
/** @typedef {import('@advanced-rest-client/arc-events').ConfigStateUpdateEvent} ConfigStateUpdateEvent */
/** @typedef {import('../../../../web_modules/@advanced-rest-client/arc-request-ui').ArcRequestWorkspaceElement} ArcRequestWorkspaceElement */

const unhandledRejectionHandler = Symbol('unhandledRejectionHandler');
const headerTemplate = Symbol('headerTemplate');
const pageTemplate = Symbol('pageTemplate');
const workspaceTemplate = Symbol('workspaceTemplate');
const navigationTemplate = Symbol('navigationTemplate');
const navigateRequestHandler = Symbol('navigateRequestHandler');
const navigateHandler = Symbol('navigateHandler');
const navigateProjectHandler = Symbol('navigateProjectHandler');
const mainBackHandler = Symbol('mainBackHandler');
const historyPanelTemplate = Symbol('historyPanelTemplate');
const savedPanelTemplate = Symbol('savedPanelTemplate');
const clientCertScreenTemplate = Symbol('clientCertScreenTemplate');
const commandHandler = Symbol('commandHandler');
const requestActionHandler = Symbol('requestActionHandler');
const configStateChangeHandler = Symbol('configStateChangeHandler');
const systemThemeChangeHandler = Symbol('systemThemeChangeHandler');
const popupMenuOpenedHandler = Symbol('popupMenuOpenedHandler');
const popupMenuClosedHandler = Symbol('popupMenuClosedHandler');
const environmentTemplate = Symbol('environmentTemplate');
const environmentSelectorHandler = Symbol('environmentSelectorHandler');
const environmentSelectorKeyHandler = Symbol('environmentSelectorKeyHandler');

export class AdvancedRestClientApplication extends ApplicationPage {
  static get routes() {
    return [
    {
      name: 'workspace',
      pattern: 'workspace/'
    },
    {
      name: 'rest-projects',
      pattern: 'rest-projects'
    },
    {
      name: 'exchange-search',
      pattern: 'exchange-search'
    },
    {
      name: 'history',
      pattern: 'history'
    },
    {
      name: 'saved',
      pattern: 'saved'
    },
    {
      name: 'client-certificates',
      pattern: 'client-certificates'
    },
    {
      name: 'project',
      pattern: 'project/(?<pid>[^/]*)/(?<action>.*)'
    },
    // {
    //   name: 'model',
    //   pattern: 'project/(?<pid>[^/]*)/module(?<mid>/.*)/model/(?<dmId>.*)'
    // }, {
    //   name: 'module',
    //   pattern: 'project/(?<pid>[^/]*)/module(?<mid>/.*)'
    // }, 
    {
      name: 'workspace',
      pattern: '*'
    }];
  }

  /**
   * @type {ArcRequestWorkspaceElement}
   */
  #workspace = undefined;

  /**
   * @returns {ArcRequestWorkspaceElement}
   */
  get workspaceElement() {
    if (!this.#workspace) {
      this.#workspace = document.querySelector('arc-request-workspace');
    }
    return this.#workspace;
  }

  constructor() {
    super();

    this.initObservableProperties(
      'route', 'initializing', 'loadingStatus',
      'compatibility', 'oauth2RedirectUri',
      'navigationDetached', 'updateState', 'hasAppUpdate',
    );

    /** 
     * @type {boolean} Whether the project is being restored from the metadata store.
     */
    this.initializing = true;

    /**
     * @type {ARCConfig}
     */
    this.config = undefined;

    /** 
     * @type {string} A loading state information.
     */
    this.loadingStatus = 'Initializing application...';

    /**
     * @type {PreferencesProxy}
     */
    this.settings = new PreferencesProxy();
    /**
     * @type {OAuth2Handler}
     */
    this.oauth2Proxy = new OAuth2Handler();
    /**
     * @type {WindowManagerProxy}
     */
    this.windowProxy = new WindowManagerProxy();
    /**
     * @type {ArcContextMenu}
     */
    this.contextMenu = new ArcContextMenu(this);
    /**
     * @type {ThemeManager}
     */
    this.themeProxy = new ThemeManager();
    /**
     * @type {EncryptionService}
     */
    this.encryption = new EncryptionService();
    /**
     * @type {WorkspaceManager}
     */
    this.workspace = new WorkspaceManager();
    this.logger = logger;

    this.cookieBridge = new CookieBridge();
    this.importPreprocessor = new ImportFilePreProcessor();
    this.fs = new FilesystemProxy();
    this.search = new ApplicationSearchProxy();
    this.requestFactory = new Request();

    window.onunhandledrejection = this[unhandledRejectionHandler].bind(this);
    
    // todo: do the below when the application is already initialized.
    
    // this[navigationHandler] = this[navigationHandler].bind(this);
    
    // window.addEventListener(ModelingEventTypes.State.Navigation.change, this[navigationHandler]);
    
    this.oauth2RedirectUri = 'http://auth.advancedrestclient.com/arc.html';
    this.compatibility = false;
    
    /**
     * A list of detached menu panels.
     * @type {string[]}
     */
    this.menuPopup = [];
    /** 
     * When set the navigation element is detached from the main application window.
     */
    this.navigationDetached = false;

    /** 
     * Whether application update is available.
     */
    this.hasAppUpdate = false;
    /** 
     * The current state of checking for update.
     * @type {string}
     */
    this.updateState = undefined;
    
    this[configStateChangeHandler] = this[configStateChangeHandler].bind(this);
  }

  async initialize() {
    this.listen();
    this.windowProxy.initContextMenu();
    const init = this.collectInitOptions();
    this.initOptions = init;
    
    let cnf;
    try {
      cnf = await this.settings.read();
    } catch (e) {
      this.reportCriticalError(e);
      throw e;
    }
    this.config = cnf;
    if (cnf.request && typeof cnf.request.ignoreSessionCookies === 'boolean') {
      this.cookieBridge.ignoreSessionCookies = cnf.request.ignoreSessionCookies;
    }
    await this.loadTheme();
    this.workspace.id = init.workspaceId;
    await this.afterInitialization();
    await this.loadMonaco();
    this.initializing = false;
  }

  listen() {
    this.settings.observe();
    this.oauth2Proxy.listen();
    this.contextMenu.listenMainEvents();
    this.themeProxy.listen();
    this.encryption.listen();
    this.workspace.listen();
    this.cookieBridge.listen();
    this.fs.listen();
    this.search.listen();
    this.requestFactory.listen();

    window.addEventListener(ArcNavigationEventTypes.navigateRequest, this[navigateRequestHandler].bind(this));
    window.addEventListener(ArcNavigationEventTypes.navigate, this[navigateHandler].bind(this));
    window.addEventListener(ArcNavigationEventTypes.navigateProject, this[navigateProjectHandler].bind(this));
    window.addEventListener(ConfigEventTypes.State.update, this[configStateChangeHandler]);

    ipc.on('command', this[commandHandler].bind(this));
    ipc.on('request-action', this[requestActionHandler].bind(this));
    ipc.on('system-theme-changed', this[systemThemeChangeHandler].bind(this));

    ipc.on('popup-app-menu-opened', this[popupMenuOpenedHandler].bind(this));
    ipc.on('popup-app-menu-closed', this[popupMenuClosedHandler].bind(this));

    ipc.on('checking-for-update', () => {
      this.updateState = 'checking-for-update';
    });
    ipc.on('update-available', (info) => {
      this.updateState = 'update-available';
    });
    ipc.on('update-not-available', () => {
      this.updateState = 'update-not-available';
    });
    ipc.on('autoupdate-error', (error) => {
      this.updateState = 'autoupdate-error';
      this.logger.error(error);
    });
    ipc.on('download-progress', (progressObj) => {
      this.updateState = 'download-progress';
      this.logger.info(progressObj);
    });
    ipc.on('update-downloaded', (info) => {
      this.updateState = 'update-downloaded';
      this.hasAppUpdate = true;
    });
  }

  /**
   * @returns {ArcAppInitOptions} The init options of this browser process.
   */
  collectInitOptions() {
    const search = new URLSearchParams(window.location.search);
    const result = /** @type ArcAppInitOptions */ ({});
    const dt = search.get('darkMode');
    if (dt) {
      result.darkMode = dt === 'true';
    }
    const wId = search.get('workspaceId');
    if (wId) {
      result.workspaceId = wId;
    }
    return result;
  }

  /**
   * Loads the current theme.
   */
  async loadTheme() {
    const info = await this.themeProxy.readActiveThemeInfo();
    try {
      const id = info && info.name;
      await this.themeProxy.loadTheme(id);
    } catch (e) {
      this.logger.error(e);
    }
  }

  /**
   * Tasks to be performed after the application is initialized.
   */
  async afterInitialization() {
    window.onpopstate = () => {
      this.onRoute();
    }
    requestAnimationFrame(() => this.onRoute());
  }

  /**
   * @param {PromiseRejectionEvent} e
   */
  [unhandledRejectionHandler](e) {
    /* eslint-disable-next-line no-console */
    console.error(e);
    this.reportCriticalError(e.reason);
  }

  async loadMonaco() {
    const base = `../../../../node_modules/monaco-editor/`;
    MonacoLoader.createEnvironment(base);
    await MonacoLoader.loadMonaco(base);
    await MonacoLoader.monacoReady();
  }

  /**
   * Called when route change
   */
  onRoute() {
    const url = new URL(window.location.href);
    const path = url.hash.replace('#', '');
    // @ts-ignore
    const { routes } = this.constructor;
    const result = findRoute(routes, path);
    if (!result) {
      return;
    }
    const { name } = result.route;
    this.route = name;
  }

  /**
   * Closes a tab in the request workspace at the specified position
   * @param {number} index 
   */
  closeWorkspaceTab(index) {
    this.workspaceElement.removeRequest(index);
  }

  /**
   * Closes all tabs in the request workspace
   */
  closeAllWorkspaceTabs() {
    this.workspaceElement.clear();
  }

  /**
   * Closes all tabs in the request workspace except for the given index.
   * @param {number} index 
   */
  closeOtherWorkspaceTabs(index) {
    
  }

  /**
   * Duplicates a tab at the given index.
   * @param {number} index 
   */
  duplicateWorkspaceTab(index) {
    this.workspaceElement.duplicateTab(index);
  }

  /**
   * @param {ARCRequestNavigationEvent} e 
   */
  [navigateRequestHandler](e) {
    const { requestId, requestType, action } = e;
    if (action !== 'open') {
      return;
    }
    this.workspaceElement.addByRequestId(requestType, requestId);
    if (this.route !== 'workspace') {
      navigate('workspace');
    }
  }

  /**
   * @param {ARCProjectNavigationEvent} e
   */
  [navigateProjectHandler](e) {
    const { id, action, route } = e;
    if (route !== 'project') {
      return;
    }
    if (action === ProjectActions.addWorkspace) {
      this.workspaceElement.appendByProjectId(id);
    } else if (action === ProjectActions.replaceWorkspace) {
      this.workspaceElement.replaceByProjectId(id);
    } else if (action === 'open') {
      navigate(route, id, action);
    } else {
      // eslint-disable-next-line no-console
      console.warn('Unhandled project event', id, action, route);
    }
  }

  /**
   * @param {ARCNavigationEvent} e
   */
  [navigateHandler](e) {
    const allowed = [
      'rest-projects',
      'exchange-search',
      'history',
      'saved',
    ];
    if (e.route === 'client-certificate-import') {
      this.importingCertificate = true;
    } else if (allowed.includes(e.route)) {
      navigate(e.route);
    } else {
      // eslint-disable-next-line no-console
      console.warn('Unhandled navigate event', e);
    }
  }

  /**
   * A handler for the main toolbar arrow back click.
   * Always navigates to the workspace.
   */
  [mainBackHandler]() {
    navigate('workspace');
  }

  /**
   * Handler for application command.
   *
   * @param {EventEmitter} e Node's event
   * @param {string} action
   * @param {...any} args
   */
  [commandHandler](e, action, ...args) {
    switch (action) {
      case 'open-saved': navigate('saved'); break;
      case 'open-history': navigate('history'); break;
      case 'open-drive': navigate('google-drive'); break;
      case 'open-cookie-manager': navigate('cookie-manager'); break;
      case 'open-hosts-editor': navigate('hosts-editor'); break;
      case 'open-themes': navigate('themes'); break;
      case 'open-client-certificates': navigate('client-certificates'); break;
      case 'open-requests-workspace': navigate('workspace'); break;
      case 'open-web-socket': navigate('web-socket'); break;
      case 'process-external-file': this.processExternalFile(args[0]); break;
      case 'import-data': navigate('data-import'); break;
      case 'export-data': navigate('data-export'); break;
      case 'show-settings': navigate('settings'); break;
      case 'popup-menu': this.navigationDetached = !this.navigationDetached; break;
      case 'export-workspace': this.exportWorkspace(); break;
      default:
        this.logger.warn(`Unhandled IO command ${action}`);
    }
  }

  /**
   * Handles action performed in main thread (menu action) related to a request.
   *
   * @param {EventEmitter} e
   * @param {string} action Action name to perform.
   * @param {...any} args
   */
  [requestActionHandler](e, action, ...args) {
    if (this.route !== 'workspace') {
      navigate('workspace');
    }
    switch (action) {
      case 'save':
        this.workspaceElement.saveOpened();
        break;
      case 'new-tab':
        this.workspaceElement.addEmpty();
        break;
      case 'send-current':
        this.workspaceElement.sendCurrent();
        break;
      case 'close-tab':
        this.workspaceElement.closeActiveTab();
        break;
      default:
        this.logger.warn(`Unhandled IO request command ${action}`);
    }
  }

  /**
   * @param {ConfigStateUpdateEvent} e
   */
  [configStateChangeHandler](e) {
    const { key, value } = e.detail;
    if (key === 'ignoreSessionCookies') {
      this.cookieBridge.ignoreSessionCookies = value;
    }
  }

  /**
   * Handler for system theme change event dispatched by the IO thread.
   * Updates theme depending on current setting.
   *
   * @param {any} e
   * @param {Boolean} isDarkMode true when Electron detected dark mode
   * @returns {Promise<void>}
   */
  async [systemThemeChangeHandler](e, isDarkMode) {
    const theme = isDarkMode ?
      '@advanced-rest-client/arc-electron-dark-theme' :
      '@advanced-rest-client/arc-electron-default-theme';
    this.compatibility = false;
    try {
      await this.themeProxy.loadTheme(theme);
    } catch (err) {
      this.logger.error(err);
    }
  }

  /**
   * @param {string} filePath
   */
  async processExternalFile(filePath) {
    try {
      await this.importPreprocessor.processFile(filePath);
    } catch (cause) {
      this.logger.error(cause);
      this.reportCriticalError(cause);
    }
  }

  [popupMenuOpenedHandler](e, type) {
    this.menuToggleOption(type, true);
  }

  [popupMenuClosedHandler](e, type) {
    this.menuToggleOption(type, false);
  }

  /**
   * @param {string} type The menu name
   * @param {boolean} value Whether the menu is rendered in an external window.
   */
  menuToggleOption(type, value) {
    if (type === '*') {
      this.navigationDetached = value;
      return;
    }
    const { menuPopup } = this;
    if (value && !menuPopup.includes(type)) {
      menuPopup.push(type);
      this.render();
    } else if (!value && menuPopup.includes(type)) {
      const index = menuPopup.indexOf(type);
      menuPopup.splice(index, 1);
      this.render();
    }
  }

  /**
   * Calls ARC app to serialize workspace data and exports it to a file.
   * @return {Promise}
   */
  async exportWorkspace() {
    // @TODO: add workspace serialize function.
    // const workspace = this.workspaceElement.serializeWorkspace();
    // return this.fs.exportFileData(workspace, 'application/json', 'arc-workspace.arc');
  }

  /**
   * @param {Event} e
   */
  [environmentSelectorHandler](e) {
    const overlay = document.querySelector('variables-overlay');
    overlay.positionTarget = /** @type HTMLElement */ (e.target);
    overlay.opened = true;
  }

  /**
   * @param {KeyboardEvent} e
   */
  [environmentSelectorKeyHandler](e) {
    if (['Space', 'Enter', 'ArrowDown'].includes(e.code)) {
      this[environmentSelectorHandler](e);
    }
  }

  appTemplate() {
    const { initializing } = this;
    if (initializing) {
      return this.loaderTemplate();
    }
    // @ts-ignore
    const { appVersion } = window.versionInfo;
    return html`
    <arc-data-export appVersion="${appVersion}"></arc-data-export>
    <div class="content">
      ${this[navigationTemplate]()}
      ${this[pageTemplate](this.route)}
    </div>
    `;
  }

  /**
   * @returns {TemplateResult} A template for the loader
   */
  loaderTemplate() {
    return html`
    <div class="app-loader">
      <p class="message">Preparing something spectacular</p>
      <p class="sub-message">${this.loadingStatus}</p>
    </div>
    `;
  }

  /**
   * @returns {TemplateResult} The template for the header
   */
  [headerTemplate]() {
    const { route, compatibility } = this;
    const isWorkspace = route === 'workspace';
    return html`
    <header>
      ${isWorkspace ? '' : 
      html`
      <anypoint-icon-button ?compatibility="${compatibility}" title="Back to the request workspace" @click="${this[mainBackHandler]}">
        <arc-icon icon="arrowBack"></arc-icon>
      </anypoint-icon-button>`}
      API Client
      <span class="spacer"></span>
      ${this[environmentTemplate]()}
    </header>`;
  }

  /**
   * @returns {TemplateResult} The template for the environment selector and the overlay.
   */
  [environmentTemplate]() {
    const { compatibility } = this;
    let { currentEnvironment } = this;
    if (!currentEnvironment) {
      // this can be `null` so default values won't work
      currentEnvironment = 'Default';
    }
    const { env } = process;
    return html`
    <div 
      class="environment-selector" 
      title="The current environment" 
      aria-label="Activate to select an environment"
      tabindex="0"
      @click="${this[environmentSelectorHandler]}"
      @keydown="${this[environmentSelectorKeyHandler]}"
    >
      Environment: ${currentEnvironment}
      <arc-icon icon="chevronRight" class="env-dropdown"></arc-icon>
    </div>

    <variables-overlay 
      id="overlay" 
      verticalAlign="top" 
      withBackdrop 
      horizontalAlign="right"
      noCancelOnOutsideClick
      ?compatibility="${compatibility}"
      systemVariablesEnabled
      .systemVariables="${env}"
    ></variables-overlay>
    `;
  }

  /**
   * @returns {TemplateResult|string} The template for the application main navigation
   */
  [navigationTemplate]() {
    if (this.navigationDetached) {
      return '';
    }
    const { compatibility, config, menuPopup } = this;
    const { view, history } = config;
    const historyEnabled = !history || typeof history.enabled !== 'boolean' || history.enabled;
    const hideHistory = menuPopup.includes('history-menu');
    const hideSaved = menuPopup.includes('saved-menu');
    const hideProjects = menuPopup.includes('projects-menu');
    const hideApis = menuPopup.includes('rest-api-menu');
    return html`
    <nav>
      <arc-menu
        ?compatibility="${compatibility}"
        .listType="${view && view.listType}"
        ?history="${historyEnabled}"
        ?hideHistory="${hideHistory}"
        ?hideSaved="${hideSaved}"
        ?hideProjects="${hideProjects}"
        ?hideApis="${hideApis}"
        popup
        dataTransfer
      ></arc-menu>
    </nav>
    `;
  }

  /**
   * @param {string} route The current route
   * @returns {TemplateResult} The template for the page content
   */
  [pageTemplate](route) {
    // eslint-disable-next-line no-console
    console.log(route);
    return html`
    <main>
      ${this[headerTemplate]()}
      ${this[workspaceTemplate](route === 'workspace')}
      ${this[historyPanelTemplate](route)}
      ${this[savedPanelTemplate](route)}
      ${this[clientCertScreenTemplate](route)}
    </main>
    `;
  }

  /**
   * @param {boolean} visible Whether the workspace is rendered in the view
   * @returns
   */
  [workspaceTemplate](visible) {
    const { oauth2RedirectUri, compatibility, initOptions } = this;
    return html`
    <arc-request-workspace
      ?hidden="${!visible}"
      ?compatibility="${compatibility}"
      .oauth2RedirectUri="${oauth2RedirectUri}"
      backendId="${initOptions.workspaceId}"
      autoRead
      class="screen"
    ></arc-request-workspace>
    `;
  }

  /**
   * @param {string} route The current route
   * @returns {TemplateResult|string} The template for the history screen
   */
  [historyPanelTemplate](route) {
    if (route !== 'history') {
      return '';
    }
    const { compatibility, config } = this;
    const { view, history } = config;
    const historyEnabled = !history || typeof history.enabled !== 'boolean' || history.enabled;
    if (!historyEnabled) {
      return '';
    }
    return html`
    <history-panel 
      listActions
      selectable
      ?compatibility="${compatibility}"
      .listType="${view && view.listType}"
      draggableEnabled
      class="screen"
    ></history-panel>
    `;
  }

  /**
   * @param {string} route The current route
   * @returns {TemplateResult|string} The template for the history screen
   */
  [savedPanelTemplate](route) {
    if (route !== 'saved') {
      return '';
    }
    const { compatibility, config } = this;
    const { view } = config;
    return html`
    <saved-panel 
      listActions
      selectable
      ?compatibility="${compatibility}"
      .listType="${view && view.listType}"
      draggableEnabled
      class="screen"
    ></saved-panel>
    `;
  }

  /**
   * @param {string} route The current route
   * @returns {TemplateResult|string} The template for client certificates screen
   */
  [clientCertScreenTemplate](route) {
    if (route !== 'client-certificates') {
      return '';
    }
    const { compatibility } = this;
    return html`
    <client-certificates-panel
      ?compatibility="${compatibility}"
      class="screen"
    ></client-certificates-panel>`;
  }
}
