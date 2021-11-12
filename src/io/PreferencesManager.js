import { ipcMain } from 'electron';
import log from 'electron-log';
import { ArcPreferences } from "../common/ArcPreferences.js";

/** @typedef {import('@advanced-rest-client/events').Config.ARCConfig} ARCConfig */

export const readHandler = Symbol('readHandler');
export const changeHandler = Symbol('changeHandler');

export class PreferencesManager extends ArcPreferences {
  /**
   * @constructor
   *
   * @param {string} file The settings file name
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
    ipcMain.handle('preferences-read', this[readHandler]);
    ipcMain.handle('preferences-update', this[changeHandler]);
  }

  /**
   * Loads current settings from settings file.
   * This is just to provide typings.
   *
   * @returns {Promise<ARCConfig>} Promise resolved to a settings file.
   */
  async load() {
    return super.load();
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
   * Handler for the IPC `update-app-preference` event
   * 
   * @param {Event} event
   * @param {string} path Preference name
   * @param {any} value Preference value
   */
  async [changeHandler](event, path, value) {
    try {
      const data = await this.load();
      this.updateValue(data, path, value);
      await this.store();
      this.informChange(path, value);
    } catch (cause) {
      log.error(cause);
      // eslint-disable-next-line no-console
      console.error(cause);
      throw cause;
    }
  }

  /**
   * Informs all available windows about the change in the preferences.
   * @param {string} name Preference name
   * @param {string} value New value
   */
  informChange(name, value) {
    this.emit('settings-changed', name, value);
  }

  /**
   * Creates default settings object.
   *
   * @return {Promise<ARCConfig>} Default settings object.
   */
  async defaultSettings() {
    return /** @type ARCConfig */ ({
      view: {
        draggableEnabled: true,
        listType: 'default',
        popupMenu: true,
      },
      history: {
        enabled: true,
        fastSearch: true,
      },
      privacy: {
        telemetry: false,
        exceptionsOnly: true,
      },
      request: {
        followRedirects: true,
        useAppVariables: true,
        useSystemVariables: true,
      },
      requestEditor: {
        bodyEditor: 'Monaco',
        progressInfo: true,
        sendButton: true,
      },
      response: {
        warningResponseMaxSize: 2048,
        forceRawSize: 4096,
      },
      updater: {
        auto: true,
      },
    });
  }
}
