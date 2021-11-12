import { Events, ConfigurationBindings } from '../../../web_modules/index.js';

/** @typedef {import('@advanced-rest-client/events').Config.ARCConfig} ARCConfig */

/**
 * Web platform bindings for the configuration (settings) related logic.
 */
export class ConfigurationBindingsElectron extends ConfigurationBindings {
  async initialize() {
    ArcEnvironment.ipc.on('preferences-value-updated', this.ioChangeHandler.bind(this));
  }

  /**
   * @returns {Promise<ARCConfig>}
   */
  // @ts-ignore
  async readAll() {
    return ArcEnvironment.ipc.invoke('preferences-read');
  }

  /**
   * Updates a single property in the app settings.
   * @param {string} key 
   * @param {unknown} value 
   * @returns {Promise<void>}
   */
  async update(key, value) {
    return ArcEnvironment.ipc.invoke('preferences-update', key, value);
  }

  /**
   * Handler for the IO event for settings update.
   *
   * @param {Electron.IpcRendererEvent} e
   * @param {String} name Name of changed property
   * @param {any} value
   */
  ioChangeHandler(e, name, value) {
    Events.Config.State.update(document.body, name, value);
  }
}
