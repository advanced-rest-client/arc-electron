import { ipcRenderer } from 'electron';
import { ConfigEvents, ConfigEventTypes } from '@advanced-rest-client/arc-events';

/** @typedef {import('@advanced-rest-client/arc-types').Config.ARCConfig} ARCConfig */
/** @typedef {import('@advanced-rest-client/arc-events').ConfigUpdateEvent} ConfigUpdateEvent */

export const domReadHandler = Symbol('domReadHandler');
export const domChangeHandler = Symbol('domChangeHandler');
export const ioChangeHandler = Symbol('ioChangeHandler');

/**
 * A class that acts as a proxy to read application settings.
 */
export class PreferencesProxy {
  constructor() {
    this[domReadHandler] = this[domReadHandler].bind(this);
    this[domChangeHandler] = this[domChangeHandler].bind(this);
    this[ioChangeHandler] = this[ioChangeHandler].bind(this);
  }

  /**
   * Observers window and IPC events which makes this class work.
   */
  observe() {
    window.addEventListener(ConfigEventTypes.readAll, this[domReadHandler]);
    window.addEventListener(ConfigEventTypes.update, this[domChangeHandler]);
    ipcRenderer.on('preferences-value-updated', this[ioChangeHandler]);
  }

  /**
   * Stop observing window and IPC events
   */
  unobserve() {
    window.removeEventListener(ConfigEventTypes.readAll, this[domReadHandler]);
    window.removeEventListener(ConfigEventTypes.update, this[domChangeHandler]);
    ipcRenderer.removeListener('preferences-value-updated', this[ioChangeHandler]);
  }

  /**
   * Reads current application settings.
   * @returns {Promise<ARCConfig>}
   */
  read() {
    return ipcRenderer.invoke('preferences-read');
  }

  /**
   * Updates a single preference
   * @param {string} name Preference name
   * @param {any} value Preference value
   * @returns {Promise<void>}
   */
  update(name, value) {
    return ipcRenderer.invoke('preferences-update', name, value);
  }

  /**
   * A handler for the preferences read event emitted on the DOM.
   * @param {CustomEvent} e
   */
  [domReadHandler](e) {
    e.detail.result = this.read();
  }

  /**
   * A handler for the preferences read event emitted on the DOM.
   * @param {ConfigUpdateEvent} e
   */
  [domChangeHandler](e) {
    const { key, value } = e.detail;
    if (!key) {
      e.detail.result = Promise.reject(new Error(`The name cannot be empty`));
      return;
    }
    e.detail.result = this.update(key, value);
  }

  /**
   * Handler for the IO event for settings update.
   *
   * @param {Electron.IpcRendererEvent} e
   * @param {String} name Name of changed property
   * @param {any} value
   */
  [ioChangeHandler](e, name, value) {
    ConfigEvents.State.update(document.body, name, value);
  }
}
