import { EventEmitter } from 'events';
import fs from 'fs-extra';
import log from 'electron-log';

export class ArcPreferences extends EventEmitter {
  /** 
   * The current settings
   * @type {any}
   */
  #settings = undefined;

  /**
   * @returns {any=} Prefer to call `load()` to read the data.
   * This should be used when the data has been already read.
   */
  get data() {
    return this.#settings;
  }

  /**
   * @constructor
   *
   * @param {string} file The settings file name
   */
  constructor(file) {
    super();
    /**
     * Full path to the preferences file where the data is stored.
     * @type {String}
     */
    this.settingsFile = file;
  }
  
  /**
   * Ensures that the file exists and reads it's content as JSON.
   * 
   * @param {string} file Path to the file
   * @return {Promise<object>} Promise resolved to file content or empty object.
   */
  async restoreFile(file) {
    await fs.ensureFile(file);
    return fs.readJson(file, { throws: false });
  }

  /**
   * Stores JSON `data` in `file`.
   *
   * @param {string} file Path to a file.
   * @param {object} data JavaScript object to store.
   * @return {Promise<void>} Promise resolved when the `file` is updated.
   */
  async storeFile(file, data) {
    await fs.outputJson(file, data);
  }

  /**
   * Loads current settings from settings file.
   *
   * @return {Promise} Promise resolved to a settings file.
   */
  async load() {
    if (this.#settings) {
      return this.#settings;
    }
    try {
      const data = await this.restoreFile(this.settingsFile);
      return this.processSettings(data);
    } catch (e) {
      log.warn(e);
      return this.processSettings();
    }
  }

  /**
   * Processes data from settings file. Creates default settings if settings
   * file do not exists.
   *
   * @param {object=} data Settings read from the settings file. May be empty
   * @return {Promise<object>} Settings for the app.
   */
  async processSettings(data) {
    if (!data || !Object.keys(data).length) {
      const settings = await this.defaultSettings();
      this.#settings = settings;
      await this.store();
      return settings;
    }
    this.#settings = data;
    return data;
  }

  /**
   * @returns {Promise<object>} Sets the default settings object
   */
  async defaultSettings() {
    return {};
  }

  /**
   * Stores current settings to file.
   *
   * @return {Promise<void>} Promise resolved when the settings are stored.
   */
  async store() {
    await this.storeFile(this.settingsFile, this.#settings);
  }
}
