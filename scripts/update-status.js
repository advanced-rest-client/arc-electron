const {ArcBase} = require('./arc-base');
const {autoUpdater} = require('electron-updater');
const {dialog, nativeImage} = require('electron');
const log = require('electron-log');
const path = require('path');
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

/**
 * A module to check for updates.
 */
class UpdateStatus extends ArcBase {
  constructor(windowManager, appMenu) {
    super();
    this.wm = windowManager;
    this.menu = appMenu;
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
    this.installUpdate = this.installUpdate.bind(this);
    this.check = this.check.bind(this);
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

  check(opts) {
    opts = opts || {};
    this.lastOptions = opts;
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
    this.notifyWindows('checking-for-update');
    this.menu.updateStatusChnaged('checking-for-update');
  }

  _updateAvailableHandler(info) {
    this.state = 2;
    this.lastInfoObject = info;
    this.notifyWindows('update-available', info);
    this.menu.updateStatusChnaged('download-progress');
    var detail = 'It will be downloaded automatically. The update will be applied';
    detail += ' after you restart the application.';
    this._notifyUser('New version available!', detail);
  }

  _updateNotAvailableHandler(info) {
    this.state = 3;
    this.lastInfoObject = info;
    this.notifyWindows('update-not-available', info);
    this.menu.updateStatusChnaged('not-available');
    this._notifyUser('No update available.', info.version + ' is the latest version.');
  }

  _updateErrorHandler(error) {
    this.state = 4;
    this.lastInfoObject = error;
    this.notifyWindows('autoupdate-error', error);
    this.menu.updateStatusChnaged('not-available');
    if (error && error.code && error.code === 8) {
      let message = 'Unable to update the application when it runs read-only';
      message += ' mode. Move the application to the Applications folder first';
      message += ' and try again.';
      this._notifyUser('Update error', error.message, true);
    } else {
      this._notifyUser('Update error', error.message, true);
    }
  }

  _downloadProgressHandler(progressObj) {
    this.state = 5;
    this.lastInfoObject = progressObj;
    this.notifyWindows('download-progress', progressObj);
  }
  _downloadReadyHandler(info) {
    this.state = 6;
    this.lastInfoObject = info;
    this.notifyWindows('update-downloaded', info);
    this.menu.updateStatusChnaged('update-downloaded');
  }

  installUpdate() {
    autoUpdater.quitAndInstall();
  }

  _notifyUser(message, detail, isError) {
    if (!this.lastOptions.notify) {
      return;
    }
    var dialogOpts = {
      type: isError ? 'error' : 'info',
      title: 'ARC updater',
      message: message,
      detail: detail
    };
    if (!isError) {
      let imgPath = path.join(__dirname, '..', 'assets', 'icon.iconset', 'icon_512x512.png');
      dialogOpts.icon = nativeImage.createFromPath(imgPath);
    }
    dialog.showMessageBox(dialogOpts);
  }
}
exports.UpdateStatus = UpdateStatus;
