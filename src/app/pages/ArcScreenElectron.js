import { ArcScreen, EventTypes, Events, html } from '../../../web_modules/index.js';

/** @typedef {import('electron-updater').UpdateInfo} UpdateInfo */
/** @typedef {import('lit-element').TemplateResult} TemplateResult */

export class ArcScreenElectron extends ArcScreen {
  constructor() {
    super();
    this.initObservableProperties([
      'updateState', 'hasAppUpdate', 'manualUpdateAvailable', 'updateVersion',
    ]);
    /** 
     * The current state of checking for update.
     * @type {string}
     */
    this.updateState = undefined;
    /** 
     * Whether application update is available.
     */
    this.hasAppUpdate = false;
    /** 
     * Set whe an update is available but it has to be triggered manually.
     */
    this.manualUpdateAvailable = false;
  }

  listen() {
    super.listen();
    window.addEventListener(EventTypes.Updater.State.autoUpdateError, this.autoUpdateErrorHandler.bind(this));
    window.addEventListener(EventTypes.Updater.State.checkingForUpdate, this.checkingForUpdateHandler.bind(this));
    window.addEventListener(EventTypes.Updater.State.downloadProgress, this.downloadProgressHandler.bind(this));
    window.addEventListener(EventTypes.Updater.State.updateAvailable, this.updateAvailableHandler.bind(this));
    window.addEventListener(EventTypes.Updater.State.updateDownloaded, this.updateDownloadedHandler.bind(this));
    window.addEventListener(EventTypes.Updater.State.updateNotAvailable, this.updateNotAvailableHandler.bind(this));
  }

  checkingForUpdateHandler() {
    ArcEnvironment.logger.info('Checking for application update');
    this.updateState = 'checking-for-update';
  }

  /**
   * @param {CustomEvent} e
   */
  updateAvailableHandler(e) {
    ArcEnvironment.logger.info('Application update available.');
    const info = /** @type UpdateInfo */ (e.detail);
    this.updateVersion = info.version;
    this.updateState = 'update-available';
    if (process.platform === 'linux' || this.config.updater && this.config.updater.auto === false) {
      this.manualUpdateAvailable = true;
    }
  }

  updateNotAvailableHandler() {
    ArcEnvironment.logger.info('Application update not available.');
    this.updateState = 'update-not-available';
  }

  /**
   * @param {CustomEvent} e
   */
  autoUpdateErrorHandler(e) {
    this.updateState = 'autoupdate-error';
    ArcEnvironment.logger.error(`Update error: ${e.detail.code || ''} ${e.detail.message}`);
  }

  /**
   * @param {CustomEvent} e
   */
  downloadProgressHandler(e) {
    this.updateState = 'download-progress';
    ArcEnvironment.logger.info(e.detail);
  }

  updateDownloadedHandler() {
    ArcEnvironment.logger.info('Application update downloaded and ready to install.');
    this.updateState = 'update-downloaded';
    this.hasAppUpdate = true;
  }

  /**
   * A handler for the application update notification click.
   * It installs the update when manual installation is not requested.
   * If manual installation is requested then it opens the release page.
   */
  updateClickHandler() {
    const { manualUpdateAvailable, hasAppUpdate } = this;
    if (manualUpdateAvailable) {
      const { updateVersion } = this;
      const base = 'https://github.com/advanced-rest-client/arc-electron/releases/tag';
      const url = `${base}/v${updateVersion}`;
      Events.Navigation.navigateExternal(document.body, url);
    } else if (hasAppUpdate) {
      Events.Updater.installUpdate(document.body);
    }
  }

  /**
   * @returns {TemplateResult} The template for any code to be added to the application.
   */
  // @ts-ignore
  toolbarActionsTemplate() {
    return html`
    ${this.updateIndicatorTemplate()}
    `;
  }

  /**
   * @returns {TemplateResult|string} The template for the app update indicator
   */
  updateIndicatorTemplate() {
    const { manualUpdateAvailable, hasAppUpdate } = this;
    if (!manualUpdateAvailable && !hasAppUpdate) {
      return '';
    }
    return html`
    <anypoint-icon-button title="Application update available" class="header-action-button" @click="${this.updateClickHandler}">
      <arc-icon icon="cloudDownload"></arc-icon>
    </anypoint-icon-button>`;
  }
}
