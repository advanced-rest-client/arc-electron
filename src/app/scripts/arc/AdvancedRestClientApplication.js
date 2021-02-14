/* eslint-disable no-unused-vars */
import { ApplicationPage } from '../../ApplicationPage.js';
import { findRoute, navigate, navigatePage } from '../lib/route.js';
import { html } from '../../../../web_modules/lit-html/lit-html.js';
import { MonacoLoader } from '../../../../web_modules/@advanced-rest-client/monaco-support/index.js';
import { ArcNavigationEventTypes, ProjectActions, ConfigEventTypes, DataImportEventTypes, WorkspaceEvents, ImportEvents, WorkspaceEventTypes, ArcNavigationEvents, RestApiEventTypes } from '../../../../web_modules/@advanced-rest-client/arc-events/index.js';
import { ArcModelEvents, ArcModelEventTypes, ImportFactory, ImportNormalize, isSingleRequest } from '../../../../web_modules/@advanced-rest-client/arc-models/index.js';
import { ArcMessagingService } from '../../../../web_modules/@advanced-rest-client/arc-messages/index.js';
import { ModulesRegistry, RequestCookies } from '../../../../web_modules/@advanced-rest-client/request-engine/index.js';
import { classMap } from '../../../../web_modules/lit-html/directives/class-map.js';
import { styleMap } from '../../../../web_modules/lit-html/directives/style-map.js';
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
import '../../../../web_modules/@advanced-rest-client/arc-request-ui/request-meta-details.js';
import '../../../../web_modules/@advanced-rest-client/arc-request-ui/request-meta-editor.js';
import '../../../../web_modules/@advanced-rest-client/bottom-sheet/bottom-sheet.js';
import '../../../../web_modules/@advanced-rest-client/arc-icons/arc-icon.js';
import '../../../../web_modules/@anypoint-web-components/anypoint-input/anypoint-masked-input.js';
import '../../../../web_modules/@advanced-rest-client/host-rules-editor/host-rules-editor.js';
import '../../../../web_modules/@api-components/api-navigation/api-navigation.js';
import '../../../../web_modules/@advanced-rest-client/exchange-search-panel/exchange-search-panel.js';
// import '../../../../web_modules/@api-components/api-request-panel/api-request-panel.js';
// import '../../../../web_modules/@api-components/api-documentation/api-documentation.js';
import '../../../../web_modules/@advanced-rest-client/arc-messages/arc-messages-dialog.js';
import { Request } from './Request.js';
import { ContextMenu } from '../context-menu/ContextMenu.js';
import { ContextMenuStyles } from '../context-menu/ContextMenu.styles.js';
import ContextMenuCommands from './ArcContextMenuCommands.js';
import { getTabClickIndex } from './Utils.js';

// @ts-ignore
document.adoptedStyleSheets = document.adoptedStyleSheets.concat(ContextMenuStyles.styleSheet);

/* global PreferencesProxy, OAuth2Handler, WindowManagerProxy, ThemeManager, logger, EncryptionService, WorkspaceManager, ipc, CookieBridge, ImportFilePreProcessor, FilesystemProxy, ApplicationSearchProxy, AppStateProxy, GoogleDriveProxy, ElectronAmfService, GoogleAnalytics */

/** @typedef {import('../../../preload/PreferencesProxy').PreferencesProxy} PreferencesProxy */
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
/** @typedef {import('@advanced-rest-client/arc-types').ArcState.ARCState} ARCState */
/** @typedef {import('@advanced-rest-client/arc-events').ARCRequestNavigationEvent} ARCRequestNavigationEvent */
/** @typedef {import('@advanced-rest-client/arc-events').ARCProjectNavigationEvent} ARCProjectNavigationEvent */
/** @typedef {import('@advanced-rest-client/arc-events').ARCRestApiNavigationEvent} ARCRestApiNavigationEvent */
/** @typedef {import('@advanced-rest-client/arc-events').ARCMenuPopupEvent} ARCMenuPopupEvent */
/** @typedef {import('@advanced-rest-client/arc-events').ARCNavigationEvent} ARCNavigationEvent */
/** @typedef {import('@advanced-rest-client/arc-events').ARCExternalNavigationEvent} ARCExternalNavigationEvent */
/** @typedef {import('@advanced-rest-client/arc-events').ConfigStateUpdateEvent} ConfigStateUpdateEvent */
/** @typedef {import('@advanced-rest-client/arc-events').ArcImportInspectEvent} ArcImportInspectEvent */
/** @typedef {import('@advanced-rest-client/arc-events').WorkspaceAppendRequestEvent} WorkspaceAppendRequestEvent */
/** @typedef {import('@advanced-rest-client/arc-events').WorkspaceAppendExportEvent} WorkspaceAppendExportEvent */
/** @typedef {import('@advanced-rest-client/arc-events').RestApiProcessFileEvent} RestApiProcessFileEvent */
/** @typedef {import('@advanced-rest-client/arc-models').IndexableRequest} IndexableRequest */
/** @typedef {import('@advanced-rest-client/arc-models').ARCEnvironmentStateSelectEvent} ARCEnvironmentStateSelectEvent */
/** @typedef {import('../../../../web_modules/@advanced-rest-client/arc-request-ui').ArcRequestWorkspaceElement} ArcRequestWorkspaceElement */
/** @typedef {import('../../../../web_modules/@advanced-rest-client/arc-menu').ArcMenuElement} ArcMenuElement */
/** @typedef {import('../context-menu/interfaces').ExecuteOptions} ExecuteOptions */
/** @typedef {import('@advanced-rest-client/arc-types').Authorization.OAuth2Authorization} OAuth2Authorization */
/** @typedef {import('@advanced-rest-client/electron-amf-service/types').ApiParseResult} ApiParseResult */
/** @typedef {import('@advanced-rest-client/exchange-search-panel/src/types').ExchangeAsset} ExchangeAsset */

const unhandledRejectionHandler = Symbol('unhandledRejectionHandler');
const headerTemplate = Symbol('headerTemplate');
const pageTemplate = Symbol('pageTemplate');
const workspaceTemplate = Symbol('workspaceTemplate');
const navigationTemplate = Symbol('navigationTemplate');
const navigateRequestHandler = Symbol('navigateRequestHandler');
const navigateHandler = Symbol('navigateHandler');
const navigateProjectHandler = Symbol('navigateProjectHandler');
const navigateRestApiHandler = Symbol('navigateRestApiHandler');
const popupMenuHandler = Symbol('popupMenuHandler');
const mainBackHandler = Symbol('mainBackHandler');
const historyPanelTemplate = Symbol('historyPanelTemplate');
const savedPanelTemplate = Symbol('savedPanelTemplate');
const clientCertScreenTemplate = Symbol('clientCertScreenTemplate');
const commandHandler = Symbol('commandHandler');
const requestActionHandler = Symbol('requestActionHandler');
const configStateChangeHandler = Symbol('configStateChangeHandler');
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
const navMinimizedHandler = Symbol('navMinimizedHandler');
const navResizeMousedown = Symbol('navResizeMousedown');
const resizeMouseUp = Symbol('resizeMouseUp');
const resizeMouseMove = Symbol('resizeMouseMove');
const isResizing = Symbol('isResizing');
const mainNavigateHandler = Symbol('mainNavigateHandler');
const variablesEnabledValue = Symbol('variablesEnabledValue');
const systemVariablesEnabledValue = Symbol('systemVariablesEnabledValue');
const requestDetailTemplate = Symbol('requestDetailTemplate');
const requestMetaTemplate = Symbol('requestMetaTemplate');
const sheetClosedHandler = Symbol('sheetClosedHandler');
const metaRequestHandler = Symbol('metaRequestHandler');
const requestMetaCloseHandler = Symbol('requestMetaCloseHandler');
const externalNavigationHandler = Symbol('externalNavigationHandler');
const contextCommandHandler = Symbol('contextCommandHandler');
const hostRulesTemplate = Symbol('hostRulesTemplate');
const processApplicationState = Symbol('processApplicationState');
const drivePickHandler = Symbol('drivePickHandler');
const processApiFileHandler = Symbol('processApiFileHandler');
const arcNavigationTemplate = Symbol('arcNavigationTemplate');
const exchangeSearchTemplate = Symbol('exchangeSearchTemplate');
const exchangeSelectionHandler = Symbol('exchangeSelectionHandler');
const themeActivateHandler = Symbol('themeActivateHandler');
const unreadMessagesTemplate = Symbol('unreadMessagesTemplate');
const appMessagesDialogTemplate = Symbol('appMessagesDialogTemplate');
const openMessagesHandler = Symbol('openMessagesHandler');

/**
 * A routes that does not go through the router and should not be remembered in the history.
 */
const HiddenRoutes = ['data-inspect'];

export class AdvancedRestClientApplication extends ApplicationPage {
  /**
   * @returns {OAuth2Authorization}
   */
  get oauthConfig() {
    return {
      clientId: '1076318174169-u4a5d3j2v0tbie1jnjgsluqk1ti7ged3.apps.googleusercontent.com',
      authorizationUri: 'https://accounts.google.com/o/oauth2/v2/auth',
      redirectUri: 'https://auth.advancedrestclient.com/oauth2',
      scopes: [
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive.install',
      ],
    }
  }

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
      name: 'hosts',
      pattern: 'hosts'
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

  #contextMenu = new ContextMenu(document.body);

  stateProxy = new AppStateProxy();

  settings = new PreferencesProxy();

  oauth2Proxy = new OAuth2Handler();

  windowProxy = new WindowManagerProxy();

  themeProxy = new ThemeManager();

  encryption = new EncryptionService();

  workspace = new WorkspaceManager();

  cookieBridge = new CookieBridge();

  fs = new FilesystemProxy();

  search = new ApplicationSearchProxy();

  requestFactory = new Request();

  gDrive = new GoogleDriveProxy();

  /**
   * Responsible for processing API data and producing AMF model consumed by the API Console.
   */
  apiParser = new ElectronAmfService();

  ga = new GoogleAnalytics();

  /**
   * A service that requests fro the data from the ARC server fore new messages.
   */
  appMessages = new ArcMessagingService('electron');

  /**
   * @returns {ArcRequestWorkspaceElement}
   */
  get workspaceElement() {
    if (!this.#workspace) {
      this.#workspace = document.querySelector('arc-request-workspace');
    }
    return this.#workspace;
  }

  get variablesEnabled() {
    return this[variablesEnabledValue];
  }

  set variablesEnabled(value) {
    const old = this[variablesEnabledValue];
    if (old === value) {
      return;
    }
    this[variablesEnabledValue] = value;
    this.requestFactory.evaluateVariables = value;
    this.render();
  }

  get systemVariablesEnabled() {
    return this[systemVariablesEnabledValue];
  }

  set systemVariablesEnabled(value) {
    const old = this[systemVariablesEnabledValue];
    if (old === value) {
      return;
    }
    this[systemVariablesEnabledValue] = value;
    const model = document.body.querySelector('variables-model');
    if (value) {
      model.systemVariables = process.env;
    } else {
      model.systemVariables = undefined;
    }
    this.render();
  }

  constructor() {
    super();

    this.initObservableProperties(
      'route', 'initializing', 'loadingStatus',
      'compatibility', 'oauth2RedirectUri',
      'navigationDetached', 'updateState', 'hasAppUpdate',
      'popupMenuEnabled', 'draggableEnabled', 'historyEnabled',
      'listType', 'detailedSearch', 'currentEnvironment',
      'workspaceSendButton', 'workspaceProgressInfo', 'workspaceBodyEditor', 'workspaceAutoEncode',
      'navigationWidth',
      'requestDetailsOpened', 'requestMetaOpened', 'metaRequestId', 'metaRequestType',
      'unreadAppMessages', 'applicationMessages',
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
    this[variablesEnabledValue] = true;

    this.workspaceSendButton = true;
    this.workspaceProgressInfo = true;
    this.workspaceBodyEditor = 'Monaco';
    this.workspaceAutoEncode = false;


    this.requestDetailsOpened = false;
    this.requestMetaOpened = false;
    this.metaRequestId = undefined;
    this.metaRequestType = undefined;
    
    /** 
     * @type {number} The number of unread messages in the application.
     */
    this.unreadAppMessages = 0;
  }

  async initialize() {
    await this.ga.initialize();
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
    let state = /** @type ARCState */(null);
    try {
      state = await this.stateProxy.read();
    } catch (e) {
      state = {
        kind: 'ARC#AppState',
      };
    }
    this[processApplicationState](state);

    await this.afterInitialization();
    await this.loadMonaco();
    this.initializing = false;
    this.unreadAppMessages = await this.appMessages.run();
  }

  /**
   * Sets local variables from the config object
   * @param {ARCConfig} cnf
   */
  setConfigVariables(cnf) {
    const ignoreCookies = !!cnf.request && cnf.request.ignoreSessionCookies === false;
    if (!ignoreCookies) {
      ModulesRegistry.register(ModulesRegistry.request, 'arc/request/cookies', RequestCookies.processRequestCookies, ['events']);
      ModulesRegistry.register(ModulesRegistry.response, 'arc/response/cookies', RequestCookies.processResponseCookies, ['events']);
    }
    
    if (cnf.history) {
      if (typeof cnf.history.enabled === 'boolean') {
        this.historyEnabled = cnf.history.enabled;
      }
      
      if (typeof cnf.history.fastSearch === 'boolean') {
        this.detailedSearch = !cnf.history.fastSearch;
      }
    }

    if (cnf.request) {
      if (typeof cnf.request.timeout === 'number') {
        this.requestFactory.requestTimeout = cnf.request.timeout;
      }
      if (typeof cnf.request.followRedirects === 'boolean') {
        this.requestFactory.followRedirects = cnf.request.followRedirects;
      }
      if (typeof cnf.request.defaultHeaders === 'boolean') {
        this.requestFactory.defaultHeaders = cnf.request.defaultHeaders;
      }
      if (typeof cnf.request.validateCertificates === 'boolean') {
        this.requestFactory.validateCertificates = cnf.request.validateCertificates;
      }
      if (typeof cnf.request.nativeTransport === 'boolean') {
        this.requestFactory.nativeTransport = cnf.request.nativeTransport;
      }
      if (typeof cnf.request.useSystemVariables === 'boolean') {
        this.systemVariablesEnabled = cnf.request.useSystemVariables;
      }
      if (typeof cnf.request.useAppVariables === 'boolean') {
        this.variablesEnabled = cnf.request.useAppVariables;
      }
      if (cnf.request.oauth2redirectUri) {
        this.oauth2RedirectUri = cnf.request.oauth2redirectUri;
      }
    }
    
    if (cnf.view) {
      if (typeof cnf.view.fontSize === 'number') {
        document.body.style.fontSize = `${cnf.view.fontSize}px`;
      }
      if (typeof cnf.view.popupMenu === 'boolean') {
        this.popupMenuEnabled = cnf.view.popupMenu;
      }
      if (typeof cnf.view.draggableEnabled === 'boolean') {
        this.draggableEnabled = cnf.view.draggableEnabled;
      }
      if (typeof cnf.view.listType === 'string') {
        this.listType = cnf.view.listType;
      }
    }

    if (cnf.requestEditor) {
      if (typeof cnf.requestEditor.sendButton === 'boolean') {
        this.workspaceSendButton = cnf.requestEditor.sendButton;
      }
      if (typeof cnf.requestEditor.progressInfo === 'boolean') {
        this.workspaceProgressInfo = cnf.requestEditor.progressInfo;
      }
      if (typeof cnf.requestEditor.bodyEditor === 'string') {
        this.workspaceBodyEditor = cnf.requestEditor.bodyEditor;
      }
      if (typeof cnf.requestEditor.autoEncode === 'boolean') {
        this.workspaceAutoEncode = cnf.requestEditor.autoEncode;
      }
    }

    if (cnf.updater) {
      const { channel } = cnf.updater;
      if (typeof channel === 'string') {
        this.appMessages.channel = channel;
      }
    }
  }

  /**
   * @param {ARCState} state
   */
  [processApplicationState](state) {
    if (state.environment) {
      if (state.environment.variablesEnvironment) {
        // this.currentEnvironment = state.environment.variablesEnvironment;
        ArcModelEvents.Environment.select(document.body, state.environment.variablesEnvironment);
      }
    }
  }

  listen() {
    this.settings.observe();
    this.oauth2Proxy.listen();
    this.themeProxy.listen();
    this.encryption.listen();
    this.workspace.listen();
    this.cookieBridge.listen();
    this.fs.listen();
    this.search.listen();
    this.requestFactory.listen();
    this.gDrive.listen();
    this.#contextMenu.connect();
    this.#contextMenu.registerCommands(ContextMenuCommands);
    this.#contextMenu.registerCallback(this[contextCommandHandler].bind(this));

    window.addEventListener(ArcNavigationEventTypes.navigateRequest, this[navigateRequestHandler].bind(this));
    window.addEventListener(ArcNavigationEventTypes.navigate, this[navigateHandler].bind(this));
    window.addEventListener(ArcNavigationEventTypes.navigateProject, this[navigateProjectHandler].bind(this));
    window.addEventListener(ArcNavigationEventTypes.navigateRestApi, this[navigateRestApiHandler].bind(this));
    window.addEventListener(ArcNavigationEventTypes.popupMenu, this[popupMenuHandler].bind(this));
    window.addEventListener(ArcNavigationEventTypes.navigateExternal, this[externalNavigationHandler].bind(this));
    window.addEventListener(WorkspaceEventTypes.appendRequest, this[workspaceAppendRequestHandler].bind(this));
    window.addEventListener(WorkspaceEventTypes.appendExport, this[workspaceAppendExportHandler].bind(this));
    window.addEventListener(ConfigEventTypes.State.update, this[configStateChangeHandler].bind(this));
    window.addEventListener(DataImportEventTypes.inspect, this[dataInspectHandler].bind(this));
    window.addEventListener(ArcModelEventTypes.Environment.State.select, this[environmentSelectedHandler].bind(this));
    window.addEventListener(RestApiEventTypes.processFile, this[processApiFileHandler].bind(this));
    window.addEventListener('mousemove', this[resizeMouseMove].bind(this));
    window.addEventListener('mouseup', this[resizeMouseUp].bind(this));
    window.addEventListener('themeactivated', this[themeActivateHandler].bind(this));

    ipc.on('command', this[commandHandler].bind(this));
    ipc.on('request-action', this[requestActionHandler].bind(this));

    ipc.on('popup-app-menu-opened', this[popupMenuOpenedHandler].bind(this));
    ipc.on('popup-app-menu-closed', this[popupMenuClosedHandler].bind(this));
    ipc.on('app-navigate', this[mainNavigateHandler].bind(this));
    ipc.on('google-drive-file-pick', this[drivePickHandler].bind(this));

    ipc.on('checking-for-update', () => {
      this.logger.info('Checking for application update');
      this.updateState = 'checking-for-update';
    });
    ipc.on('update-available', () => {
      this.logger.info('Application update available.');
      this.updateState = 'update-available';
    });
    ipc.on('update-not-available', () => {
      this.logger.info('Application update not available.');
      this.updateState = 'update-not-available';
    });
    ipc.on('autoupdate-error', (e, error) => {
      this.updateState = 'autoupdate-error';
      this.logger.error(error);
    });
    ipc.on('download-progress', (e, progressObj) => {
      this.updateState = 'download-progress';
      this.logger.info(progressObj);
    });
    ipc.on('update-downloaded', () => {
      this.logger.info('Application update downloaded and ready to install.');
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
    try {
      await this.themeProxy.loadApplicationTheme();
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
    this.ga.screenView(name);
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
    // this.workspaceElement.removeRequest();
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
    if (action === 'open') {
      this.workspaceElement.addByRequestId(requestType, requestId);
      if (this.route !== 'workspace') {
        navigate('workspace');
      }
      return;
    }
    if (action === 'detail') {
      this.requestMetaOpened = false;
      this.requestDetailsOpened = true;
      this.metaRequestId = requestId;
      this.metaRequestType = requestType;
      return;
    }
    if (action === 'edit') {
      this.requestDetailsOpened = false;
      this.requestMetaOpened = true;
      this.metaRequestId = requestId;
      this.metaRequestType = requestType;
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
   * @param {ARCRestApiNavigationEvent} e
   */
  [navigateRestApiHandler](e) {
    const { api, version } = e;
    navigatePage('api-console.html', 'open', 'db', api, version);
  }

  /**
   * @param {ARCMenuPopupEvent} e
   */
  [popupMenuHandler](e) {
    const { menu } = e;
    const element = document.querySelector('arc-menu');
    const rect = element.getBoundingClientRect();
    const sizing = {
      height: rect.height,
      width: rect.width
    };
    ipc.send('popup-app-menu', menu, sizing);
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
   * @param {ARCExternalNavigationEvent} e
   */
  [externalNavigationHandler](e) {
    const { url, detail } = e;
    const { purpose } = detail;
    ipc.send('open-web-url', url, purpose);
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
      case 'open-cookie-manager': navigate('cookie-manager'); break;
      case 'open-hosts-editor': navigate('hosts'); break;
      case 'open-themes': navigate('themes'); break;
      case 'open-client-certificates': navigate('client-certificates'); break;
      case 'open-requests-workspace': navigate('workspace'); break;
      case 'open-web-socket': this.workspaceElement.addWsRequest(); break;
      case 'process-external-file': this.processExternalFile(args[0]); break;
      case 'import-data': navigate('data-import'); break;
      case 'export-data': navigate('data-export'); break;
      case 'show-settings': navigate('settings'); break;
      case 'popup-menu': this.navigationDetached = !this.navigationDetached; break;
      case 'export-workspace': this.exportWorkspace(); break;
      case 'login-external-webservice': this.workspaceElement.openWebUrlInput(); break;
      case 'open-workspace-details': this.workspaceElement.openWorkspaceDetails(); break;
      case 'open-messages': this.openAppMessages(); break;
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
      case 'save-as':
        this.workspaceElement.saveAsOpened();
        break;
      case 'new-http-tab':
        this.workspaceElement.addHttpRequest();
        break;
      case 'new-websocket-tab':
        this.workspaceElement.addWsRequest();
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
   * @param {ExecuteOptions} args
   */
  [contextCommandHandler](args) {
    const { command } = args;
    switch (command) {
      case 'close-tab': this.workspaceElement.removeRequest(getTabClickIndex(args.target)); break;
      case 'close-other-tabs': this.workspaceElement.closeAllTabs(getTabClickIndex(args.target)); break;
      case 'close-all-tabs': this.workspaceElement.closeAllTabs(); break;
      case 'duplicate-tab': this.workspaceElement.duplicateTab(getTabClickIndex(args.target)); break;
      default:
    }
  }

  /**
   * @param {ConfigStateUpdateEvent} e
   */
  [configStateChangeHandler](e) {
    const { key, value } = e.detail;
    if (key === 'request.ignoreSessionCookies') {
      if (value) {
        ModulesRegistry.register(ModulesRegistry.request, 'arc/request/cookies', RequestCookies.processRequestCookies, ['events']);
        ModulesRegistry.register(ModulesRegistry.response, 'arc/response/cookies', RequestCookies.processResponseCookies, ['events']);
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
    } else if (key === 'requestEditor.sendButton') {
      this.workspaceSendButton = value;
    } else if (key === 'requestEditor.progressInfo') {
      this.workspaceProgressInfo = value;
    } else if (key === 'requestEditor.bodyEditor') {
      this.workspaceBodyEditor = value;
    } else if (key === 'requestEditor.autoEncode') {
      this.workspaceAutoEncode = value;
    } else if (key === 'view.fontSize') {
      document.body.style.fontSize = `${value}px`;
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
        const result = await this.apiParser.processBuffer(factory.buffer);
        this.apiConsoleFromParser(result);
        return;
      }
      const contents = factory.readContents();
      await this.processExternalData(contents);
    } catch (cause) {
      this.logger.error(cause);
      this.reportCriticalError(cause);
    }
  }

  /**
   * Process file contents after importing it to the application.
   * @param {string} contents
   */
  async processExternalData(contents) {
    const decrypted = await this.decryptIfNeeded(contents);
    const data = JSON.parse(decrypted);
    if (data.swagger) {
      const result = await this.apiParser.processBuffer(Buffer.from(contents));
      this.apiConsoleFromParser(result);
      return;
    }
    const processor = new ImportNormalize();
    const normalized = await processor.normalize(data);

    if (isSingleRequest(normalized)) {
      const insert = Array.isArray(normalized.requests) ? normalized.requests[0] : data;
      WorkspaceEvents.appendRequest(document.body, insert);
      return;
    }
    
    if (normalized.loadToWorkspace) {
      WorkspaceEvents.appendExport(document.body, normalized);
      return;
    }
    this.route = 'data-inspect';
    this[inspectDataValue] = normalized;
    this.render();
  }

  /**
   * @param {ApiParseResult} result
   */
  async apiConsoleFromParser(result) {
    const id = await this.fs.storeApicModelTmp(result);
    navigatePage('api-console.html', 'open', 'file', id);
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
   * @param {*} e
   * @param {string} type
   * @param {string[]} args
   */
  [mainNavigateHandler](e, type, args) {
    switch (type) {
      // @ts-ignore
      case 'request': ArcNavigationEvents.navigateRequest(document.body, ...args); break;
      // @ts-ignore
      case 'project': ArcNavigationEvents.navigateProject(document.body, ...args); break;
      // @ts-ignore
      case 'navigate': ArcNavigationEvents.navigate(document.body, ...args); break;
      default:
    }
  }

  /**
   * Calls ARC app to serialize workspace data and exports it to a file.
   * @return {Promise}
   */
  async exportWorkspace() {
    const id = await this.workspace.changeStoreLocation();
    if (!id) {
      return;
    }
    this.initOptions.workspaceId = id;
    this.render();
    this.workspaceElement.store();
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
    ImportEvents.dataImported(document.body);
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
    ArcModelEvents.UrlIndexer.update(document.body, indexes);
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
      this.stateProxy.update('environment.variablesEnvironment', environment._id);
    } else {
      this.currentEnvironment = null;
      this.stateProxy.update('environment.variablesEnvironment', null);
    }
  }

  /**
   * @param {Event} e
   */
  [navMinimizedHandler](e) {
    const menu = /** @type ArcMenuElement */ (e.target);
    if (menu.minimized) {
      menu.parentElement.classList.add('minimized');
    } else {
      menu.parentElement.classList.remove('minimized');
    }
  }

  /**
   * @param {MouseEvent} e
   */
  [navResizeMousedown](e) {
    this[isResizing] = true;
    e.preventDefault();
  }

  /**
   * @param {MouseEvent} e
   */
  [resizeMouseUp](e) {
    if (!this[isResizing]) {
      return;
    }
    this[isResizing] = false;
    e.preventDefault();
  }

  /**
   * @param {MouseEvent} e
   */
  [resizeMouseMove](e) {
    if (!this[isResizing]) {
      return;
    }
    const { pageX } = e;
    if (pageX < 100) {
      return;
    }
    if (pageX > window.innerWidth - 100) {
      return;
    }
    this.navigationWidth = pageX;
  }

  [metaRequestHandler]() {
    this.requestMetaOpened = true;
    this.requestDetailsOpened = false;
  }

  [requestMetaCloseHandler]() {
    this.requestMetaOpened = false;
  }

  [sheetClosedHandler](e) {
    const prop = e.target.dataset.openProperty;
    this[prop] = e.detail.value;
  }

  /**
   * @param {Electron.IpcRendererEvent} e
   * @param {string} fileId
   */
  async [drivePickHandler](e, fileId) {
    try {
      const result = await this.gDrive.getFile(fileId);
      await this.processExternalData(result);
    } catch (cause) {
      this.logger.error(cause);
      this.reportCriticalError(cause);
    }
  }

  /**
   * @param {RestApiProcessFileEvent} e
   */
  async [processApiFileHandler](e) {
    const { file } = e;
    const result = await this.apiParser.processApiFile(file);
    this.apiConsoleFromParser(result);
  }

  /** 
   * @param {CustomEvent} e
   */
  async [exchangeSelectionHandler](e) {
    const asset = /** @type ExchangeAsset */ (e.detail);
    let file;
    const types = ['fat-raml', 'raml', 'oas'];
    for (let i = 0, len = asset.files.length; i < len; i++) {
      if (types.indexOf(asset.files[i].classifier) !== -1) {
        file = asset.files[i];
        break;
      }
    }
    if (!file || !file.externalLink) {
      this.reportCriticalError('RAML data not found in the asset.');
      return;
    }
    const { externalLink, mainFile, md5, packaging } = file;
    try {
      const result = await this.apiParser.processApiLink(externalLink, mainFile, md5, packaging);
      this.apiConsoleFromParser(result);
    } catch (cause) {
      this.reportCriticalError(cause.message);
    }
  }

  /**
   * @param {CustomEvent} e
   */
  [themeActivateHandler](e) {
    this.compatibility = e.detail === ThemeManager.anypointTheme;
  }

  [openMessagesHandler]() {
    this.openAppMessages();
  }

  async openAppMessages() {
    if (!this.applicationMessages) {
      this.applicationMessages = await this.appMessages.readMessages();
    }
    const dialog = document.querySelector('arc-messages-dialog');
    dialog.opened = true;
    await this.appMessages.markAllRead();
    this.unreadAppMessages = 0;
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
    ${this[appMessagesDialogTemplate]()}
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
    const { route } = this;
    const isWorkspace = route === 'workspace';
    return html`
    <header>
      ${isWorkspace ? '' : 
      html`
      <anypoint-icon-button title="Back to the request workspace" @click="${this[mainBackHandler]}"  class="header-action-button">
        <arc-icon icon="arrowBack"></arc-icon>
      </anypoint-icon-button>`}
      API Client
      <span class="spacer"></span>
      ${this[unreadMessagesTemplate]()}
      ${this[environmentTemplate]()}
    </header>`;
  }

  /**
   * @returns {TemplateResult|string} The template for the unread notifications icon button
   */
  [unreadMessagesTemplate]() {
    const { unreadAppMessages } = this;
    if (!unreadAppMessages) {
      return '';
    }
    return html`
    <anypoint-icon-button title="You have unread messages" class="header-action-button" @click="${this[openMessagesHandler]}">
      <arc-icon icon="notificationsActive"></arc-icon>
    </anypoint-icon-button>`;
  }

  /**
   * @returns {TemplateResult|string} The template for the environment selector and the overlay.
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
    ></variables-overlay>
    `;
  }

  /**
   * @returns {TemplateResult|string} The template for the application main navigation area
   */
  [navigationTemplate]() {
    if (this.navigationDetached) {
      return '';
    }
    const { navigationWidth } = this;
    const hasWidth = typeof navigationWidth === 'number';
    const classes = {
      'auto-width': hasWidth,
    };
    const styles = {
      width: '',
    };
    if (hasWidth) {
      styles.width = `${navigationWidth}px`;
    }
    return html`
    <nav
      class="${classMap(classes)}"
      style="${styleMap(styles)}"
    >
      ${this[arcNavigationTemplate]()}
      <div class="nav-resize-rail" @mousedown="${this[navResizeMousedown]}"></div>
    </nav>
    `;
  }

  /**
   * @returns {TemplateResult} The template for the ARC navigation
   */
  [arcNavigationTemplate]() {
    const { compatibility, menuPopup, listType, historyEnabled, popupMenuEnabled, draggableEnabled } = this;
    const hideHistory = menuPopup.includes('history-menu');
    const hideSaved = menuPopup.includes('saved-menu');
    const hideProjects = menuPopup.includes('projects-menu');
    const hideApis = menuPopup.includes('rest-api-menu');
    const hideSearch = menuPopup.includes('search-menu');
    return html`
    <arc-menu
      ?compatibility="${compatibility}"
      .listType="${listType}"
      ?history="${historyEnabled}"
      ?hideHistory="${hideHistory}"
      ?hideSaved="${hideSaved}"
      ?hideProjects="${hideProjects}"
      ?hideApis="${hideApis}"
      ?hideSearch="${hideSearch}"
      ?popup="${popupMenuEnabled}"
      ?dataTransfer="${draggableEnabled}"
      @minimized="${this[navMinimizedHandler]}"
    ></arc-menu>
    `;
  }

  /**
   * @param {string} route The current route
   * @returns {TemplateResult} The template for the page content
   */
  [pageTemplate](route) {
    return html`
    <main id="main">
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
      ${this[hostRulesTemplate](route)}
      ${this[exchangeSearchTemplate](route)}
      ${this[requestDetailTemplate]()}
      ${this[requestMetaTemplate]()}
    </main>
    `;
  }

  /**
   * @param {boolean} visible Whether the workspace is rendered in the view
   * @returns
   */
  [workspaceTemplate](visible) {
    const { oauth2RedirectUri, compatibility, initOptions, workspaceSendButton, workspaceProgressInfo } = this;
    // if (typeof cnf.requestEditor.bodyEditor === 'string') {
    //   this.workspaceBodyEditor = cnf.requestEditor.bodyEditor;
    // }
    // if (typeof cnf.requestEditor.autoEncode === 'boolean') {
    //   this.workspaceAutoEncode = cnf.requestEditor.autoEncode;
    // }
    return html`
    <arc-request-workspace
      ?hidden="${!visible}"
      ?compatibility="${compatibility}"
      ?renderSend="${workspaceSendButton}"
      ?progressInfo="${workspaceProgressInfo}"
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

  /**
   * @returns {TemplateResult} The template for the request metadata info dialog
   */
  [requestDetailTemplate]() {
    const { compatibility, requestDetailsOpened, metaRequestId, metaRequestType } = this;
    return html`
    <bottom-sheet
      class="bottom-sheet-container"
      .opened="${requestDetailsOpened}"
      data-open-property="requestDetailsOpened"
      @closed="${this[sheetClosedHandler]}"
    >
      <request-meta-details
        ?compatibility="${compatibility}"
        .requestId="${metaRequestId}"
        .requestType="${metaRequestType}"
        @edit="${this[metaRequestHandler]}"
      ></request-meta-details>
    </bottom-sheet>`;
  }

  /**
   * @returns {TemplateResult} The template for the request metadata editor dialog
   */
  [requestMetaTemplate]() {
    const { compatibility, requestMetaOpened, metaRequestId, metaRequestType } = this;
    return html`
    <bottom-sheet
      class="bottom-sheet-container"
      .opened="${requestMetaOpened}"
      data-open-property="requestMetaOpened"
      @closed="${this[sheetClosedHandler]}"
    >
      <request-meta-editor
        ?compatibility="${compatibility}"
        .requestId="${metaRequestId}"
        .requestType="${metaRequestType}"
        @close="${this[requestMetaCloseHandler]}"
      ></request-meta-editor>
    </bottom-sheet>`;
  }

  /**
   * @param {string} route The current route
   * @returns {TemplateResult|string} The template for the host rules mapping element
   */
  [hostRulesTemplate](route) {
    if (route !== 'hosts') {
      return '';
    }
    const { compatibility } = this;
    return html`
    <host-rules-editor
      ?compatibility="${compatibility}"
      class="screen scroll"
    ></host-rules-editor>
    `;
  }

  /**
   * @param {string} route The current route
   * @returns {TemplateResult|string} The template for the host rules mapping element
   */
  [exchangeSearchTemplate](route) {
    if (route !== 'exchange-search') {
      return '';
    }
    const { compatibility } = this;
    return html`
    <exchange-search-panel
      ?compatibility="${compatibility}"
      anypointAuth
      columns="auto"
      exchangeRedirectUri="https://auth.advancedrestclient.com/"
      exchangeClientId="2dc40927457042b5862864c3c97737d7"
      forceOauthEvents
      @selected="${this[exchangeSelectionHandler]}"
      class="screen scroll"
    ></exchange-search-panel>
    `;
  }

  /**
   * @returns {TemplateResult} The template for the dialog with application messages
   */
  [appMessagesDialogTemplate]() {
    return html`
    <arc-messages-dialog
      .messages="${this.applicationMessages}"
      ?compatibility="${this.compatibility}"
      modal
    ></arc-messages-dialog>`;
  }
}
