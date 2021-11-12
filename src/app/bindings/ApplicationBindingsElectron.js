import { ApplicationBindings, Events } from '../../../web_modules/index.js';

/** @typedef {import('@advanced-rest-client/events').Application.AppVersionInfo} AppVersionInfo */
/** @typedef {import('@advanced-rest-client/events').ArcState.ARCState} ARCState */

/**
 * Web platform bindings for the general application related logic.
 */
export class ApplicationBindingsElectron extends ApplicationBindings {
  async initialize() {
    await super.initialize();
    ArcEnvironment.ipc.on('command', this.commandHandler.bind(this));
    ArcEnvironment.ipc.on('request-action', this.requestActionHandler.bind(this));
  }

  /**
   * @returns {Promise<AppVersionInfo>}
   */
  async versionInfo() {
    return window.versionInfo;
  }

  /**
   * @returns {Promise<ARCState>}
   */
  // @ts-ignore
  async readState() {
    return ArcEnvironment.ipc.invoke('app-state-read');
  }

  /**
   * @param {string} path Preference name
   * @param {any} value Preference value
   */
  async updateStateProperty(path, value) {
    return ArcEnvironment.ipc.invoke('app-state-update', path, value);
  }

  /**
   * Handles action performed in main thread (menu action) related to a request.
   *
   * @param {Electron.IpcRendererEvent} e
   * @param {string} action Action name to perform.
   * @param {...any} args
   */
  requestActionHandler(e, action, ...args) {
    Events.App.requestAction(document.body, action, args);
  }

  /**
   * Handler for application command.
   *
   * @param {Electron.IpcRendererEvent} e Node's event
   * @param {string} action
   * @param {...any} args
   */
  commandHandler(e, action, ...args) {
    Events.App.command(document.body, action, args);
  }
}
