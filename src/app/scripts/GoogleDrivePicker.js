import { ApplicationPage } from '../ApplicationPage.js';
import { html } from '../../../web_modules/lit-html/lit-html.js';
import '../../../web_modules/@advanced-rest-client/google-drive-browser/google-drive-browser.js';

/** @typedef {import('lit-html').TemplateResult} TemplateResult */
/** @typedef {import('@advanced-rest-client/electron-oauth2/renderer/OAuth2Handler').OAuth2Handler} OAuth2Handler */
/** @typedef {import('@advanced-rest-client/arc-types').Authorization.OAuth2Authorization} OAuth2Authorization */

/* global ThemeManager, logger, OAuth2Handler, GoogleDriveProxy */

export class GoogleDrivePickerScreen extends ApplicationPage {
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

  themeProxy = new ThemeManager();

  oauth2Proxy = new OAuth2Handler();

  gDrive = new GoogleDriveProxy();

  constructor() {
    super();

    this.initObservableProperties(
      'compatibility', 'initializing', 'loadingStatus', 'driveToken',
    );
    this.compatibility = false;
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
     * @type {string}
     */
    this.driveToken = undefined;
  }

  async initialize() {
    this.listen();
    await this.loadTheme();
    this.requestGoogleDriveToken();
    this.initializing = false;
  }

  listen() {
    this.themeProxy.listen();
    this.oauth2Proxy.listen();
    window.addEventListener('themeactivated', (e) => {
      // @ts-ignore
      this.compatibility = e.detail === ThemeManager.anypointTheme;
    });
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

  async requestGoogleDriveToken() {
    const cnf = this.oauthConfig;
    cnf.interactive = true;
    const auth = await this.oauth2Proxy.requestToken(cnf);
    if (!auth) {
      return;
    }
    this.driveToken = auth.accessToken;
  }

  /**
   * @param {CustomEvent} e
   */ 
  drivePickHandler(e) {
    const id = e.detail;
    this.gDrive.notifyParentFilePicked(id);
  }

  appTemplate() {
    const { initializing } = this;
    if (initializing) {
      return this.loaderTemplate();
    }
    return html`
    <div class="content">
      ${this.googleDriveTemplate()}
    </div>
    `;
  }

  /**
   * @returns {TemplateResult} A template for the loader
   */
  loaderTemplate() {
    return html`
    <div class="app-loader">
      <p class="message">Preparing Google Drive Picker</p>
      <p class="sub-message">${this.loadingStatus}</p>
    </div>
    `;
  }

  /**
   * @returns {TemplateResult|string} The template for the host rules mapping element
   */
  googleDriveTemplate() {
    const { compatibility } = this;
    // mimeType="application/restclient+data"
    return html`
    <google-drive-browser
      ?compatibility="${compatibility}"
      .accessToken="${this.driveToken}"
      @pick="${this.drivePickHandler}"
    ></google-drive-browser>
    `;  
  }
}

const page = new GoogleDrivePickerScreen();
page.initialize();
