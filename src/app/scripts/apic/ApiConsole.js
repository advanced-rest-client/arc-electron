import '../pouchdb.js';
import marked from '../../../../web_modules/marked/lib/marked.js';
import { ApplicationPage } from '../../ApplicationPage.js';
import { findRoute, navigate, navigatePage } from '../lib/route.js';
import { classMap } from '../../../../web_modules/lit-html/directives/class-map.js';
import { styleMap } from '../../../../web_modules/lit-html/directives/style-map.js';
import { html } from '../../../../web_modules/lit-html/lit-html.js';
import { AmfHelperMixin } from '../../../../web_modules/@api-components/amf-helper-mixin/index.js';
import { ArcModelEvents } from '../../../../web_modules/@advanced-rest-client/arc-models/index.js';
import { ConfigEventTypes } from '../../../../web_modules/@advanced-rest-client/arc-events/index.js';
import '../../../../web_modules/@polymer/font-roboto-local/roboto.js';
import '../../../../web_modules/@advanced-rest-client/arc-models/history-data-model.js';
import '../../../../web_modules/@advanced-rest-client/arc-models/auth-data-model.js';
import '../../../../web_modules/@advanced-rest-client/arc-models/host-rules-model.js';
import '../../../../web_modules/@advanced-rest-client/arc-models/rest-api-model.js';
import '../../../../web_modules/@advanced-rest-client/arc-models/url-indexer.js';
import '../../../../web_modules/@api-components/api-navigation/api-navigation.js';
import '../../../../web_modules/@api-components/api-documentation/api-documentation.js';
import { ConsoleRequest } from './ConsoleRequest.js';

// @ts-ignore
window.marked = marked;

/** @typedef {import('lit-html').TemplateResult} TemplateResult */
/** @typedef {import('@advanced-rest-client/arc-types').RestApi.ARCRestApiIndex} ARCRestApiIndex */
/** @typedef {import('@advanced-rest-client/arc-types').Config.ARCConfig} ARCConfig */
/** @typedef {import('@advanced-rest-client/arc-events').ConfigStateUpdateEvent} ConfigStateUpdateEvent */
/** @typedef {import('../../../preload/PreferencesProxy').PreferencesProxy} PreferencesProxy */
/** @typedef {import('../../../preload/ThemeManager').ThemeManager} ThemeManager */
/** @typedef {import('../../../preload/FilesystemProxy').FilesystemProxy} FilesystemProxy */
/** @typedef {import('../../../preload/ApplicationSearchProxy').ApplicationSearchProxy} ApplicationSearchProxy */
/** @typedef {import('../../../types').ArcAppInitOptions} ArcAppInitOptions */
/** @typedef {import('../../../../web_modules/@anypoint-web-components/anypoint-listbox').AnypointListbox} AnypointListbox */

/* global PreferencesProxy, ThemeManager, logger, FilesystemProxy, ApplicationSearchProxy, ElectronAmfService */

const unhandledRejectionHandler = Symbol('unhandledRejectionHandler');
const navigationTemplate = Symbol('navigationTemplate');
const navResizeMousedown = Symbol('navResizeMousedown');
const resizeMouseUp = Symbol('resizeMouseUp');
const resizeMouseMove = Symbol('resizeMouseMove');
const isResizing = Symbol('isResizing');
const pageTemplate = Symbol('isResizing');
const mainBackHandler = Symbol('mainBackHandler');
const apiVersionMenuHandler = Symbol('apiVersionMenuHandler');
const configStateChangeHandler = Symbol('configStateChangeHandler');

export class ApiConsoleApplication extends AmfHelperMixin(ApplicationPage) {
  static get routes() {
    return [
      {
        name: 'open',
        pattern: 'open/(?<type>[^/]*)/(?<id>[^/]*)'
      },
      {
        name: 'open',
        pattern: 'open/(?<type>[^/]*)/(?<id>[^/]*)/(?<version>[^/]*)'
      },
      {
        name: 'api-console',
        pattern: 'docs/?'
      },
    ];
  }

  settings = new PreferencesProxy();

  themeProxy = new ThemeManager();

  fs = new FilesystemProxy();

  search = new ApplicationSearchProxy();

  /**
   * Responsible for processing API data and producing AMF model consumed by the API Console.
   */
  apiParser = new ElectronAmfService();

  requestFactory = new ConsoleRequest();

  constructor() {
    super();

    this.initObservableProperties(
      'route', 'initializing', 'loadingStatus', 'compatibility',
      'amfType', 'selectedShape', 'selectedShapeType',
      'navigationWidth', 'isStored',
      'indexItem', 'apiVersion',
    );

    /** 
     * @type {boolean} Whether the project is being restored from the metadata store.
     */
    this.initializing = true;
    /** 
     * @type {string} A loading state information.
     */
    this.loadingStatus = 'Initializing application...';
    this.logger = logger;
    
    /** 
     * A flag to determine whether the current API is stored in the application data store.
     * When set to true it renders controls to store the API data.
     */
    this.isStored = false;

    /**
     * @type {ARCRestApiIndex}
     */
    this.indexItem = undefined;

    window.onunhandledrejection = this[unhandledRejectionHandler].bind(this);
    this.oauth2RedirectUri = 'http://auth.advancedrestclient.com/arc.html';
    this.compatibility = false;
  }

  async initialize() {
    this.listen();
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
    await this.afterInitialization();
    this.initializing = false;
  }

  /**
   * Sets local variables from the config object
   * @param {ARCConfig} cnf
   */
  setConfigVariables(cnf) {
    if (cnf.request) {
      if (typeof cnf.request.timeout === 'number') {
        this.requestFactory.requestTimeout = cnf.request.timeout;
      }
      if (typeof cnf.request.validateCertificates === 'boolean') {
        this.requestFactory.validateCertificates = cnf.request.validateCertificates;
      }
      if (typeof cnf.request.nativeTransport === 'boolean') {
        this.requestFactory.nativeTransport = cnf.request.nativeTransport;
      }
    }
  }

  listen() {
    this.settings.observe();
    this.themeProxy.listen();
    this.fs.listen();
    this.search.listen();
    this.requestFactory.listen();
    window.addEventListener(ConfigEventTypes.State.update, this[configStateChangeHandler].bind(this));
    window.addEventListener('mousemove', this[resizeMouseMove].bind(this));
    window.addEventListener('mouseup', this[resizeMouseUp].bind(this));
    window.addEventListener('themeactivated', (e) => {
      // @ts-ignore
      this.compatibility = e.detail === ThemeManager.anypointTheme;
    });
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
   * Loads the current theme.
   */
  async loadTheme() {
    try {
      const id = await this.themeProxy.loadApplicationTheme();
      this.compatibility = id === ThemeManager.anypointTheme;
    } catch (e) {
      this.logger.error(e);
    }
  }

  /**
   * @param {PromiseRejectionEvent} e
   */
  [unhandledRejectionHandler](e) {
    /* eslint-disable-next-line no-console */
    console.error(e);
    this.reportCriticalError(e.reason);
  }

  /**
   * @param {ConfigStateUpdateEvent} e
   */
  [configStateChangeHandler](e) {
    const { key, value } = e.detail;
    if (key === 'request.timeout') {
      this.requestFactory.requestTimeout = value;
    } else if (key === 'request.validateCertificates') {
      this.requestFactory.validateCertificates = value;
    } else if (key === 'request.nativeTransport') {
      this.requestFactory.nativeTransport = value;
    }
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
    if (name === 'open') {
      this.openApi(result.params.type, result.params.id, result.params.version);
    }
  }

  /**
   * Opens an API from the given source
   * @param {string} source Either `file` or `db`
   * @param {string} id The id of the API to open
   * @param {string=} version The version of the API to open.
   * @returns {Promise<void>}
   */
  async openApi(source, id, version) {
    if (source === 'file') {
      await this.restoreFromTmpFile(id);
    } else if (source === 'db') {
      await this.restoreFromDataStore(id, version);
    }
  }

  /**
   * Restores an API that has been stored in a temporary file to move the data
   * between the main application page and API Console.
   * @param {string} id The id of the generated file
   */
  async restoreFromTmpFile(id) {
    this.initializing = true;
    this.loadingStatus = 'Reading API model from a temporary file';
    this.isStored = false;
    try {
      const result = await this.fs.restoreApicModelTmp(id);
      const unresolved = result.model;
      this.unresolvedModel = unresolved;
      this.amfType = result.type;
      this.loadingStatus = 'Resolving API graph model';
      const resolved = await this.apiParser.resolveAPiConsole(unresolved, result.type.type);
      this.amf = JSON.parse(resolved);
      this.loadingStatus = 'Finishing up';
      this.processUnsavedModel(this.amf);
      this.resetSelection();
    } catch (e) {
      this.reportCriticalError(e.message);
    }
    this.initializing = false;
  }

  /**
   * Computes variables used to determine whether the API can be stored in the data store.
   * @param {any} amf The resolved AMF model.
   */
  async processUnsavedModel(amf) {
    this.baseUri = this._computeBaseUri(amf);
    this.apiVersion = this._getApiVersion(amf);
    this.canSave = this._computeCanSave(this.baseUri, this.apiVersion);
    try {
      this.indexItem = await ArcModelEvents.RestApi.read(document.body, this.baseUri);
      if (this.indexItem.versions.includes(this.apiVersion)) {
        this.isStored = true;
      }
    } catch (e) {
      this.indexItem = undefined;
    }
  }

  /**
   * Computes model's base Uri
   * @param {any} model AMF data model
   * @returns {string|undefined}
   */
  _computeBaseUri(model) {
    if (!model) {
      return undefined;
    }
    const server = this._computeServer(model);
    const protocols = this._computeProtocols(model);
    return this._getAmfBaseUri(server, protocols);
  }

  /**
   * Computes API's version
   * @param {any} amf AMF data model
   * @returns {string|undefined}
   */
  _getApiVersion(amf) {
    let version = this._computeApiVersion(amf);
    if (!version) {
      version = '1';
    }
    return String(version);
  }

  /**
   * @param {string} baseUri
   * @param {string} apiVersion
   * @returns {boolean} True when this model can be stored in the data store.
   */
  _computeCanSave(baseUri, apiVersion) {
    if (!baseUri || !apiVersion) {
      return false;
    }
    return true;
  }

  /**
   * Restores API Console from the local data store.
   * @param {string} id The data store id of the API
   * @param {string=} version The version of the API to open.
   */
  async restoreFromDataStore(id, version) {
    this.isStored = true;
    this.canSave = false;
    this.initializing = true;
    try {
      this.loadingStatus = 'Reading data from the data store';
      this.indexItem = await ArcModelEvents.RestApi.read(document.body, id);
      const data = await ArcModelEvents.RestApi.dataRead(document.body, `${id}|${version}`);
      this.loadingStatus = 'Resolving API graph model';
      const resolved = await this.apiParser.resolveAPiConsole(data.data, this.indexItem.type);
      this.loadingStatus = 'Finishing up';
      this.amf = JSON.parse(resolved);
      this.apiVersion = version;
      this.resetSelection();
    } catch (e) {
      this.indexItem = undefined;
      this.reportCriticalError('Unable to find the API.');
    }
    this.initializing = false;
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

  [mainBackHandler]() {
    navigatePage('app.html');
  }

  /**
   * Handler for the navigation event dispatched by the `api-navigation`
   * component.
   *
   * @param {CustomEvent} e
   */
  _apiNavigationOcurred(e) {
    const { selected, type } = e.detail;
    // const isPassive = passive === true;
    // if (!isPassive && this.page !== 'docs') {
    //   this.closeTryIt();
    // }
    this.selectedShape = selected;
    this.selectedShapeType = type;
  }

  /**
   * Computes value of `apiTitle` property.
   *
   * @param {Object} shape Shape of AMF model.
   * @return {String|undefined} Description if defined.
   */
  _computeApiTitle(shape) {
    return /** @type string */ (this._getValue(shape, this.ns.aml.vocabularies.core.name));
  }

  /**
   * Resets current selection to "summary" page
   */
  resetSelection() {
    if (this.route !== 'docs') {
      this.route = 'docs';
    }
    this.selectedShapeType = 'summary';
    this.selectedShape = 'summary';
  }

  async saveApi() {
    const { baseUri, apiVersion, amfType } = this;
    let { indexItem } = this;
    const webApi = this._computeWebApi(this.amf);
    const title = this._computeApiTitle(webApi);
    if (!title) {
      throw new Error('API title is missing.');
    }
    if (indexItem) {
      indexItem.versions.push(apiVersion);
      indexItem.latest = apiVersion;
    } else {
      indexItem = {
        _id: baseUri,
        title,
        order: 0,
        latest: apiVersion,
        versions: [apiVersion],
        type: amfType.type,
      }
    }
    const record = await ArcModelEvents.RestApi.update(document.body, indexItem);
    this.indexItem = record.item;
    this.isStored = true;
    await ArcModelEvents.RestApi.dataUpdate(document.body, {
      data: this.unresolvedModel,
      indexId: baseUri,
      version: apiVersion,
      amfVersion: '4.5.1',
    });
  }

  /**
   * @param {Event} e
   */
  async _apiActionMenuChanged(e) {
    const list = /** @type AnypointListbox */ (e.target);
    const { selected, selectedItem } = list;
    if (selected === undefined || selected === -1) {
      return;
    }
    const { action } = selectedItem.dataset;
    switch (action) {
      case 'delete': this.delete(); break;
      case 'delete-version': this.deleteVersion(); break;
      default:
    }
  }

  async delete() {
    const { indexItem } = this;
    await ArcModelEvents.RestApi.delete(document.body, indexItem._id);
    navigatePage('app.html');
  }

  async deleteVersion() {
    const { indexItem, apiVersion } = this;
    await ArcModelEvents.RestApi.versionDelete(document.body, indexItem._id, apiVersion);
    navigatePage('app.html');
  }

  /**
   * Changes the API version after selecting a different version of the same API.
   * @param {Event} e
   */
  async [apiVersionMenuHandler](e) {
    const list = /** @type AnypointListbox */ (e.target);
    const { selected } = list;
    navigate('open', 'db', this.indexItem._id, String(selected));
  }

  appTemplate() {
    const { initializing } = this;
    if (initializing) {
      return this.loaderTemplate();
    }
    return html`
    <div class="content">
      ${this[navigationTemplate]()}
      ${this[pageTemplate]()}
    </div>
    `;
  }

  /**
   * @returns {TemplateResult} A template for the loader
   */
  loaderTemplate() {
    return html`
    <div class="app-loader">
      <p class="message">Preparing API data</p>
      <p class="sub-message">${this.loadingStatus}</p>
    </div>
    `;
  }

  apiNavigationTemplate() {
    return html`
    <api-navigation
      .amf="${this.amf}"
      summary
      endpointsOpened
      rearrangeEndpoints
      @api-navigation-selection-changed="${this._apiNavigationOcurred}"></api-navigation>
    `;
  }

  /**
   * @returns {TemplateResult} The template for the application main navigation
   */
  [navigationTemplate]() {
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
      <div class="menu-title">
        API index
      </div>
      ${this.apiNavigationTemplate()}
      <div class="nav-resize-rail" @mousedown="${this[navResizeMousedown]}"></div>
    </nav>
    `;
  }

  /**
   * @returns {TemplateResult} The template for the page content
   */
  [pageTemplate]() {
    return html`
    <main>
    ${this.headerTemplate()}
    ${this.docsTemplate()}
    </main>
    `;
  }

  /**
   * @returns {TemplateResult|string} The template for the header
   */
  headerTemplate() {
    return html`
    <header>
      <anypoint-icon-button title="Back to the request workspace" @click="${this[mainBackHandler]}">
        <arc-icon icon="arrowBack"></arc-icon>
      </anypoint-icon-button>
      API Console by MuleSoft.
      <span class="spacer"></span>
      ${this.saveButtonTemplate()}
      ${this.apiVersionsTemplate()}
      ${this.apiMenuTemplate()}
    </header>`;
  }

  /**
   * @returns {TemplateResult} The template for the main documentation section
   */
  docsTemplate() {
    const {
      compatibility,
      selectedShape,
      selectedShapeType,
      oauth2RedirectUri,
    } = this;
    return html`
    <api-documentation
      .amf="${this.amf}"
      .selected="${selectedShape}"
      .selectedType="${selectedShapeType}"
      ?compatibility="${compatibility}"
      inlineMethods
      .redirectUri="${oauth2RedirectUri}"
      @api-navigation-selection-changed="${this._apiNavigationOcurred}"
      class="api-pages"
    ></api-documentation>
    `;
  }

  saveButtonTemplate() {
    const { canSave, isStored } = this;
    if (!canSave || isStored) {
      return '';
    }
    const label = this.indexItem ? 'Save version' : 'Save API';
    return html`
    <anypoint-button
      class="toolbar-button"
      emphasis="high"
      @click="${this.saveApi}"
      ?compatibility="${this.compatibility}"
    >${label}</anypoint-button>
    `;
  }

  apiMenuTemplate() {
    const { isStored, indexItem } = this;
    if (!isStored) {
      return '';
    }
    const hasMultiVersion = !!indexItem && Array.isArray(indexItem.versions) && !!indexItem.versions.length;
    return html`
    <anypoint-menu-button
      verticalAlign="top"
      horizontalAlign="auto"
      closeOnActivate
    >
      <anypoint-icon-button slot="dropdown-trigger" ?compatibility="${this.compatibility}">
        <arc-icon icon="moreVert"></arc-icon>
      </anypoint-icon-button>
      <anypoint-listbox
        slot="dropdown-content"
        @selected="${this._apiActionMenuChanged}"
        ?compatibility="${this.compatibility}"
      >
        <anypoint-item data-action="delete">Delete API</anypoint-item>
        ${hasMultiVersion ? html`<anypoint-item data-action="delete-version">Delete version</anypoint-item>` : ''}
        <!-- <anypoint-item data-action="save-oas">Save as OAS</anypoint-item>
        <anypoint-item data-action="save-raml">Save as RAML</anypoint-item> -->
        <!-- <anypoint-item data-action="upload-exchange">Upload to Exchange</anypoint-item> -->
      </anypoint-listbox>
    </anypoint-menu-button>
    `;
  }

  apiVersionsTemplate() {
    const { isStored, indexItem } = this;
    if (!isStored) {
      return '';
    }
    const hasMultiVersion = !!indexItem && Array.isArray(indexItem.versions) && !!indexItem.versions.length;
    if (!hasMultiVersion) {
      return '';
    }
    return html`
    <anypoint-dropdown-menu
      class="api-version-selector"
      ?compatibility="${this.compatibility}"
      noLabelFloat
    >
      <label slot="label">API version</label>
      <anypoint-listbox
        id="apiVersionSelector"
        slot="dropdown-content"
        .selected="${this.apiVersion}"
        attrforselected="data-version"
        @selected="${this[apiVersionMenuHandler]}"
        ?compatibility="${this.compatibility}"
      >
        ${indexItem.versions.map((item) => html`
          <anypoint-item data-version="${item}" ?compatibility="${this.compatibility}">${item}</anypoint-item>
        `)}
      </anypoint-listbox>
    </anypoint-dropdown-menu>
    `;
  }
}

const page = new ApiConsoleApplication();
page.initialize();
