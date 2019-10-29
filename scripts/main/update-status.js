const { ArcBase } = require('./arc-base');
const { autoUpdater } = require('electron-updater');
const { dialog, nativeImage, ipcMain } = require('electron');
const log = require('./logger');
const path = require('path');

/**
 * A module to check for updates.
 *
 * UpdateInfo model:
 * - version {String} - The version.
 * - files {Array<module:builder-util-runtime.UpdateFileInfo>}
 * - releaseName {String} - The release name.
 * - releaseNotes {String} - The release notes.
 * - releaseDate {String} - The release date.
 * - stagingPercentage {Number} - The staged rollout percentage, 0-100.
 */
class UpdateStatus extends ArcBase {
  /**
   * @constructor
   *
   * @param {ArcEnvironment} app
   */
  constructor() {
    super();
    this.state = 0;
    this.lastInfoObject = undefined;
    this._ensureScope();
    this._addListeners();
  }
  /**
   * Listens for event related to auto-update.
   */
  listen() {
    ipcMain.on('check-for-update', this._checkUpdateHandler.bind(this));
    ipcMain.on('install-update', this.installUpdate);
  }
  /**
   * Handler for `check-for-update` event dispatech by the rendere.
   * Calls `check()` with option to not notify the user about the update
   */
  _checkUpdateHandler() {
    this.check({
      notify: false
    });
  }
  /**
   * Event handler for menu actions.
   *
   * @param {String} action Menu action
   */
  menuActionHandler(action) {
    if (action.indexOf('application') === -1) {
      return;
    }
    switch (action) {
      case 'application:install-update':
        this.installUpdate();
      break;
      case 'application:check-for-update':
        this.check({
          notify: true
        });
      break;
    }
  }
  /**
   * Checks if `channel` is a valid channel signature.
   * @param {String} channel
   * @return {Boolean}
   */
  isValidChannel(channel) {
    return ['beta', 'alpha', 'latest'].indexOf(channel) !== -1;
  }
  /**
   * Checks for app update.
   * This function **must** be called after the app ready event.
   *
   * @param {Object} settings Current application configuration.
   * @param {Boolean} skipAppUpdate When set it skips application update check
   */
  start(settings, skipAppUpdate) {
    log.info('Initializing Auto Updater.');
    if (settings.releaseChannel) {
      if (this.isValidChannel(settings.releaseChannel)) {
        log.info('Setting auto updater channel to ' + settings.releaseChannel);
        autoUpdater.channel = settings.releaseChannel;
      }
    }
    if (settings.autoUpdate === false) {
      log.debug('Auto Updater is disabled. Manual requests will still download the update.');
      autoUpdater.autoDownload = false;
      return;
    }
    if (!skipAppUpdate) {
      setTimeout(() => this.check(), 5000);
    }
  }
  /**
   * Sets the channel value on auto updater
   * @param {String} channel Channel name
   */
  updateReleaseChannel(channel) {
    if (this.isValidChannel(channel)) {
      log.debug('Setting release channel to' + channel);
      autoUpdater.channel = channel;
    } else {
      log.warn('Channel ' + channel + ' is not valid application release channel.');
    }
  }
  /**
   * Creates scoped event handlers for all events used in this class.
   */
  _ensureScope() {
    this._checkingHandler = this._checkingHandler.bind(this);
    this._updateAvailableHandler = this._updateAvailableHandler.bind(this);
    this._updateNotAvailableHandler =
      this._updateNotAvailableHandler.bind(this);
    this._updateErrorHandler = this._updateErrorHandler.bind(this);
    this._downloadProgressHandler = this._downloadProgressHandler.bind(this);
    this._downloadReadyHandler = this._downloadReadyHandler.bind(this);
    this.installUpdate = this.installUpdate.bind(this);
    this.check = this.check.bind(this);
  }
  /**
   * Adds auto-update library event listeners.
   */
  _addListeners() {
    // Auto updater
    autoUpdater.on('checking-for-update', this._checkingHandler);
    autoUpdater.on('update-available', this._updateAvailableHandler);
    autoUpdater.on('update-not-available', this._updateNotAvailableHandler);
    autoUpdater.on('error', this._updateErrorHandler);
    autoUpdater.on('download-progress', this._downloadProgressHandler);
    autoUpdater.on('update-downloaded', this._downloadReadyHandler);
  }
  /**
   * Checks for update.
   *
   * @param {?Object} opts Options for checking for an update.
   */
  check(opts) {
    opts = opts || {};
    this.lastOptions = opts;
    log.info('Checking for application update.');
    autoUpdater.checkForUpdates();
  }
  /**
   * Emitted when checking if an update has started.
   */
  _checkingHandler() {
    this.state = 1;
    this.lastInfoObject = undefined;
    this.emit('notify-windows', 'checking-for-update');
    this.emit('status-changed', 'checking-for-update');
  }
  /**
   * Emitted when there is an available update. The update is downloaded
   * automatically.
   *
   * @param {UpdateInfo} info Update info object. See class docs for details.
   */
  _updateAvailableHandler(info) {
    log.debug('Update available.', info);
    this.state = 2;
    this.lastInfoObject = info;
    this.emit('notify-windows', 'update-available', info);
    this.emit('status-changed', 'download-progress');
    if (!this.lastOptions.notify) {
      return;
    }
    this._updateAvailableDialog();
  }
  /**
   * Emitted when there is no available update.
   *
   * @param {UpdateInfo} info Update info object. See class docs for details.
   */
  _updateNotAvailableHandler(info) {
    log.debug('Update not available.', info);
    this.state = 3;
    this.lastInfoObject = info;
    this.emit('notify-windows', 'update-not-available', info);
    this.emit('status-changed', 'not-available');
    this._notifyUser('No update available.',
      info.version + ' is the latest version.');
  }
  /**
   * Emitted when there is an error while updating.
   *
   * @param {Error} error Error from the library.
   */
  _updateErrorHandler(error) {
    log.error('Update error', error);
    this.state = 4;
    this.lastInfoObject = error;
    this.emit('notify-windows', 'autoupdate-error', {
      message: error.message,
      code: error.code
    });
    this.emit('status-changed', 'not-available');
    if (error && error.code && error.code === 8) {
      let message = 'Unable to update the application when it runs in';
      message += ' read-only mode. Move the application to the Applications';
      message += ' folder first and try again.';
      this._notifyUser('Update error', message, true);
    } else {
      this._notifyUser('Update error', error.message, true);
    }
  }
  /**
   * Emitted on progress.
   *
   * @param {Object} progressObj Progress info data. Contains `progress`
   * property whoich has following properties:
   * - bytesPerSecond
   * - percent
   * - total
   * - transferred
   */
  _downloadProgressHandler(progressObj) {
    log.debug('Update download progress', progressObj);
    this.state = 5;
    this.lastInfoObject = progressObj;
    this.emit('notify-windows', 'download-progress', progressObj);
  }
  /**
   * Emmited when new version is downloaded.
   *
   * @param {UpdateInfo} info Update info object. See class docs for details.
   */
  _downloadReadyHandler(info) {
    log.debug('Update download ready', info);
    this.state = 6;
    this.lastInfoObject = info;
    this.emit('notify-windows', 'update-downloaded', info);
    this.emit('status-changed', 'update-downloaded');
    if (this.lastOptions.notify) {
      setImmediate(() => autoUpdater.quitAndInstall());
    }
  }
  /**
   * Quits the application and installs new update.
   */
  installUpdate() {
    log.info('Initializing update process (quit & install)');
    autoUpdater.quitAndInstall();
  }
  /**
   * Notofies user about update event.
   *
   * @param {String} message Message to display.
   * @param {String} detail MacOS only. Additional detail message.
   * @param {Boolean} isError Should be true when notifying about error.
   */
  _notifyUser(message, detail, isError) {
    this.lastOptions = this.lastOptions || {};
    if (!this.lastOptions.notify) {
      return;
    }
    const dialogOpts = {
      type: isError ? 'error' : 'info',
      title: 'ARC updater',
      message: message,
      detail: detail
    };
    if (!isError) {
      const imgPath = path.join(__dirname, '..', '..', 'assets', 'icon.iconset',
        'icon_512x512.png');
      dialogOpts.icon = nativeImage.createFromPath(imgPath);
    }
    dialog.showMessageBox(dialogOpts);
  }

  _updateAvailableDialog() {
    let msg = 'Application update is available. ';
    msg += 'Do you want to install it now?';
    dialog.showMessageBox({
      type: 'info',
      title: 'Application update',
      message: msg,
      buttons: ['Yes', 'No']
    }, (buttonIndex) => {
      if (buttonIndex === 0) {
        autoUpdater.downloadUpdate();
      }
    });
  }
}
exports.UpdateStatus = UpdateStatus;
