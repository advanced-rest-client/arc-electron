import { autoUpdater } from 'electron-updater';
import { EventEmitter } from 'events';
import { dialog, nativeImage, ipcMain, BrowserWindow } from 'electron';
import path from 'path';
import { logger } from './Logger.js';

autoUpdater.logger = logger;

/** @typedef {import('electron-updater').UpdateInfo} UpdateInfo */
/** @typedef {import('@advanced-rest-client/events').Config.ARCConfig} ARCConfig */

export const checkingHandler = Symbol('checkingHandler');
export const updateAvailableHandler = Symbol('updateAvailableHandler');
export const updateNotAvailableHandler = Symbol('updateNotAvailableHandle');
export const updateErrorHandler = Symbol('updateErrorHandler');
export const downloadProgressHandler = Symbol('downloadProgressHandler');
export const downloadReadyHandler = Symbol('downloadReadyHandler');
export const checkUpdateHandler = Symbol('checkUpdateHandler');

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
export class ApplicationUpdater extends EventEmitter {

  constructor() {
    super();
    this.state = 0;
    this.lastInfoObject = undefined;
    this[checkingHandler] = this[checkingHandler].bind(this);
    this[updateAvailableHandler] = this[updateAvailableHandler].bind(this);
    this[updateNotAvailableHandler] = this[updateNotAvailableHandler].bind(this);
    this[updateErrorHandler] = this[updateErrorHandler].bind(this);
    this[downloadProgressHandler] = this[downloadProgressHandler].bind(this);
    this[downloadReadyHandler] = this[downloadReadyHandler].bind(this);
    this.installUpdate = this.installUpdate.bind(this);
    this.check = this.check.bind(this);
  }

  /**
   * Adds auto-update library event listeners.
   */
  listen() {
    autoUpdater.on('checking-for-update', this[checkingHandler]);
    autoUpdater.on('update-available', this[updateAvailableHandler]);
    autoUpdater.on('update-not-available', this[updateNotAvailableHandler]);
    autoUpdater.on('error', this[updateErrorHandler]);
    autoUpdater.on('download-progress', this[downloadProgressHandler]);
    autoUpdater.on('update-downloaded', this[downloadReadyHandler]);

    ipcMain.handle('check-for-update', this[checkUpdateHandler].bind(this));
    ipcMain.on('install-update', this.installUpdate);
  }

  /**
   * Adds auto-update library event listeners.
   */
  unlisten() {
    autoUpdater.off('checking-for-update', this[checkingHandler]);
    autoUpdater.off('update-available', this[updateAvailableHandler]);
    autoUpdater.off('update-not-available', this[updateNotAvailableHandler]);
    autoUpdater.off('error', this[updateErrorHandler]);
    autoUpdater.off('download-progress', this[downloadProgressHandler]);
    autoUpdater.off('update-downloaded', this[downloadReadyHandler]);

    ipcMain.removeHandler('check-for-update');
    ipcMain.off('install-update', this.installUpdate);
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
   * Checks for update.
   *
   * @param {object=} opts Options for checking for an update.
   */
  check(opts={}) {
    this.lastOptions = opts;
    logger.info('Checking for application updates...');
    autoUpdater.checkForUpdates();
  }

  /**
   * Sets the channel value on auto updater
   * @param {string} channel Channel name
   */
  setReleaseChannel(channel) {
    if (this.isValidChannel(channel)) {
      logger.debug(`Setting the release channel to${  channel}`);
      autoUpdater.channel = channel;
    } else {
      logger.warn(`Channel ${channel} is not a valid application release channel.`);
    }
  }

  /**
   * Checks for app update.
   * This function **must** be called after the app ready event.
   *
   * @param {ARCConfig=} settings Current application configuration.
   * @param {boolean=} skipAppUpdate When set it skips application update check
   */
  start(settings={}, skipAppUpdate=false) {
    logger.info('Initializing auto updater.');
    const { updater={} } = settings;
    const { auto, channel } = updater;
    if (channel) {
      if (this.isValidChannel(channel)) {
        logger.info(`Setting auto updater channel to ${channel}`);
        autoUpdater.channel = channel;
      } else {
        logger.warn(`Invalid update updater channel: ${channel}`);
      }
    }
    if (skipAppUpdate || auto === false) {
      logger.debug('Auto Updater is disabled. Manual requests will still download the update.');
      autoUpdater.autoDownload = false;
      autoUpdater.autoInstallOnAppQuit = false;
      return;
    }
    if (!skipAppUpdate) {
      setTimeout(() => this.check(), 5000);
    }
  }

  /**
   * Quits the application and installs the update.
   */
  installUpdate() {
    logger.info('Initializing update process (quit & install)');
    autoUpdater.quitAndInstall();
  }

  /**
   * Handler for the `check-for-update` event dispatched by the renderer process.
   * Calls `check()` with option to not notify the user about the update
   * @returns {Promise<UpdateInfo>}
   */
  async [checkUpdateHandler]() {
    const result = await autoUpdater.checkForUpdates();
    if (!result || !result.updateInfo) {
      return undefined;
    }
    return result.updateInfo;
  }

  /**
   * Emitted when checking if an update has started.
   */
  [checkingHandler]() {
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
  [updateAvailableHandler](info) {
    logger.debug('Update available.');
    this.state = 2;
    this.lastInfoObject = info;
    this.emit('notify-windows', 'update-available', info);
    this.emit('status-changed', 'download-progress');
    if (!this.lastOptions || !this.lastOptions.notify) {
      return;
    }
    this.updateAvailableDialog();
  }

  /**
   * Emitted when there is no available update.
   *
   * @param {UpdateInfo} info Update info object. See class docs for details.
   */
  [updateNotAvailableHandler](info) {
    logger.debug('Update not available.');
    this.state = 3;
    this.lastInfoObject = info;
    this.emit('notify-windows', 'update-not-available', info);
    this.emit('status-changed', 'not-available');
    this.notifyUser('No update available.', `${info.version} is the latest version.`);
  }

  /**
   * Emitted when there is an error while updating.
   *
   * @param {any} error Error from the library.
   */
  [updateErrorHandler](error) {
    const { message, code } = error;
    logger.error(`Update error [${code}]: ${message}`);
    this.state = 4;
    this.lastInfoObject = error;
    this.emit('notify-windows', 'autoupdate-error', {
      message,
      code,
    });
    this.emit('status-changed', 'not-available');
    if (code === 8) {
      let msg = 'Unable to update the application when it runs in';
      msg += ' read-only mode. Move the application to the Applications';
      msg += ' folder first and try again.';
      this.notifyUser('Update error', msg, true);
    } else {
      this.notifyUser('Update error', message, true);
    }
  }

  /**
   * Emitted on download progress.
   *
   * @param {object} progressObj Progress info data. Contains `progress` property which has the following properties:
   * - bytesPerSecond
   * - percent
   * - total
   * - transferred
   */
  [downloadProgressHandler](progressObj) {
    logger.debug('Update download progress');
    this.state = 5;
    this.lastInfoObject = progressObj;
    this.emit('notify-windows', 'download-progress', progressObj);
  }

  /**
   * Emitted when a new version is downloaded.
   *
   * @param {UpdateInfo} info Update info object. See class docs for details.
   */
  [downloadReadyHandler](info) {
    logger.debug('Update download ready', info);
    this.state = 6;
    this.lastInfoObject = info;
    this.emit('notify-windows', 'update-downloaded', info);
    this.emit('status-changed', 'update-downloaded');
    if (this.lastOptions && this.lastOptions.notify) {
      setImmediate(() => autoUpdater.quitAndInstall());
    }
  }

  /**
   * Notifies the user about update event.
   *
   * @param {string} message Message to display.
   * @param {string} detail MacOS only. Additional detail message.
   * @param {boolean=} isError Should be true when notifying about error.
   */
  notifyUser(message, detail, isError) {
    this.lastOptions = this.lastOptions || {};
    if (!this.lastOptions || !this.lastOptions.notify) {
      return;
    }
    const dialogOpts = {
      type: isError ? 'error' : 'info',
      title: 'ARC updater',
      message,
      detail,
    };
    if (!isError) {
      const imgPath = path.join(__dirname, '..', '..', 'assets', 'icon.iconset', 'icon_512x512.png');
      dialogOpts.icon = nativeImage.createFromPath(imgPath);
    }
    dialog.showMessageBox(dialogOpts);
  }

  async updateAvailableDialog() {
    let msg = 'Application update is available. ';
    msg += 'Do you want to install it now?';
    const window = BrowserWindow.getFocusedWindow();
    const result = await dialog.showMessageBox(window, {
      type: 'info',
      title: 'Application update',
      message: msg,
      buttons: ['Yes', 'No']
    });
    if (result.response === 0) {
      autoUpdater.downloadUpdate();
    }
  }

  /**
   * A function reserved for the application menu to call.
   * Checks for the update status when requested.
   * @param {string} action The action  requested by the user.
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
          notify: true,
        });
      break;
      default:
    }
  }
}
