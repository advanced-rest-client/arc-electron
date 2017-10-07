const {ArcBase} = require('./arc-base');
const {autoUpdater} = require('electron-updater');
const log = require('electron-log');
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

/**
 * A module responsible for storing / restoring user settings.
 */
class UpdateStatus extends ArcBase {
  constructor(windowManager) {
    super();
    this.wm = windowManager;
    this.state = 0;
    this.lastInfoObject = undefined;
    this._ensureScope();
    this._addListeners();
  }
  /**
   * Checks for app update.
   * This function **must** be called after the app ready event.
   */
  start() {
    log.info('Initializing Auto Updater...');
    setTimeout(() => {
      this.check();
    }, 1000);
  }

  _ensureScope() {
    this._checkingHandler = this._checkingHandler.bind(this);
    this._updateAvailableHandler = this._updateAvailableHandler.bind(this);
    this._updateNotAvailableHandler = this._updateNotAvailableHandler.bind(this);
    this._updateErrorHandler = this._updateErrorHandler.bind(this);
    this._downloadProgressHandler = this._downloadProgressHandler.bind(this);
    this._downloadReadyHandler = this._downloadReadyHandler.bind(this);
  }

  _addListeners() {
    // Auto updater
    autoUpdater.on('checking-for-update', this._checkingHandler);
    autoUpdater.on('update-available', this._updateAvailableHandler);
    autoUpdater.on('update-not-available', this._updateNotAvailableHandler);
    autoUpdater.on('error', this._updateErrorHandler);
    autoUpdater.on('download-progress', this._downloadProgressHandler);
    autoUpdater.on('update-downloaded', this._downloadReadyHandler);
  }

  check() {
    log.info('Checking for update');
    autoUpdater.checkForUpdates();
  }

  notifyWindows(type, ...args) {
    var data = [type];
    data = data.concat(args);
    this.wm.notifyAll(type, data);
  }

  _checkingHandler() {
    this.state = 1;
    this.lastInfoObject = undefined;
    this.notifyWindows('autoupdate-checking-for-update');
  }

  _updateAvailableHandler(info) {
    this.state = 2;
    this.lastInfoObject = info;
    this.notifyWindows('autoupdate-update-available', info);
  }

  _updateNotAvailableHandler(info) {
    this.state = 3;
    this.lastInfoObject = info;
    this.notifyWindows('autoupdate-update-not-available', info);
  }

  _updateErrorHandler(error) {
    this.state = 4;
    this.lastInfoObject = error;
    this.notifyWindows('autoupdate-error', error);
  }

  _downloadProgressHandler(progressObj) {
    this.state = 5;
    this.lastInfoObject = progressObj;
    this.notifyWindows('autoupdate-download-progress', progressObj);
  }
  _downloadReadyHandler(info) {
    this.state = 6;
    this.lastInfoObject = info;
    this.notifyWindows('autoupdate-update-downloaded', info);
    // autoUpdater.quitAndInstall();
  }
}
exports.UpdateStatus = UpdateStatus;
