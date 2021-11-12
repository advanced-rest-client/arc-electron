import { ipcMain } from 'electron';
import log from 'electron-log';
import { ArcPreferences } from "../common/ArcPreferences.js";

/** @typedef {import('@advanced-rest-client/events').ArcState.ARCState} ARCState */

export const readHandler = Symbol('readHandler');
export const changeHandler = Symbol('changeHandler');

/**
 * A class that manages state of the application.
 * The state file stores application state that is not related to application settings. The state is restored for each window. 
 * The state is not propagated to other windows. Though, the last window that stores the sate wins the state for the next opened window.
 * This is design this way so the user can open 2 windows and test APIs suing different environments (for example, as the current environment is not part of settings).
 */
export class AppStateManager extends ArcPreferences {
  /**
   * @constructor
   *
   * @param {string} file The state file path
   */
  constructor(file) {
    super(file);
    this[readHandler] = this[readHandler].bind(this);
    this[changeHandler] = this[changeHandler].bind(this);
  }

  /**
   * Listens for application events related to preferences management.
   */
  observe() {
    ipcMain.handle('app-state-read', this[readHandler]);
    ipcMain.handle('app-state-update', this[changeHandler]);
  }

  async [readHandler]() {
    let data;
    try {
      data = await this.load();
    } catch (cause) {
      log.error(cause);
      // eslint-disable-next-line no-console
      console.error(cause);
      throw cause;
    }
    return data;
  }

  /**
   * @param {Event} event
   * @param {string} path Preference name
   * @param {any} value Preference value
   */
  async [changeHandler](event, path, value) {
    try {
      const data = await this.load();
      this.updateValue(data, path, value);
      await this.store();
    } catch (cause) {
      log.error(cause);
      // eslint-disable-next-line no-console
      console.error(cause);
      throw cause;
    }
  }

  /**
   * Creates default settings object.
   *
   * @return {Promise<ARCState>} Default settings object.
   */
  async defaultSettings() {
    return /** @type ARCState */ ({
      kind: 'ARC#AppState',
    });
  }
}
