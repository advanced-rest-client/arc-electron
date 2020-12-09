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
import { ArcNavigationEventTypes, ProjectActions } from '../../../../web_modules/@advanced-rest-client/arc-events/index.js';

/* global PreferencesProxy, OAuth2Handler, WindowManagerProxy, ArcContextMenu, ThemeManager, logger, EncryptionService, WorkspaceManager, ipc */

/** @typedef {import('../../../preload/PreferencesProxy').PreferencesProxy} PreferencesProxy */
/** @typedef {import('../../../preload/ArcContextMenu').ArcContextMenu} ArcContextMenu */
/** @typedef {import('../../../preload/WindowProxy').WindowProxy} WindowManagerProxy */
/** @typedef {import('../../../preload/ThemeManager').ThemeManager} ThemeManager */
/** @typedef {import('../../../preload/EncryptionService').EncryptionService} EncryptionService */
/** @typedef {import('../../../preload/WorkspaceManager').WorkspaceManager} WorkspaceManager */
/** @typedef {import('../../../types').ArcAppInitOptions} ArcAppInitOptions */
/** @typedef {import('lit-html').TemplateResult} TemplateResult */
/** @typedef {import('@advanced-rest-client/electron-oauth2/renderer/OAuth2Handler').OAuth2Handler} OAuth2Handler */
/** @typedef {import('@advanced-rest-client/arc-types').Config.ARCConfig} ARCConfig */
/** @typedef {import('@advanced-rest-client/arc-events').ARCRequestNavigationEvent} ARCRequestNavigationEvent */
/** @typedef {import('@advanced-rest-client/arc-events').ARCProjectNavigationEvent} ARCProjectNavigationEvent */
/** @typedef {import('@advanced-rest-client/arc-events').ARCNavigationEvent} ARCNavigationEvent */
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

    window.addEventListener(ArcNavigationEventTypes.navigateRequest, this[navigateRequestHandler].bind(this));
    window.addEventListener(ArcNavigationEventTypes.navigate, this[navigateHandler].bind(this));
    window.addEventListener(ArcNavigationEventTypes.navigateProject, this[navigateProjectHandler].bind(this));

    ipc.on('command', this[commandHandler].bind(this));
    ipc.on('request-action', this[requestActionHandler].bind(this));
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

  appTemplate() {
    const { initializing } = this;
    if (initializing) {
      return this.loaderTemplate();
    }
    return html`
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
      ARC
      <span class="spacer"></span>
    </header>`;
  }

  /**
   * @returns {TemplateResult} The template for the application main navigation
   */
  [navigationTemplate]() {
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
