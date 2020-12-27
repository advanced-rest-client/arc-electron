/* eslint-disable no-unused-vars */
import { ApplicationPage } from '../ApplicationPage.js';
import { html } from '../../../web_modules/lit-html/lit-html.js';
import '../../../web_modules/@anypoint-web-components/anypoint-dropdown-menu/anypoint-dropdown-menu.js';
import '../../../web_modules/@anypoint-web-components/anypoint-listbox/anypoint-listbox.js';
import '../../../web_modules/@anypoint-web-components/anypoint-item/anypoint-item.js';
import '../../../web_modules/@anypoint-web-components/anypoint-item/anypoint-icon-item.js';
import '../../../web_modules/@anypoint-web-components/anypoint-input/anypoint-input.js';
import '../../../web_modules/@anypoint-web-components/anypoint-switch/anypoint-switch.js';
import '../../../web_modules/@advanced-rest-client/arc-icons/arc-icon.js';

/** @typedef {import('@advanced-rest-client/arc-types').Themes.InstalledTheme} InstalledTheme */
/** @typedef {import('@anypoint-web-components/anypoint-listbox').AnypointListbox} AnypointListbox */
/** @typedef {import('lit-html').TemplateResult} TemplateResult */

/* global ThemeManager, logger */

const defaultTheme = '@advanced-rest-client/arc-electron-default-theme';

export class ThemesScreen extends ApplicationPage {
  /**
   * @return {Boolean} `true` if selected theme is one of default themes.
   */
  get isDefaultTheme() {
    const { themes, activeTheme } = this;
    if (!themes || !activeTheme || !themes.length) {
      return true;
    }
    const item = themes.find((info) => info.name === activeTheme);
    if (!item) {
      return false;
    }
    if (typeof item.isDefault !== 'boolean') {
      return false;
    }
    return item.isDefault;
  }

  constructor() {
    super();

    this.initObservableProperties(
      'themes', 'activeTheme', 'installPending', 'compatibility',
      'ignoreSystemPreference',
    );
    this.compatibility = false;
    this.installPending = false;
    this.ignoreSystemPreference = false;
    /**
     * @type {string}
     */
    this.activeTheme = undefined;
    /**
     * @type {InstalledTheme[]}
     */
    this.themes = undefined;
    this.logger = logger;
    this.manager = new ThemeManager();

    this.installThemeName = '';
  }

  async initialize() {
    await this.refresh();
    await this.loadTheme();
    this.render();
  }

  async refresh() {
    const info = await this.manager.readState();
    if (!info) {
      this.reportCriticalError('Unable to read application themes list.');
      return;
    }
    const { kind, themes, active, ignoreSystemPreference } = info;
    if (kind !== 'ARC#ThemeInfo') {
      this.reportCriticalError('Unknown themes settings format.');
      return;
    }
    this.themes = themes;
    this.activeTheme = active || defaultTheme;
    this.compatibility = this.activeTheme === '@advanced-rest-client/arc-electron-anypoint-theme';
    this.ignoreSystemPreference = ignoreSystemPreference || false;
  }

  /**
   * Loads the current theme.
   */
  async loadTheme() {
    const search = new URLSearchParams(window.location.search);
    const dt = search.get('darkMode');
    const hasSystemDarkMode = dt === 'true';
    let theme = this.activeTheme;
    if (hasSystemDarkMode && !this.ignoreSystemPreference) {
      theme = ThemeManager.darkTheme;
    }
    try {
      await this.manager.loadTheme(theme);
    } catch (e) {
      this.logger.error(e);
    }
  }

  /**
   * Handler for the dropdown selection event. Activates the selected theme.
   * @param {Event} e
   */
  async _selectionHandler(e) {
    const list = /** @type AnypointListbox */ (e.target);
    const { selected } = list;
    if (selected === this.activeTheme) {
      return;
    }
    const index = this.themes.findIndex((i) => i.name === selected);
    if (index === -1) {
      return;
    }
    this.activeTheme = String(selected);
    await this.manager.activate(this.activeTheme);
    this.manager.loadTheme(this.activeTheme);
    this.compatibility = this.activeTheme === '@advanced-rest-client/arc-electron-anypoint-theme';
  }

  _themeNameHandler(e) {
    this.installThemeName = e.target.value;
  }

  async _installHandler() {
    const { installThemeName } = this;
    if (!installThemeName) {
      return;
    }
    this.installPending = true;
    try {
      await this.manager.installTheme(installThemeName);
      await this.refresh();
      await this.manager.loadTheme(this.activeTheme);
    } catch (e) {
      this.reportCriticalError(e.message);
    }
    this.installPending = false;
  }

  async _uninstallHandler() {
    if (this.isDefaultTheme) {
      this.reportCriticalError('Refusing to delete a default theme');
      return;
    }
    this.installPending = true;
    try {
      await this.manager.uninstallTheme(this.activeTheme);
      await this.manager.activate(defaultTheme);
      await this.refresh();
      await this.manager.loadTheme(this.activeTheme);
    } catch (e) {
      this.reportCriticalError(e.message);
    }
    this.installPending = false;
  }

  async _ignoreSysPrefChange(e) {
    const {checked} = e.target;
    if (checked === this.ignoreSystemPreference) {
      return;
    }
    this.ignoreSystemPreference = checked;
    try {
      await this.manager.setIgnoreSystemPreferences(checked);
    } catch (error) {
      this.reportCriticalError(error.message);
      this.ignoreSystemPreference = !checked;
    }
  }

  appTemplate() {
    return html`
    ${this.headerTemplate()}
    <section class="themes-content">
      ${this.selectorTemplate()}
      ${this.ignoreSystemPrefsTemplate()}
      ${this.addTemplate()}
    </section>
    `;
  }

  headerTemplate() {
    return html`<header><h2 class="title">Themes</h2></header>`;
  }

   /**
   * @returns {TemplateResult} The template for the drop down selector with the remove option.
   */
  selectorTemplate() {
    return html`
    <section class="theme-selector">
      <div class="selection-actions">
        ${this.selectionDropdownTemplate()}
        ${this.removeThemeTemplate()}
      </div>
    </section>`;
  }

  /**
   * @returns {TemplateResult} The template for the drop down selector.
   */
  selectionDropdownTemplate() {
    const { compatibility, activeTheme, themes=[] } = this;
    return html`
    <anypoint-dropdown-menu
      ?compatibility="${compatibility}"
      horizontalAlign="left"
      fitPositionTarget
    >
      <label slot="label">Active theme</label>
      <anypoint-listbox
        slot="dropdown-content"
        ?compatibility="${compatibility}"
        attrForSelected="data-id"
        attrForItemTitle="data-label"
        .selected="${activeTheme}"
        @selected="${this._selectionHandler}"
      >
        ${themes.map((item) => this.selectionItemTemplate(item))}
      </anypoint-listbox>
    </anypoint-dropdown-menu>`;
  }

  /**
   * @param {InstalledTheme} item
   * @returns {TemplateResult} The template for the drop down item.
   */
  selectionItemTemplate(item) {
    const title = item.title || item.name;
    return html`
    <anypoint-item
        data-id="${item.name}"
        data-label="${title}"
        ?compatibility="${this.compatibility}"
      >
        <anypoint-item-body ?twoLine="${!!item.description}">
          <div>${title}</div>
          ${item.description ? html`<div secondary>${item.description}</div>` : ''}
        </anypoint-item-body>
      </anypoint-item>
    `;
  }

  /**
   * @returns {TemplateResult|string} The template for the uninstall icon
   */
  removeThemeTemplate() {
    if (this.isDefaultTheme) {
      return '';
    }
    const { compatibility } = this;
    return html`
    <anypoint-icon-button
      class="action-icon"
      data-action="delete"
      title="Remove theme from ARC"
      aria-label="Activate to remove the theme"
      @click="${this._uninstallHandler}"
    >
      <arc-icon icon="deleteIcon"></arc-icon>
    </anypoint-icon-button>`;
  }

  ignoreSystemPrefsTemplate() { 
    const { ignoreSystemPreference } = this;
    return html`
    <div class="ignore-system-prefs">
      <anypoint-switch .checked="${ignoreSystemPreference}" @change="${this._ignoreSysPrefChange}">
        Ignore system preferences
      </anypoint-switch>
    </div>
    `;
  }

  /**
   * @returns {TemplateResult|string} The template for the install section
   */
  addTemplate() {
    const { compatibility, installPending } = this;
    return html`
    <section class="add-theme">
      <h3>Install theme</h3>
      <p>
        Install new theme by providing its NPM name, GitHub repository as
        <code>owner/name#branch</code>,
        or absolute path to the theme on your local filesystem.
      </p>
      <div class="add-form">
        <anypoint-input
          ?compatibility="${compatibility}"
          ?disabled="${installPending}"
          .value="${this.installThemeName}"
          @change="${this._themeNameHandler}"
        >
          <label slot="label">Theme to install</label>
        </anypoint-input>
        <anypoint-button
          ?disabled="${installPending}"
          @click="${this._installHandler}"
        >Install</anypoint-button>
      </div>
      <progress ?hidden="${!installPending}"></progress>
    </section>
    `;
  }
}

const page = new ThemesScreen();
page.initialize();
