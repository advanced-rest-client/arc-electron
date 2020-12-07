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
import '../pouchdb.js';

/* global PreferencesProxy, OAuth2Handler, WindowProxy, ArcContextMenu, ThemeManager, logger, EncryptionService, WorkspaceManager */

/** @typedef {import('../../../preload/PreferencesProxy').PreferencesProxy} PreferencesProxy */
/** @typedef {import('../../../preload/ArcContextMenu').ArcContextMenu} ArcContextMenu */
/** @typedef {import('../../../preload/WindowProxy').WindowProxy} WindowProxy */
/** @typedef {import('../../../preload/ThemeManager').ThemeManager} ThemeManager */
/** @typedef {import('../../../preload/EncryptionService').EncryptionService} EncryptionService */
/** @typedef {import('../../../preload/WorkspaceManager').WorkspaceManager} WorkspaceManager */
/** @typedef {import('../../../types').ArcAppInitOptions} ArcAppInitOptions */
/** @typedef {import('lit-html').TemplateResult} TemplateResult */
/** @typedef {import('@advanced-rest-client/electron-oauth2/renderer/OAuth2Handler').OAuth2Handler} OAuth2Handler */
/** @typedef {import('@advanced-rest-client/arc-types').Config.ARCConfig} ARCConfig */

const unhandledRejectionHandler = Symbol('unhandledRejectionHandler');
const headerTemplate = Symbol('headerTemplate');
const pageTemplate = Symbol('pageTemplate');
const workspaceTemplate = Symbol('workspaceTemplate');

export class AdvancedRestClientApplication extends ApplicationPage {
  static get routes() {
    return [{
      name: 'workspace',
      pattern: 'workspace/'
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
    // @ts-ignore
    this.settings = new PreferencesProxy();
    /**
     * @type {OAuth2Handler}
     */
    // @ts-ignore
    this.oauth2Proxy = new OAuth2Handler();
    /**
     * @type {WindowProxy}
     */
    // @ts-ignore
    this.windowProxy = new WindowProxy();
    /**
     * @type {ArcContextMenu}
     */
    // @ts-ignore
    this.contextMenu = new ArcContextMenu(this);
    /**
     * @type {ThemeManager}
     */
    // @ts-ignore
    this.themeProxy = new ThemeManager(this);
    /**
     * @type {EncryptionService}
     */
    // @ts-ignore
    this.encryption = new EncryptionService(this);
    /**
     * @type {WorkspaceManager}
     */
    // @ts-ignore
    this.workspace = new WorkspaceManager();
    /**
     * @type {import('electron-log')}
     */
    // @ts-ignore
    this.logger = logger;

    window.onunhandledrejection = this[unhandledRejectionHandler].bind(this);

    // todo: do the below when the application is already initialized.

    // this[navigationHandler] = this[navigationHandler].bind(this);

    // window.addEventListener(ModelingEventTypes.State.Navigation.change, this[navigationHandler]);
    
    this.oauth2RedirectUri = 'http://auth.advancedrestclient.com/arc.html';
    this.compatibility = false;
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

  }

  /**
   * Closes all tabs in the request workspace
   */
  closeAllWorkspaceTabs() {

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

  }

  appTemplate() {
    const { initializing } = this;
    if (initializing) {
      return this.loaderTemplate();
    }
    return html`
    ${this[headerTemplate]()}
    ${this[pageTemplate](this.route)}
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
    return html`
    <header>
      ARC
      <span class="spacer"></span>
    </header>`;
  }

  /**
   * @param {string} route The current route
   * @returns {TemplateResult} The template for the page content
   */
  [pageTemplate](route) {
    return html`
    <div class="content">
      <main>
        ${this[workspaceTemplate](route === 'workspace')}
      </main>
    </div>
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
    ></arc-request-workspace>
    `;
  }
}
