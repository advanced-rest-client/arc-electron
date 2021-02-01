/* eslint-disable no-param-reassign */
import { ApplicationPage } from '../ApplicationPage.js';
import { html } from '../../../web_modules/lit-html/lit-html.js';
import '../../../web_modules/@polymer/font-roboto-local/roboto.js';
import '../../../web_modules/@anypoint-web-components/anypoint-dropdown-menu/anypoint-dropdown-menu.js';
import '../../../web_modules/@anypoint-web-components/anypoint-listbox/anypoint-listbox.js';
import '../../../web_modules/@anypoint-web-components/anypoint-item/anypoint-item.js';
import '../../../web_modules/@anypoint-web-components/anypoint-item/anypoint-item-body.js';
import '../../../web_modules/@anypoint-web-components/anypoint-button/anypoint-button.js';
import '../../../web_modules/@anypoint-web-components/anypoint-switch/anypoint-switch.js';
import '../../../web_modules/@advanced-rest-client/arc-icons/arc-icon.js';

/** @typedef {import('lit-html').TemplateResult} TemplateResult */
/** @typedef {import('electron-updater').UpdateInfo} UpdateInfo */
/** @typedef {import('@advanced-rest-client/arc-types').Config.ARCConfig} ARCConfig */
/** @typedef {import('@anypoint-web-components/anypoint-switch').AnypointSwitch} AnypointSwitch */

/* global PreferencesProxy, ThemeManager, logger, ipc, PreferencesProxy */

const checkingUpdateHandler = Symbol('checkingUpdateHandler');
const updateAvailableHandler = Symbol('updateAvailableHandler');
const updateNotAvailableHandler = Symbol('updateNotAvailableHandler');
const updateErrorHandler = Symbol('updateErrorHandler');
const downloadingHandler = Symbol('downloadingHandler');
const downloadedHandler = Symbol('downloadedHandler');

class AboutDialog extends ApplicationPage {
  settings = new PreferencesProxy();

  themeProxy = new ThemeManager();

  get updateDownloaded() {
    return this.updateStatePage === 3;
  }

  get updateProgress() {
    return [1, 2, 3].indexOf(this.updateStatePage) !== -1;
  }

  get isError() {
    return this.updateStatePage === 4;
  }

  get updateLabel() {
    switch (this.updateStatePage) {
      case 1: return html`Checking for update...`;
      case 2: return html`Downloading update...`;
      case 3: return html`Ready to install`;
      case 4: return html`Update error`;
      default: return html`ARC is up to date <span class="heart">❤</span>`;
    }
  }

  constructor() {
    super();

    this.initObservableProperties(
      'autoUpdate', 'updateStatePage', 'errorMessage', 'releaseChannel', 'errorCode',
      'compatibility', 'upgradeInfo'
    );
    this.compatibility = false;

    /**
     * page of the update status label
     */
    this.updateStatePage = 0;
    /** 
     * State of auto update setting.
     */
    this.autoUpdate = false;
    /** 
     * Associated message with current error code.
     * @type {string}
     */
    this.errorMessage = undefined;
    /** 
     * @type {string}
     */
    this.errorCode = undefined;
    /**
     * Current release channel.
     * @type {string}
     */
    this.releaseChannel = 'latest';
    /**
     * Current release channel.
     * @type {UpdateInfo}
     */
    this.upgradeInfo = undefined;
    /**
     * Enables compatibility with Anypoint platform
     */
    this.compatibility = false;
  }

  async initialize() {
    await this.loadTheme();
    let cnf = /** @type ARCConfig */ ({});
    try {
      cnf = await this.settings.read();
    } catch (e) {
      this.reportCriticalError(e);
      throw e;
    }
    const { updater={} } = cnf;
    const { auto, channel } = updater;
    this.releaseChannel = channel || 'latest';
    this.autoUpdate = auto;
    this.listen();
    this.render();
  }

  /**
   * Loads the current theme.
   */
  async loadTheme() {
    try {
      const id = await this.themeProxy.loadApplicationTheme();
      this.compatibility = id === ThemeManager.anypointTheme;
    } catch (e) {
      logger.error(e);
    }
  }

  listen() {
    ipc.on('checking-for-update', this[checkingUpdateHandler].bind(this));
    ipc.on('update-available', this[updateAvailableHandler].bind(this));
    ipc.on('update-not-available', this[updateNotAvailableHandler].bind(this));
    ipc.on('autoupdate-error', this[updateErrorHandler].bind(this));
    ipc.on('download-progress', this[downloadingHandler].bind(this));
    ipc.on('update-downloaded', this[downloadedHandler].bind(this));

    window.addEventListener('themeactivated', (e) => {
      // @ts-ignore
      this.compatibility = e.detail === ThemeManager.anypointTheme;
    });
  }

  [checkingUpdateHandler]() {
    this.updateStatePage = 1;
  }

  /**
   * @param {*} e
   * @param {UpdateInfo} info
   */
  [updateAvailableHandler](e, info) {
    this.upgradeInfo = info;
    if (this.updateStatePage !== 2) {
      this.updateStatePage = 2;
    }
  }

  [updateNotAvailableHandler]() {
    this.updateStatePage = 0;
  }

  /**
   * @param {*} e
   * @param {*} err
   */
  [updateErrorHandler](e, err) {
    this.updateStatePage = 4;
    this.createErrorMessage(err.code, err.message);
    this.errorCode = err.code || undefined;
  }

  [downloadingHandler]() {
    if (this.updateStatePage !== 2) {
      this.updateStatePage = 2;
    }
  }

  [downloadedHandler]() {
    this.updateStatePage = 3;
  }

  /**
   * @param {string=} code
   * @param {string=} message
   */
  createErrorMessage(code, message) {
    switch (code) {
      case 'ERR_UPDATER_INVALID_RELEASE_FEED':
        message = 'Unable to parse releases feed.';
        break;
      case 'ERR_UPDATER_NO_PUBLISHED_VERSIONS':
        message = 'Unable to find published version.';
        break;
      case 'ERR_UPDATER_CHANNEL_FILE_NOT_FOUND':
        message = 'Cannot find latest release information for this platform.';
        break;
      case 'ERR_UPDATER_LATEST_VERSION_NOT_FOUND':
        message = 'Unable to find latest version on GitHub.';
        break;
      default:
        message = message || 'Unknown error ocurred.';
    }
    this.errorMessage = message;
  }

  async updateCheck() {
    // ipc.send('check-for-update');
    try {
      await ipc.invoke('check-for-update');
    } catch (e) {
      this.createErrorMessage(null, e.message);
      this.updateStatePage = 4;
    }
  }

  updateInstall() {
    ipc.send('install-update');
  }

  /**
   * @param {MouseEvent} e
   */
  linkHandler(e) {
    e.preventDefault();
    e.stopPropagation();
    const anchor = /** @type HTMLAnchorElement */ (e.target);
    ipc.send('open-external-url', anchor.href);
  }

  /**
   * Checks if `channel` is a valid channel signature.
   * @param {string} channel
   * @returns {boolean}
   */
  isValidChannel(channel) {
    return ['beta', 'alpha', 'latest'].indexOf(channel) !== -1;
  }

  /**
   * @param {Event} e
   */
  autoChangeHandler(e) {
    const button = /** @type AnypointSwitch */ (e.target);
    if (this.autoUpdate === undefined && button.checked === false) {
      this.autoUpdate = button.checked;
      return;
    }
    if (button.checked === this.autoUpdate) {
      return;
    }
    this.autoUpdate = button.checked;
    this.settings.update('updater.auto', button.checked);
  }

  /**
   * @param {CustomEvent} e
   */
  releaseChannelHandler(e) {
    this.releaseChannel = e.detail.value;
    this.settings.update('updater.channel', e.detail.value);
  }

  appTemplate() {
    return html`
    <main>
      ${this.titleTemplate()}
      ${this.updatesSettingsTemplate()}
      ${this.errorTemplate()}
      ${this.authorTemplate()}
    </main>
    `;
  }

  titleTemplate() {
    const { versionInfo } = window;
    return html`<section class="title-section">
      <div class="hero">
        <div class="logo-container">
          <arc-icon class="logo" icon="arcIconArrows"></arc-icon>
        </div>
        <div class="app-title">
          <h1>Advanced REST Client</h1>
        </div>
      </div>
      <div class="version-meta">
        <p class="version">Version: ${versionInfo.appVersion}</p>
        <a
          href="https://github.com/advanced-rest-client/arc-electron/releases/tag/v${versionInfo.appVersion}"
          @click="${this.linkHandler}"
        >
          Release notes
          <arc-icon class="open-external-icon" icon="openInNew" title="Open external window"></arc-icon>
        </a>
      </div>
    </section>`;
  }

  updatesSettingsTemplate() {
    const {
      updateProgress,
      updateDownloaded,
      compatibility,
      autoUpdate,
      updateLabel,
    } = this;
    return html`
    <section class="updates-section">
      <div class="update-status">
        <span class="update-message">${updateLabel}</span>
        ${updateDownloaded ?
          html`<anypoint-button
            emphasis="high"
            ?compatibility="${compatibility}"
            @click="${this.updateInstall}"
          >Restart and install</anypoint-button>` :
          html`<anypoint-button
            emphasis="high"
            ?disabled="${updateProgress}"
            ?compatibility="${compatibility}"
            @click="${this.updateCheck}"
          >Check for updates</anypoint-button>`}
      </div>
      <div class="update-settings">
        <anypoint-switch 
          .checked="${autoUpdate}"
          @change="${this.autoChangeHandler}"
        >
          Automatically download and install updates
        </anypoint-switch>
      </div>
      ${this.channelsTemplate()}
    </section>`;
  }

  channelsTemplate() {
    const {
      compatibility,
      releaseChannel
    } = this;
    return html`<div class="release-channel">
      <anypoint-dropdown-menu
        dynamicAlign
        horizontalAlign="left"
        ?compatibility="${compatibility}"
        class="channel-selector"
      >
        <label slot="label">Release channel</label>
        <anypoint-listbox
          slot="dropdown-content"
          attrForItemTitle="data-label"
          attrforselected="data-channel"
          .selected="${releaseChannel}"
          @selected-changed="${this.releaseChannelHandler}"
          ?compatibility="${compatibility}"
        >
          <anypoint-item data-channel="latest" data-label="Stable">
            <anypoint-item-body twoline>
              <div>Stable</div>
              <div data-secondary>Default channel. Tested and targeted for production environment.</div>
            </anypoint-item-body>
          </anypoint-item>
          <anypoint-item data-channel="beta" data-label="Beta">
            <anypoint-item-body twoline>
              <div>Beta</div>
              <div data-secondary>Next release. Tested but may contain bugs.</div>
            </anypoint-item-body>
          </anypoint-item>
          <anypoint-item data-channel="alpha" data-label="Unstable">
            <anypoint-item-body twoline>
              <div>Unstable</div>
              <div data-secondary>Development version. May not be fully tested and contain bugs!</div>
            </anypoint-item-body>
          </anypoint-item>
        </anypoint-listbox>
      </anypoint-dropdown-menu>
    </div>`;
  }

  errorTemplate() {
    if (!this.isError) {
      return '';
    }
    const { errorMessage, errorCode } = this;
    return html`
    <section class="error-code">
      <p>${errorMessage}</p>
      ${errorCode ? html`<p>${errorCode}</p>` : ''}
    </section>`;
  }

  authorTemplate() {
    return html`
    <section class="author-line">
      <p>Coded by <a href="https://www.linkedin.com/in/pawelpsztyc/" @click="${this.linkHandler}">Pawel Psztyc</a>.</p>
      <div class="branding">
        With great support of MuleSoft, a Salesforce company.
      </div>
    </section>
    `;
  }
}
const page = new AboutDialog();
page.initialize();
