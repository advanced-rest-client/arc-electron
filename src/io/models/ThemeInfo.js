import { ArcPreferences } from '../../common/ArcPreferences.js';

/** @typedef {import('@advanced-rest-client/events').Theme.ArcThemeStore} ArcThemeStore */
/** @typedef {import('@advanced-rest-client/events').Theme.InstalledTheme} InstalledTheme */

/**
 * A preferences class to store and read theme info file.
 */
export class ThemeInfo extends ArcPreferences {
  constructor() {
    super(process.env.ARC_THEMES_SETTINGS);
  }

  /**
   * @returns {Promise<ArcThemeStore>}
   */
  async load() {
    return super.load();
  }

  /**
   * Stores information about an installed theme.
   * @param {InstalledTheme} info The theme to add.
   * @returns {Promise<void>}
   */
  async addTheme(info) {
    const data = await this.load();
    if (!Array.isArray(data.themes)) {
      data.themes = [];
    }
    data.themes.push(info);
    await this.store();
  }

  /**
   * @param {string} name Theme `name` value.
   * @returns {Promise<void>}
   */
  async removeTheme(name) {
    const data = await this.load();
    if (!Array.isArray(data.themes)) {
      return;
    }
    const index = data.themes.findIndex((item) => item.name === name);
    if (index === -1) {
      return;
    }
    data.themes.splice(index, 1);
    await this.store();
  }

  /**
   * Reads information about theme
   * @param {string} name The `name` of the theme
   * @returns {Promise<InstalledTheme|undefined>}
   */
  async readTheme(name) {
    const data = await this.load();
    if (!Array.isArray(data.themes)) {
      return undefined;
    }
    return data.themes.find((item) => item.name === name || item._id === name);
  }

  /**
   * Sets a theme as active theme
   * @param {string} name Theme `name` value.
   * @returns {Promise<void>}
   */
  async setActive(name) {
    const data = await this.load();
    if (!Array.isArray(data.themes)) {
      throw new Error(`No installed themes.`);
    }
    const index = data.themes.findIndex((item) => item.name === name);
    if (index === -1) {
      throw new Error(`The ${name} theme is not installed.`);
    }
    data.active = name;
    await this.store();
  }

  /**
   * Sets the current timestamp on the theme info on the `updateCheck` property
   * @param {string} name 
   * @returns {Promise<void>}
   */
  async setUpdateCheckTime(name) {
    const info = await this.readTheme(name);
    if (!info) {
      return;
    }
    info.updateCheck = Date.now();
    await this.store();
  }

  /**
   * Updates the version number on an installed theme
   * @param {string} name 
   * @param {string} version 
   * @returns {Promise<void>}
   */
  async setThemeVersion(name, version) {
    const info = await this.readTheme(name);
    if (!info) {
      return;
    }
    info.version = version;
    await this.store();
  }

  /**
   * @returns {Promise<ArcThemeStore>}
   */
  async defaultSettings() {
    return /** @type ArcThemeStore */ ({
      kind: 'ARC#ThemeInfo',
      version: '1.1.0',
      themes: [],
    });
  }

  /**
   * Updates a property on the model without any side effects
   * @param {string} path The path to the value
   * @param {any} value The value to set
   */
  async setProperty(path, value) {
    const data = await this.load();
    this.updateValue(data, path, value);
    await this.store();
  }
}
