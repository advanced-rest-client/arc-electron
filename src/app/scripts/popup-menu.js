/* eslint-disable no-unused-vars */
import './pouchdb.js';
import { ApplicationPage } from '../ApplicationPage.js';
import { html } from '../../../web_modules/lit-html/lit-html.js';
import { ArcNavigationEventTypes, ProjectActions, ConfigEventTypes } from '../../../web_modules/@advanced-rest-client/arc-events/index.js';
import '../../../web_modules/@anypoint-web-components/anypoint-dropdown-menu/anypoint-dropdown-menu.js';
import '../../../web_modules/@anypoint-web-components/anypoint-listbox/anypoint-listbox.js';
import '../../../web_modules/@anypoint-web-components/anypoint-item/anypoint-item.js';
import '../../../web_modules/@anypoint-web-components/anypoint-item/anypoint-icon-item.js';
import '../../../web_modules/@anypoint-web-components/anypoint-input/anypoint-input.js';
import '../../../web_modules/@advanced-rest-client/arc-icons/arc-icon.js';
import '../../../web_modules/@advanced-rest-client/arc-menu/history-menu.js';
import '../../../web_modules/@advanced-rest-client/arc-menu/projects-menu.js';
import '../../../web_modules/@advanced-rest-client/arc-menu/rest-api-menu.js';
import '../../../web_modules/@advanced-rest-client/arc-menu/saved-menu.js';
import '../../../web_modules/@advanced-rest-client/arc-menu/arc-menu.js';
import '../../../web_modules/@advanced-rest-client/arc-models/project-model.js';
import '../../../web_modules/@advanced-rest-client/arc-models/request-model.js';
import '../../../web_modules/@advanced-rest-client/arc-models/rest-api-model.js';

/** @typedef {import('@advanced-rest-client/arc-events').ConfigStateUpdateEvent} ConfigStateUpdateEvent */
/** @typedef {import('@advanced-rest-client/arc-events').ARCRequestNavigationEvent} ARCRequestNavigationEvent */
/** @typedef {import('@advanced-rest-client/arc-events').ARCProjectNavigationEvent} ARCProjectNavigationEvent */
/** @typedef {import('@advanced-rest-client/arc-events').ARCNavigationEvent} ARCNavigationEvent */
/** @typedef {import('lit-html').TemplateResult} TemplateResult */

/* global ThemeManager, PreferencesProxy, logger, ipc */

const configStateChangeHandler = Symbol('configStateChangeHandler');
const navigateRequestHandler = Symbol('navigateRequestHandler');
const navigateProjectHandler = Symbol('navigateProjectHandler');
const navigateHandler = Symbol('navigateHandler');

class ArcMenuScreen extends ApplicationPage {
  constructor() {
    super();

    this.initObservableProperties(
      'compatibility', 'listType', 'type', 'historyEnabled'
    );
    this.compatibility = false;
    /**
     * @type {ThemeManager}
     */
    this.themeProxy = new ThemeManager();
    /**
     * @type {PreferencesProxy}
     */
    this.settings = new PreferencesProxy();
    this.logger = logger;
    this.type = '';
    this.historyEnabled = true;
  }

  async initialize() {
    const init = this.collectInitOptions();
    if (!init.type) {
      this.reportCriticalError('Unknown menu type');
      return;
    }
    this.type = init.type;
    this.themeProxy.listen();
    this.settings.observe();
    await this.loadTheme();
    window.addEventListener('themeactivated', (e) => {
      // @ts-ignore
      this.compatibility = e.detail === ThemeManager.anypointTheme;
    });
    window.addEventListener(ConfigEventTypes.State.update, this[configStateChangeHandler].bind(this));
    const settings = await this.settings.read();
    if (settings.view && settings.view.listType) {
      this.listType = settings.view.listType;
    }
    if (settings.history && typeof settings.history.enabled === 'boolean') {
      this.historyEnabled = settings.history.enabled;
    }
    window.addEventListener(ArcNavigationEventTypes.navigateRequest, this[navigateRequestHandler].bind(this));
    window.addEventListener(ArcNavigationEventTypes.navigateProject, this[navigateProjectHandler].bind(this));
    window.addEventListener(ArcNavigationEventTypes.navigate, this[navigateHandler].bind(this));
  }

  /**
   * Loads the current theme.
   */
  async loadTheme() {
    const info = await this.themeProxy.readActiveThemeInfo();
    try {
      const id = info && info.name;
      await this.themeProxy.loadTheme(id);
      this.compatibility = id === ThemeManager.anypointTheme;
    } catch (e) {
      this.logger.error(e);
    }
  }

  /**
   * @returns {any} The init options of this browser process.
   */
  collectInitOptions() {
    const search = new URLSearchParams(window.location.search);
    const result = {};
    const dt = search.get('darkMode');
    if (dt) {
      result.darkMode = dt === 'true';
    }
    const type = search.get('type');
    if (type) {
      result.type = type;
    }
    return result;
  }

  /**
   * @param {ConfigStateUpdateEvent} e
   */
  [configStateChangeHandler](e) {
    const { key, value } = e.detail;
    if (key === 'view.listType') {
      this.listType = value;
    } if (key === 'history.enabled') {
      this.historyEnabled = value;
    }
  }

  /**
   * @param {ARCRequestNavigationEvent} e 
   */
  [navigateRequestHandler](e) {
    const { requestId, requestType, action } = e;
    ipc.send('popup-app-menu-nav', 'request', requestId, requestType, action);

  }

  /**
   * @param {ARCProjectNavigationEvent} e
   */
  [navigateProjectHandler](e) {
    const { id, action, route } = e;
    ipc.send('popup-app-menu-nav', 'project', id, action, route);
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
    if (allowed.includes(e.route)) {
      ipc.send('popup-app-menu-nav', 'navigate', e.route);
    }
  }

  appTemplate() {
    const { type } = this;
    switch (type) {
      case 'history-menu': return this.historyTemplate();
      case 'saved-menu': return this.savedTemplate();
      case 'projects-menu': return this.projectsTemplate();
      case 'rest-api-menu': return this.apiDocsTemplate();
      default: return this.allTemplate();
    }
  }

  historyTemplate() {
    const { listType } = this;
    return html`<history-menu .listType="${listType}"></history-menu>`;
  }

  savedTemplate() {
    const { listType } = this;
    return html`<saved-menu .listType="${listType}"></saved-menu>`;
  }

  projectsTemplate() {
    const { listType } = this;
    return html`<projects-menu .listType="${listType}"></projects-menu>`;
  }

  apiDocsTemplate() {
    const { listType } = this;
    return html`<rest-api-menu .listType="${listType}"></rest-api-menu>`;
  }

  allTemplate() {
    const { listType, historyEnabled } = this;
    return html`<arc-menu .listType="${listType}" ?history="${historyEnabled}"></arc-menu>`;
  }
}

const instance = new ArcMenuScreen();
instance.initialize();
