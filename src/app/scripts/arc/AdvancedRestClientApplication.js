/* eslint-disable no-unused-vars */
import { ApplicationPage } from '../../ApplicationPage.js';
import { findRoute, navigate } from '../lib/route.js';
import { html } from '../../../../web_modules/lit-html/lit-html.js';
import { MonacoLoader } from '../../../../web_modules/@advanced-rest-client/monaco-support/index.js';
import { ArcNavigationEventTypes, ProjectActions, ConfigEventTypes, DataImportEventTypes, WorkspaceEvents, ImportEvents, WorkspaceEventTypes } from '../../../../web_modules/@advanced-rest-client/arc-events/index.js';
import { ArcModelEvents, ArcModelEventTypes, ImportFactory, ImportNormalize, isSingleRequest } from '../../../../web_modules/@advanced-rest-client/arc-models/index.js';
import { ModulesRegistry } from '../../../../web_modules/@advanced-rest-client/request-engine/index.js';
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
import '../../../../web_modules/@advanced-rest-client/arc-ie/arc-export-form.js';
import '../../../../web_modules/@advanced-rest-client/arc-ie/arc-data-import.js';
import '../../../../web_modules/@advanced-rest-client/arc-ie/import-data-inspector.js';
import '../../../../web_modules/@advanced-rest-client/arc-environment/variables-overlay.js';
import '../../../../web_modules/@advanced-rest-client/arc-cookies/cookie-manager.js';
import '../../../../web_modules/@advanced-rest-client/arc-settings/arc-settings.js';
import '../../../../web_modules/@anypoint-web-components/anypoint-input/anypoint-masked-input.js';
import { Request } from './Request.js';
import { processRequestCookies, processResponseCookies } from './RequestCookies.js';

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
/** @typedef {import('@advanced-rest-client/arc-events').ArcImportInspectEvent} ArcImportInspectEvent */
/** @typedef {import('@advanced-rest-client/arc-events').WorkspaceAppendRequestEvent} WorkspaceAppendRequestEvent */
/** @typedef {import('@advanced-rest-client/arc-events').WorkspaceAppendExportEvent} WorkspaceAppendExportEvent */
/** @typedef {import('@advanced-rest-client/arc-models').IndexableRequest} IndexableRequest */
/** @typedef {import('@advanced-rest-client/arc-models').ARCEnvironmentStateSelectEvent} ARCEnvironmentStateSelectEvent */
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
const dataImportScreenTemplate = Symbol('dataImportScreenTemplate');
const dataExportScreenTemplate = Symbol('dataExportScreenTemplate');
const cookieManagerScreenTemplate = Symbol('cookieManagerScreenTemplate');
const settingsScreenTemplate = Symbol('settingsScreenTemplate');
const fileImportHandler = Symbol('fileImportHandler');
const importInspectorTemplate = Symbol('importInspectorTemplate');
const dataInspectHandler = Symbol('dataInspectHandler');
const inspectDataValue = Symbol('inspectDataValue');
const importDataHandler = Symbol('importDataHandler');
const notifyIndexer = Symbol('notifyIndexer');
const workspaceAppendRequestHandler = Symbol('workspaceAppendRequestHandler');
const workspaceAppendExportHandler = Symbol('workspaceAppendExportHandler');
const environmentSelectedHandler = Symbol('environmentSelectedHandler');

/**
 * A routes that does not go through the router and should not be remembered in the history.
 */
const HiddenRoutes = ['data-inspect'];

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
      name: 'data-import',
      pattern: 'data-import'
    },
    {
      name: 'data-export',
      pattern: 'data-export'
    },
    {
      name: 'cookie-manager',
      pattern: 'cookie-manager'
    },
    {
      name: 'settings',
      pattern: 'settings'
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
      'popupMenuEnabled', 'draggableEnabled', 'historyEnabled',
      'listType', 'detailedSearch', 'currentEnvironment',
      'systemVariablesEnabled', 'variablesEnabled',
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
    
    /** 
     * Whether the application menu can be detached to a new window.
     */
    this.popupMenuEnabled = true;
    /** 
     * Whether the application support request object drag and drop
     */
    this.draggableEnabled = true;

    /** 
     * Whether the requests history is enabled.
     */
    this.historyEnabled = true;

    /** 
     * The current setting for the list types view.
     */
    this.listType = 'default';

    /** 
     * Whether the history / saved search should perform slower but more detailed search
     */
    this.detailedSearch = false;

    /** 
     * The name of the currently selected environment. Null for the default.
     */
    this.currentEnvironment = null;

    /** 
     * Whether the application should process system variables.
     */
    this.systemVariablesEnabled = true;
    /** 
     * Enables variables processor.
     */
    this.variablesEnabled = true;
  }

  async initialize() {
    this.listen();
    this.windowProxy.initContextMenu();
    const init = this.collectInitOptions();
    this.initOptions = init;
    
    let cnf = {};
    try {
      cnf = await this.settings.read();
    } catch (e) {
      this.reportCriticalError(e);
      throw e;
    }
    this.config = cnf;
    this.setConfigVariables(cnf);
    
    await this.loadTheme();
    this.workspace.id = init.workspaceId;
    await this.afterInitialization();
    await this.loadMonaco();
    this.initializing = false;
  }

  /**
   * Sets local variables from the config object
   * @param {ARCConfig} cnf
   */
  setConfigVariables(cnf) {
    if (cnf.view && typeof cnf.view.popupMenu === 'boolean') {
      this.popupMenuEnabled = cnf.view.popupMenu;
    }
    if (cnf.view && typeof cnf.view.draggableEnabled === 'boolean') {
      this.draggableEnabled = cnf.view.draggableEnabled;
    }
    if (!!cnf.request || (cnf.request && typeof cnf.request.ignoreSessionCookies === 'boolean' && cnf.request.ignoreSessionCookies)) {
      ModulesRegistry.register(ModulesRegistry.request, 'arc/request/cookies', processRequestCookies, ['events']);
      ModulesRegistry.register(ModulesRegistry.response, 'arc/response/cookies', processResponseCookies, ['events']);
    }
    if (cnf.request && cnf.request.oauth2redirectUri) {
      this.oauth2RedirectUri = cnf.request.oauth2redirectUri;
    }
    if (cnf.history && typeof cnf.history.enabled === 'boolean') {
      this.historyEnabled = cnf.history.enabled;
    }
    if (cnf.view && typeof cnf.view.listType === 'string') {
      this.listType = cnf.view.listType;
    }
    if (cnf.request && typeof cnf.request.timeout === 'number') {
      this.requestFactory.requestTimeout = cnf.request.timeout;
    }
    if (cnf.request && typeof cnf.request.followRedirects === 'boolean') {
      this.requestFactory.followRedirects = cnf.request.followRedirects;
    }
    if (cnf.request && typeof cnf.request.defaultHeaders === 'boolean') {
      this.requestFactory.defaultHeaders = cnf.request.defaultHeaders;
    }
    if (cnf.request && typeof cnf.request.validateCertificates === 'boolean') {
      this.requestFactory.validateCertificates = cnf.request.validateCertificates;
    }
    if (cnf.request && typeof cnf.request.nativeTransport === 'boolean') {
      this.requestFactory.nativeTransport = cnf.request.nativeTransport;
    }
    if (cnf.request && typeof cnf.request.useSystemVariables === 'boolean') {
      this.systemVariablesEnabled = cnf.request.useSystemVariables;
    }
    if (cnf.request && typeof cnf.request.useAppVariables === 'boolean') {
      this.variablesEnabled = cnf.request.useAppVariables;
    }
    if (cnf.history && typeof cnf.history.fastSearch === 'boolean') {
      this.detailedSearch = !cnf.history.fastSearch;
    }
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
    window.addEventListener(WorkspaceEventTypes.appendRequest, this[workspaceAppendRequestHandler].bind(this));
    window.addEventListener(WorkspaceEventTypes.appendExport, this[workspaceAppendExportHandler].bind(this));
    window.addEventListener(ConfigEventTypes.State.update, this[configStateChangeHandler].bind(this));
    window.addEventListener(DataImportEventTypes.inspect, this[dataInspectHandler].bind(this));
    window.addEventListener(ArcModelEventTypes.Environment.State.select, this[environmentSelectedHandler].bind(this));

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
    if (key === 'request.ignoreSessionCookies') {
      if (value) {
        ModulesRegistry.register(ModulesRegistry.request, 'arc/request/cookies', processRequestCookies, ['events']);
        ModulesRegistry.register(ModulesRegistry.response, 'arc/response/cookies', processResponseCookies, ['events']);
      } else {
        ModulesRegistry.unregister(ModulesRegistry.request, 'arc/request/cookies');
        ModulesRegistry.unregister(ModulesRegistry.response, 'arc/response/cookies');
      }
    } else if (key === 'view.popupMenu') {
      this.popupMenuEnabled = value;
    } else if (key === 'view.draggableEnabled') {
      this.draggableEnabled = value;
    } else if (key === 'request.timeout') {
      this.requestFactory.requestTimeout = value;
    } else if (key === 'request.followRedirects') {
      this.requestFactory.followRedirects = value;
    } else if (key === 'request.defaultHeaders') {
      this.requestFactory.defaultHeaders = value;
    } else if (key === 'request.validateCertificates') {
      this.requestFactory.validateCertificates = value;
    } else if (key === 'request.nativeTransport') {
      this.requestFactory.nativeTransport = value;
    } else if (key === 'request.oauth2redirectUri') {
      this.oauth2RedirectUri = value;
    } else if (key === 'view.listType') {
      this.listType = value;
    } else if (key === 'history.enabled') {
      this.historyEnabled = value;
    } else if (key === 'history.fastSearch') {
      this.detailedSearch = !value;
    } else if (key === 'request.useSystemVariables') {
      this.systemVariablesEnabled = value;
    } else if (key === 'request.useAppVariables') {
      this.variablesEnabled = value;
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
    const factory = new ImportFilePreProcessor(filePath);
    try {
      await factory.prepare();
      const isApiFile = await factory.isApiFile();
      if (isApiFile) {
        throw new Error(`Implement API processing`);
      }
      const contents = factory.readContents();
      const decrypted = await this.decryptIfNeeded(contents);
      const data = JSON.parse(decrypted);
      if (data.swagger) {
        throw new Error(`Implement API processing`);
      }
      const processor = new ImportNormalize();
      const normalized = await processor.normalize(data);

      if (isSingleRequest(data)) {
        WorkspaceEvents.appendRequest(document.body, data);
        return;
      }
      if (data.loadToWorkspace) {
        WorkspaceEvents.appendExport(document.body, data);
        return;
      }
      this.route = 'data-inspect';
      this[inspectDataValue] = data;
      this.render();
    } catch (cause) {
      this.logger.error(cause);
      this.reportCriticalError(cause);
    }
  }

  /**
   * Processes incoming data and if encryption is detected then id processes
   * the file for decryption.
   *
   * @param {string} content File content
   * @return {Promise<string>} The content of the file.
   */
  async decryptIfNeeded(content) {
    const headerIndex = content.indexOf('\n');
    const header = content.substr(0, headerIndex).trim();
    if (header === 'aes') {
      const data = content.substr(headerIndex + 1);
      // eslint-disable-next-line no-param-reassign
      content = await this.encryption.decode('aes', data);
    }
    return content;
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

  async [fileImportHandler]() {
    const result = await this.fs.pickFile();
    if (result.canceled) {
      return;
    }
    const [file] = result.filePaths;
    this.processExternalFile(file);
  }

  /**
   * @param {ArcImportInspectEvent} e
   */
  [dataInspectHandler](e) {
    const { data } = e.detail;
    this.route = 'data-inspect';
    this[inspectDataValue] = data;
    this.render();
  }

  /**
   * @param {CustomEvent} e
   */
  async [importDataHandler](e) {
    const { detail } = e;
    const store = new ImportFactory();
    const result = await store.importData(detail);
    
    const { savedIndexes, historyIndexes } = store;
    this[notifyIndexer](savedIndexes, historyIndexes);
    ImportEvents.dataImported(this);
    this[mainBackHandler]();
  }

  /**
   * Dispatches `url-index-update` event handled by `arc-models/url-indexer`.
   * It will index URL data for search function.
   * @param {IndexableRequest[]} saved List of saved requests indexes
   * @param {IndexableRequest[]} history List of history requests indexes
   */
  [notifyIndexer](saved, history) {
    let indexes = [];
    if (saved) {
      indexes = indexes.concat(saved);
    }
    if (history) {
      indexes = indexes.concat(history);
    }
    if (!indexes.length) {
      return;
    }
    ArcModelEvents.UrlIndexer.update(this, indexes);
  }

  /**
   * @param {WorkspaceAppendRequestEvent} e
   */
  [workspaceAppendRequestHandler](e) {
    const { request } = e.detail;
    this.workspaceElement.add(request);
    navigate('workspace');
  }

  /**
   * @param {WorkspaceAppendExportEvent} e
   */
  [workspaceAppendExportHandler](e) {
    const { requests, history } = e.detail.data;
    const { workspaceElement } = this;
    (requests || []).forEach((request) => workspaceElement.add(request));
    (history || []).forEach((request) => workspaceElement.add(request));
    navigate('workspace');
  }

  /**
   * @param {ARCEnvironmentStateSelectEvent} e
   */
  [environmentSelectedHandler](e) {
    const { environment } = e.detail;
    if (environment) {
      this.currentEnvironment = environment.name;
    } else {
      this.currentEnvironment = null;
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
    <arc-data-import></arc-data-import>
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
    const { compatibility, variablesEnabled } = this;
    if (!variablesEnabled) {
      return '';
    }
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
      ?systemVariablesEnabled="${this.systemVariablesEnabled}"
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
    const hideHistory = menuPopup.includes('history-menu');
    const hideSaved = menuPopup.includes('saved-menu');
    const hideProjects = menuPopup.includes('projects-menu');
    const hideApis = menuPopup.includes('rest-api-menu');
    return html`
    <nav>
      <arc-menu
        ?compatibility="${compatibility}"
        .listType="${this.listType}"
        ?history="${this.historyEnabled}"
        ?hideHistory="${hideHistory}"
        ?hideSaved="${hideSaved}"
        ?hideProjects="${hideProjects}"
        ?hideApis="${hideApis}"
        ?popup="${this.popupMenuEnabled}"
        ?dataTransfer="${this.draggableEnabled}"
      ></arc-menu>
    </nav>
    `;
  }

  /**
   * @param {string} route The current route
   * @returns {TemplateResult} The template for the page content
   */
  [pageTemplate](route) {
    return html`
    <main>
      ${this[headerTemplate]()}
      ${this[workspaceTemplate](route === 'workspace')}
      ${this[historyPanelTemplate](route)}
      ${this[savedPanelTemplate](route)}
      ${this[clientCertScreenTemplate](route)}
      ${this[dataImportScreenTemplate](route)}
      ${this[dataExportScreenTemplate](route)}
      ${this[cookieManagerScreenTemplate](route)}
      ${this[settingsScreenTemplate](route)}
      ${this[importInspectorTemplate](route)}
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
    const { compatibility } = this;
    if (!this.historyEnabled) {
      return '';
    }
    return html`
    <history-panel 
      listActions
      selectable
      ?detailedSearch="${this.detailedSearch}"
      ?compatibility="${compatibility}"
      .listType="${this.listType}"
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
    const { compatibility } = this;
    return html`
    <saved-panel 
      listActions
      selectable
      ?detailedSearch="${this.detailedSearch}"
      ?compatibility="${compatibility}"
      .listType="${this.listType}"
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

  /**
   * @param {string} route The current route
   * @returns {TemplateResult|string} The template for the data import screen
   */
  [dataImportScreenTemplate](route) {
    if (route !== 'data-import') {
      return '';
    }
    const { compatibility } = this;
    return html`
    <div class="screen">
      <h2>Data import</h2>
      <p>You can import ARC data from any previous version, Postman export and backup, and API specification (RAML or OAS)</p>
      <anypoint-button @click="${this[fileImportHandler]}">Select file</anypoint-button>
    </div>
    `;
  }

  [importInspectorTemplate](route) {
    if (route !== 'data-inspect') {
      return '';
    }
    const data = this[inspectDataValue];
    return html`
    <import-data-inspector
      .data="${data}"
      class="screen"
      @cancel="${this[mainBackHandler]}"
      @import="${this[importDataHandler]}"
    ></import-data-inspector>
    `;
  }

  /**
   * @param {string} route The current route
   * @returns {TemplateResult|string} The template for the data export screen
   */
  [dataExportScreenTemplate](route) {
    if (route !== 'data-export') {
      return '';
    }
    const { compatibility } = this;
    return html`
    <arc-export-form
      withEncrypt
      ?compatibility="${compatibility}"
      class="screen"
    ></arc-export-form>
    `;
  }

  /**
   * @param {string} route The current route
   * @returns {TemplateResult|string} The template for the cookie manager
   */
  [cookieManagerScreenTemplate](route) {
    if (route !== 'cookie-manager') {
      return '';
    }
    const { compatibility } = this;
    return html`
    <cookie-manager
      ?compatibility="${compatibility}"
      class="screen"
    ></cookie-manager>
    `;
  }

  /**
   * @param {string} route The current route
   * @returns {TemplateResult|string} The template for the application settings
   */
  [settingsScreenTemplate](route) {
    if (route !== 'settings') {
      return '';
    }
    const { compatibility } = this;
    return html`
    <arc-settings
      ?compatibility="${compatibility}"
      class="screen scroll"
    ></arc-settings>
    `;
  }
}
