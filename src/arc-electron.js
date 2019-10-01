import { LitElement, html } from '../web_modules/lit-element/lit-element.js';
import { ArcAppMixin } from '../web_modules/@advanced-rest-client/arc-app-mixin/arc-app-mixin.js';
import { Jexl } from '../web_modules/jexl/lib/Jexl.js';
import { moreVert } from '../web_modules/@advanced-rest-client/arc-icons/ArcIcons.js';
import PouchDB from '../web_modules/pouchdb/dist/pouchdb.js';
import PouchQuickSearch from
'../web_modules/@advanced-rest-client/pouchdb-quick-search/dist/pouchdb.quick-search.min.js';
import marked from '../web_modules/marked/lib/marked.js';
import '../web_modules/@polymer/app-layout/app-drawer-layout/app-drawer-layout.js';
import '../web_modules/@polymer/app-layout/app-drawer/app-drawer.js';
import '../web_modules/@polymer/app-layout/app-header-layout/app-header-layout.js';
import '../web_modules/@polymer/app-layout/app-header/app-header.js';
import '../web_modules/@polymer/app-layout/app-toolbar/app-toolbar.js';
import '../web_modules/@polymer/paper-toast/paper-toast.js';
import '../web_modules/@advanced-rest-client/arc-info-messages/arc-info-messages.js';
import '../web_modules/@polymer/iron-media-query/iron-media-query.js';
import '../web_modules/@api-components/api-candidates-dialog/api-candidates-dialog.js';
// import '../web_modules/@advanced-rest-client/arc-onboarding/arc-onboarding.js';
import './electron-http-transport/electron-http-transport.js';
import styles from './AppStyles.js';
import poweredIcon from './poweredby.js';
window.PouchDB = PouchDB;
window.PouchQuickSearch = PouchQuickSearch;
window.marked = marked;
window.Jexl = Jexl;
/* eslint-disable max-len */
/**
 * Main component for ARC electron app.
 *
 * @appliesMixin ArcAppMixin
 */
class ArcElectron extends ArcAppMixin(LitElement) {
  static get styles() {
    return styles;
  }

  static get properties() {
    return {
      /**
       * When true it is rendering API console view.
       */
      isApiConsole: { type: Boolean },
    };
  }

  get apic() {
    return this.shadowRoot.querySelector('#apic');
  }

  constructor() {
    super();
    this._openExternalHandler = this._openExternalHandler.bind(this);
    this._copyContentHandler = this._copyContentHandler.bind(this);
    this._exchangeAssetHandler = this._exchangeAssetHandler.bind(this);
    this._activeThemeHandler = this._activeThemeHandler.bind(this);
    /* global log */
    this.log = log;
    this.sysVars = process.env;
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('open-external-url', this._openExternalHandler);
    window.addEventListener('content-copy', this._copyContentHandler);
    window.addEventListener('theme-activated', this._activeThemeHandler);
    this.addEventListener('process-exchange-asset-data', this._exchangeAssetHandler);
  }

  firstUpdated() {
    super.firstUpdated();
    setTimeout(() => {
      this._variablesButton = this.shadowRoot.querySelector('#varToggleButton');
      this._scrollTarget = this.shadowRoot.querySelector('#scrollingRegion').$.contentContainer;
    });
  }

  _routeDataChanged() {
    switch (this.page) {
      case 'api-console': this._setupApiConsole(this.routeParams); break;
      default: super._routeDataChanged();
    }
  }

  async _pageChanged(page) {
    let id;
    let path;
    let scope;
    switch (page) {
      case 'api-console':
        await this._loadApic()
        return;
      case 'about':
        id = 'about-arc-electron';
        path = 'about-arc-electron/about-arc-electron';
        scope = '@advanced-rest-client';
        break;
      case 'exchange-search':
        id = 'exchange-search-panel';
        path = 'exchange-search-panel/exchange-search-panel';
        scope = '@advanced-rest-client';
        break;
      case 'rest-projects':
        id = 'rest-apis-list-panel';
        path = 'rest-apis-list-panel/rest-apis-list-panel';
        scope = '@advanced-rest-client';
        break;
      case 'themes-panel':
        id = 'themes-panel';
        path = 'themes-panel/themes-panel';
        scope = '@advanced-rest-client';
        break;
      case 'hosts-rules':
        id = 'host-rules-editor';
        path = 'host-rules-editor/host-rules-editor';
        scope = '@advanced-rest-client';
        break;
    }
    if (id) {
      const cls = window.customElements.get(id);
      if (cls) {
        return;
      }
      try {
        await this._loadComponent(path, scope)
      } catch (cmp) {
        this._reportComponentLoadingError(cmp);
      }
    } else {
      await super._pageChanged(page);
    }
  }

  _openWebUrlHandler(e) {
    ipc.send('open-web-url', e.detail.url, e.detail.purpose);
  }

  _requestAuthToken(interactive, scope) {
    if (this.__requestingToken) {
      return;
    }
    this.__requestingToken = true;
    /* global ipc */
    ipc.send('oauth-2-get-token', {
      interactive: interactive,
      scopes: scope
    });
    const context = this;
    let rejected;
    function resolved(sender, token) {
      const tokenValue = token ? token.accessToken : undefined;
      context.__requestingToken = false;
      ipc.removeListener('oauth-2-token-ready', resolved);
      ipc.removeListener('oauth-2-token-error', rejected);
      context.dispatchEvent(new CustomEvent('google-signin-success', {
        composed: true,
        cancelable: true,
        bubbles: true,
        detail: {
          scope: scope,
          token: tokenValue
        }
      }));
      context.driveAccessToken = tokenValue;
    }
    rejected = function() {
      context.__requestingToken = false;
      ipc.removeListener('oauth-2-token-ready', resolved);
      ipc.removeListener('oauth-2-token-error', rejected);
      context.dispatchEvent(new CustomEvent('google-signout', {
        composed: true,
        cancelable: true,
        bubbles: true,
        detail: {
          scope: scope
        }
      }));
    };
    ipc.on('oauth-2-token-ready', resolved);
    ipc.on('oauth-2-token-error', rejected);
  }
  /**
   * Handles `open-external-url` event from ARC components.
   * @param {CustomEvent} e
   */
  _openExternalHandler(e) {
    e.preventDefault();
    /* global ipcRenderer */
    ipcRenderer.send('open-external-url', e.detail.url);
  }
  /**
   * Handles new window open request.
   */
  onNewWindow() {
    ipcRenderer.send('new-window');
  }
  /**
   * Handles `clipboard-copy` event from ARC components.
   * The `clipboard` api is loaded in the preload script.
   *
   * @param {CustomEvent} e
   */
  _copyContentHandler(e) {
    /* global clipboard */
    clipboard.writeText(e.detail.value);
    e.preventDefault();
  }
  /**
   * Installs pading update.
   */
  updateInstall() {
    ipcRenderer.send('install-update');
  }

  notifyError(message) {
    const toast = this.shadowRoot.querySelector('#errorToast');
    toast.text = message;
    toast.opened = true;
  }
  /**
   * Handler for `popup-menu`. Sends command to the IO process.
   * IO process informs windows to hide the menu.
   * @param {CustomEvent} e
   */
  _popupMenuHandler(e) {
    const { type } = e.detail;
    let sizing;
    const menu = this.shadowRoot.querySelector('arc-menu');
    if (menu) {
      const rect = menu.getBoundingClientRect();
      sizing = {
        height: rect.height,
        width: rect.width
      };
    }
    ipcRenderer.send('popup-app-menu', type, sizing);
  }

  processExternalFile(file) {
    if (!file) {
      throw new Error('"file" argument is required.');
    }
  }
  /**
   * Opens onboarding element.
   */
  openOnboarding() {
    const node = this.shadowRoot.querySelector('arc-onboarding');
    node.opened = true;
  }

  _narrowHandler(e) {
    this.narrow = e.detail.value;
  }

  async _setupApiConsole(params) {
    if (!params) {
      return;
    }
    const { id, version } = params;
    if (!id) {
      return;
    }
    try {
      await this._loadApic();
      // this.apiSelected = undefined;
      // this.apiSelectedType = undefined;
      this.isApiConsole = true;
      await this.apic.open(id, version);
      this.apiSelected = 'summary';
      this.apiSelectedType = 'summary';
    } catch (e) {
      this.apiProcessing = false;
      this.isApiConsole = false;
      this.notifyError(e.message);
    }
  }

  async _loadApic() {
    try {
      this.page = 'api-console';
      await import('./apic-electron/apic-electron.js');
      this._loadingSources = false;
    } catch (cause) {
      this._loadingSources = false;
      this._reportComponentLoadingError('apic-electron');
      throw cause;
    }
  }

  async _setApiData(api, type) {
    await this._loadApic();
    const apic = this.apic;
    apic.unresolvedAmf = api;
    apic.apiType = type;
    this.isApiConsole = (true);
    this.apiSelected = undefined;
    this.apiSelectedType = undefined;
    setTimeout(() => {
      this.apiSelected = 'summary';
      this.apiSelectedType = 'summary';
    });
  }

  async _exchangeAssetHandler(e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    const asset = e.detail;
    let file;
    const types = ['fat-raml', 'raml', 'oas'];
    for (let i = 0, len = asset.files.length; i < len; i++) {
      if (types.indexOf(asset.files[i].classifier) !== -1) {
        file = asset.files[i];
        break;
      }
    }
    if (!file || !file.externalLink) {
      this.notifyError('RAML data not found in the asset.');
      return;
    }
    try {
      await this._loadApic();
      const e = this._dispatchExchangeApiEvent(file);
      if (!e.defaultPrevented) {
        this.notifyError('API data processor not found.');
        return;
      }
      this.isApiConsole = true;
      this.apiProcessing = true;
      this._dispatchNavigate({
        base: 'api-console'
      });
      const api = await e.detail.result;
      this._setApiData(api.model, api.type.type);
    } catch (cause) {
      this.notifyError(cause.message);
    }
  }

  _dispatchExchangeApiEvent(file) {
    const e = new CustomEvent('api-process-link', {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: {
        url: file.externalLink,
        mainFile: file.mainFile,
        md5: file.md5,
        packaging: file.packaging
      }
    });
    this.dispatchEvent(e);
    return e;
  }

  _apiVersionMenuChanged(e) {
    const { value } = e.detail;
    if (!value) {
      return;
    }
    const id = this.apiInfo._id;
    const params = {
      id,
      version: value
    };
    this._setupApiConsole(params);
  }

  /**
   * Closes API console view
   */
  closeApiConsole() {
    this.isApiConsole = (false);
    this.page = 'exchange-search';
  }

  /**
   * Handler for the "back" icon click in main navigation.
   */
  _backHandler() {
    if (this.isApiConsole) {
      this.isApiConsole = false;
    }
    super._backHandler();
  }
  /**
   * Saves current API.
   */
  saveApi() {
    this.apic.save();
  }

  async _apiActionMenuChanged(e) {
    const selected = e.detail.value;
    if (selected === undefined || selected === -1) {
      return;
    }
    const { target } = e;
    const item = target.selectedItem;
    const action = item.dataset.action;
    const apic = this.apic;
    switch (action) {
      case 'delete':
        await apic.delete();
        break;
      case 'delete-version':
        await apic.deleteVersion(this.apiVersion);
        break;
      case 'save-oas':
        apic.saveAs('oas');
        break;
      case 'save-raml':
        apic.saveAs('raml');
        break;
      case 'upload-exchange':
        this.log.info('Not yet supported.');
        break;
    }
    target.selected = undefined;
  }

  _exchangeTokenHandler(e) {
    e.detail.clientSecret = '5d02cE95028E4Dc08A40907a0A4883fC';
  }

  _apiPropertyHandler(e) {
    const { value } = e.detail;
    switch (e.type) {
      case 'apiprocessing-changed':
        this.apiProcessing = value;
        break;
      case 'apiversion-changed':
        this.apiVersion = value;
        break;
      case 'apiinfo-changed':
        this.apiInfo = value;
        break;
      case 'versions-changed':
        this.apiVersions = value;
        break;
      case 'multiversion-changed':
        this.apiMultiVersionVersion = value;
        break;
      case 'saved-changed':
        this.apiIsSaved = value;
        break;
      case 'cansave-changed':
        this.canSaveApi = value;
        break;
      case 'versionsaved-changed':
        this.apiVersionSaved = value;
        break;
    }
    this.requestUpdate();
  }
  /**
   * Initialized the tutorial if needed.
   */
  async initTutorial() {
    const major = versionInfo.appVersion.split('.')[0];
    const cnf = this.config;
    const passed = cnf.finishedOnboarding || [];
    if (passed.indexOf(major) !== -1) {
      return;
    }
    try {
      await this._loadComponent('arc-onboarding/arc-onboarding', '@advanced-rest-client');
    } catch (cmp) {
      this.log.error(`Unable to load ${cmp}`);
      return;
    }
    const element = document.createElement('arc-onboarding');
    element.addEventListener('tutorial-close', this._finalizeTutorial.bind(this));
    element.dataset.major = major;
    document.body.appendChild(element);
    element.opened = true;
  }

  _finalizeTutorial(e) {
    const cnf = this.config;
    const passed = cnf.finishedOnboarding || [];
    passed.push(e.target.dataset.major);
    const ev = new CustomEvent('settings-changed', {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: {
        name: 'finishedOnboarding',
        value: passed
      }
    });
    this.dispatchEvent(ev);
  }

  _activeThemeHandler(e) {
    if (e.detail === 'advanced-rest-client/arc-electron-anypoint-theme') {
      if (!this.compatibility) {
        this.compatibility = true;
      }
    } else {
      if (this.compatibility) {
        this.compatibility = false;
      }
    }
  }

  render() {
    const {
      narrowLayout,
      appMenuDisabled,
      messageCenterOpened,
      appMessages
    } = this;
    return html`
    ${this.modelsTemplate()}
    ${this.importExportTemplate({ electron: true })}
    ${this.requestLogicTemplate()}
    ${this.variablesLogicTemplate()}
    ${this.appMessagesLogicTemplate('electron')}

    <app-drawer-layout fullbleed ?narrow="${narrowLayout}" ?force-narrow="${appMenuDisabled}" responsive-width="980px">
      <app-drawer slot="drawer" align="start">
        ${this.menuTemplate()}
      </app-drawer>
      <app-drawer
        slot="drawer"
        align="end"
        .opened="${messageCenterOpened}"
        class="info-center-drawer"
      >
        <arc-info-messages
          .messages="${appMessages}"
          @close="${this.closeInfoCenter}"
        ></arc-info-messages>
      </app-drawer>

      <app-header-layout has-scrolling-region id="scrollingRegion">
        <app-header slot="header" fixed shadow scroll-target="scrollingRegion">
          <app-toolbar>
            ${this.mainToolbarTemplate()}
          </app-toolbar>
        </app-header>
        <div class="pages">
          ${this.workspaceTemplate()}
          ${this._pageTemplate()}
        </div>
      </app-header-layout>
    </app-drawer-layout>
    <iron-media-query query="(max-width: 700px)" @query-matches-changed="${this._narrowHandler}"></iron-media-query>
    ${this.variablesDrawerTemplate()}
    ${this._analyticsTemplate()}
    ${this.licenseTemplate()}
    ${this.apiCandidatedViewTemplate()}
    <arc-onboarding></arc-onboarding>
    <paper-toast id="errorToast" duration="5000"></paper-toast>`;
  }

  _pageTemplate() {
    const {
      page
    } = this;

    switch (page) {
      case 'settings': return this.settingsViewTemplate({ hasExperiments: true, restApis: true });
      case 'about': return this.aboutViewTemplate();
      case 'api-console': return this.apicViewTemplate();
      case 'exchange-search': return this.exchangeViewTemplate();
      case 'rest-projects': return this.restApisViewTemplate({ explore: true });
      case 'hosts-rules': return this.hostsViewTemplate();
      case 'themes-panel': return this.themesViewTemplate();
      default: return super._pageTemplate();
    }
  }

  aboutViewTemplate() {
    const {
      compatibility,
      outlined
    } = this;
    return html`
    <about-arc-electron
      ?compatibility="${compatibility}"
      ?outlined="${outlined}"
      .appVersion="${this.appVersion}"
    ></about-arc-electron>`;
  }

  apicViewTemplate() {
    const {
      compatibility,
      outlined,
      _oauth2redirectUri,
      apiSelected,
      apiSelectedType,
      narrow,
      _scrollTarget
    } = this;
    return html`
    <apic-electron
      data-page="docs"
      aware="apic"
      id="apic"
      ?compatibility="${compatibility}"
      ?outlined="${outlined}"
      .selected="${apiSelected}"
      .selectedType="${apiSelectedType}"
      handlenavigationevents
      inlinemethods
      ?narrow="${narrow}"
      .redirectUri="${_oauth2redirectUri}"
      .scrollTarget="${_scrollTarget}"
      .saved="${this.apiIsSaved}"
      .versions="${this.apiVersions}"
      .apiVersion="${this.apiVersion}"
      .canSave="${this.canSaveApi}"
      .versionSaved="${this.apiVersionSaved}"
      .multiVersion="${this.apiMultiVersionVersion}"
      ?apiProcessing="${this.apiProcessing}"

      @apiprocessing-changed="${this._apiPropertyHandler}"
      @apiversion-changed="${this._apiPropertyHandler}"
      @apiinfo-changed="${this._apiPropertyHandler}"
      @versions-changed="${this._apiPropertyHandler}"
      @multiversion-changed="${this._apiPropertyHandler}"
      @saved-changed="${this._apiPropertyHandler}"
      @cansave-changed="${this._apiPropertyHandler}"
      @versionsaved-changed="${this._apiPropertyHandler}"
    ></apic-electron>`;
  }

  exchangeViewTemplate() {
    const {
      compatibility,
      outlined,
      _scrollTarget
    } = this;
    return html`<exchange-search-panel
      .scrollTarget="${_scrollTarget}"
      ?compatibility="${compatibility}"
      ?outlined="${outlined}"
      anypointauth
      columns="auto"
      exchangeredirecturi="https://auth.advancedrestclient.com/"
      exchangeclientid="2dc40927457042b5862864c3c97737d7"
      forceoauthevents
      @oauth2-token-requested="${this._exchangeTokenHandler}"
    ></exchange-search-panel>`;
  }

  hostsViewTemplate() {
    const {
      compatibility,
      outlined
    } = this;
    return html`<host-rules-editor
    ?compatibility="${compatibility}"
    ?outlined="${outlined}"
    ></host-rules-editor>`;
  }

  themesViewTemplate() {
    const {
      compatibility,
      outlined
    } = this;
    return html`<themes-panel
    addenabled
    ?compatibility="${compatibility}"
    ?outlined="${outlined}"
    ></themes-panel>`;
  }

  requestLogicTemplate() {
    const config = this.config || {};
    return html`
    ${super.requestLogicTemplate()}
    <electron-http-transport
      ?followredirects="${config.followRedirects}"
      ?defaultHeaders="${config.defaultHeaders}"
      .requestTimeout="${config.requestDefaultTimeout}"
      ?nativeTransport="${config.nativeTransport}"
      ?validateCertificates="${config.validateCertificates}"
      .sentMessageLimit="${config.sentMessageLimit}"
    ></electron-http-transport>`;
  }

  _appToolbarEnvTemplate() {
    if (this.isApiConsole) {
      return this._apiConsoleToolbarTemplate();
    }
    return super._appToolbarEnvTemplate();
  }

  _apiConsoleToolbarTemplate() {
    const {
      apiIsSaved,
      canSaveApi,
      apiMultiVersionVersion,
      apiVersionSaved,
      compatibility,
      outlined
    } = this;
    const renderSave = !apiIsSaved && !!canSaveApi;
    const renderMultiVersion = !!apiIsSaved && !!apiMultiVersionVersion;
    const apiVersions = this.apiVersions || [];
    const renderSaveVersion = !!canSaveApi && !renderSave && !apiVersionSaved;
    return html`
    ${renderSave ? html`
      <anypoint-button
        class="toolbar-button"
        emphasis="high"
        @click="${this.saveApi}"
        ?compatibility="${compatibility}"
      >Save API</anypoint-button>
    ` : ''}
    ${renderMultiVersion ? html`
      <anypoint-dropdown-menu
        class="api-version-selector"
        ?compatibility="${compatibility}"
        ?outlined="${outlined}">
        <label slot="label">API version</label>
        <anypoint-listbox
          id="apiVersionSelector"
          slot="dropdown-content"
          .selected="${this.apiVersion}"
          attrforselected="data-version"
          @selected-changed="${this._apiVersionMenuChanged}"
          ?compatibility="${compatibility}"
        >
          ${apiVersions.map((item) => html`
            <anypoint-item data-version="${item}" ?compatibility="${compatibility}">${item}</anypoint-item>
          `)}
        </anypoint-listbox>
      </anypoint-dropdown-menu>` : ''}
    ${renderSaveVersion ? html`
      <anypoint-button
        class="toolbar-button"
        emphasis="high"
        @click="${this.saveApi}"
        ?compatibility="${compatibility}"
      >Save API version</anypoint-button>
      ` : ''}
    ${apiIsSaved ? html`
    <anypoint-menu-button
      verticalalign="top"
      horizontalalign="auto">
      <anypoint-icon-button slot="dropdown-trigger" ?compatibility="${compatibility}">
        <span class="icon">${moreVert}</span>
      </anypoint-icon-button>
      <anypoint-listbox
        slot="dropdown-content"
        @selected-changed="${this._apiActionMenuChanged}"
        ?compatibility="${compatibility}"
      >
        <anypoint-item data-action="delete">Delete API</anypoint-item>
        ${apiMultiVersionVersion ? html`
          <anypoint-item data-action="delete-version">Delete version</anypoint-item>
        ` : ''}
        <!-- <anypoint-item data-action="save-oas">Save as OAS</anypoint-item>
        <anypoint-item data-action="save-raml">Save as RAML</anypoint-item> -->
        <!-- <anypoint-item data-action="upload-exchange">Upload to Exchange</anypoint-item> -->
      </anypoint-listbox>
    </anypoint-menu-button>` : ''}
    `;
  }

  menuTemplate() {
    // const { isApiConsole } = this;
    // return isApiConsole ? this.apicNavigationTemplate() : this.arcNavigationTemplate();
    if (this.isApiConsole) {
      return this.apicNavigationTemplate();
    }
    return super.menuTemplate();
  }

  apicNavigationTemplate() {
    const {
      compatibility,
      apiProcessing,
      apiSelected,
      apiSelectedType
    } = this;
    return html`<div class="api-navigation">
      <api-navigation
        aware="apic"
        summary
        endpointsopened
        ?compatibility="${compatibility}"
        ?hidden="${apiProcessing}"
        .selected="${apiSelected}"
        .selectedType="${apiSelectedType}"
      ></api-navigation>
      ${apiProcessing ? html`<div class="api-navigation-loader">
        <p>Loading the API</p>
      </div>` : ''}
      <div class="powered-by">
        <a href="https://github.com/mulesoft/api-console" class="attribution" target="_blank">
          ${poweredIcon}
        </a>
      </div>
    </div>`;
  }

  apiCandidatedViewTemplate(opts) {
    const {
      compatibility
    } = this;
    return html`<api-candidates-dialog
      ?compatibility="${compatibility}"
    ></api-candidates-dialog>`;
  }
}
window.customElements.define('arc-electron', ArcElectron);
