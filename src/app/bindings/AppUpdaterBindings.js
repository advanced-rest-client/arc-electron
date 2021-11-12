import { PlatformBindings, Events, EventTypes } from '../../../web_modules/index.js';

/** @typedef {import('@advanced-rest-client/events/src/BaseEvents').ArcContextEvent} ArcContextEvent */
/** @typedef {import('electron-updater').UpdateInfo} UpdateInfo */

export class AppUpdaterBindings extends PlatformBindings {
  async initialize() {
    window.addEventListener(EventTypes.Updater.checkForUpdate, this.checkForUpdateHandler.bind(this));
    window.addEventListener(EventTypes.Updater.installUpdate, this.installUpdateHandler.bind(this));
    ArcEnvironment.ipc.on('checking-for-update', this.checkingForUpdateHandler.bind(this));
    ArcEnvironment.ipc.on('update-available', this.updateAvailableHandler.bind(this));
    ArcEnvironment.ipc.on('update-not-available', this.updateNotAvailableHandler.bind(this));
    ArcEnvironment.ipc.on('autoupdate-error', this.updateErrorHandler.bind(this));
    ArcEnvironment.ipc.on('download-progress', this.downloadProgressHandler.bind(this));
    ArcEnvironment.ipc.on('update-downloaded', this.updateDownloadedHandler.bind(this));
  }

  /**
   * @param {ArcContextEvent} e
   */
  checkForUpdateHandler(e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    e.detail.result = this.checkForUpdate();
  }

  /**
   * @param {ArcContextEvent} e
   */
  installUpdateHandler(e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    e.detail.result = this.installUpdate();
  }

  /**
   * Queries for application updates.
   * @returns {Promise<UpdateInfo>}
   */
  async checkForUpdate() {
    return ArcEnvironment.ipc.invoke('check-for-update')
  }

  /**
   * Installs an update, if any.
   * @returns {Promise<void>}
   */
  async installUpdate() {
    ArcEnvironment.ipc.send('install-update')
  }

  checkingForUpdateHandler() {
    Events.Updater.State.checkingForUpdate(document.body);
  }

  /**
   * @param {Electron.IpcRendererEvent} e
   * @param {UpdateInfo} info
   */
  updateAvailableHandler(e, info) {
    Events.Updater.State.updateAvailable(document.body, info);
  }

  updateNotAvailableHandler() {
    Events.Updater.State.updateNotAvailable(document.body);
  }

  /**
   * @param {Electron.IpcRendererEvent} e
   * @param {any} info
   */
  updateErrorHandler(e, info) {
    Events.Updater.State.autoUpdateError(document.body, info);
  }

  /**
   * @param {Electron.IpcRendererEvent} e
   * @param {any} info
   */
  downloadProgressHandler(e, info) {
    Events.Updater.State.downloadProgress(document.body, info);
  }

  /**
   * @param {Electron.IpcRendererEvent} e
   * @param {UpdateInfo} info
   */
  updateDownloadedHandler(e, info) {
    Events.Updater.State.updateDownloaded(document.body, info);
  }
}
