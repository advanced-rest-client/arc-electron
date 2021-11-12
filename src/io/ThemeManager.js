/* eslint-disable no-param-reassign */
import { ipcMain, nativeTheme } from 'electron';
import { ThemeInfo } from './models/ThemeInfo.js';
import { ThemePluginsManager } from './ThemePluginsManager.js';
import { logger } from './Logger.js';

/** @typedef {import('./ArcEnvironment').ArcEnvironment} ArcEnvironment */
/** @typedef {import('@advanced-rest-client/events').Theme.ArcThemeStore} ArcThemeStore */
/** @typedef {import('@advanced-rest-client/events').Theme.InstalledTheme} InstalledTheme */
/** @typedef {import('../types').SystemThemeInfo} SystemThemeInfo */

export const checkUpdateDebounce = Symbol('checkUpdateDebounce');
export const checkUpdate = Symbol('checkUpdate');
export const osThemeUpdateHandler = Symbol('osThemeUpdateHandler');
export const readSystemThemeHandler = Symbol('readSystemThemeHandler');

export class ThemeManager {
  /**
   * 
   * @param {ArcEnvironment} arcApp 
   * @param {boolean} skipUpdateCheck 
   */
  constructor(arcApp, skipUpdateCheck) {
    this.arcApp = arcApp;
    /**
     * ARC default theme ID
     * @type {string}
     */
    this.defaultTheme = '@advanced-rest-client/arc-electron-default-theme';
    this.readState = this.readState.bind(this);
    this.readActive = this.readActive.bind(this);
    this.activateTheme = this.activateTheme.bind(this);
    this.installTheme = this.installTheme.bind(this);
    this.uninstallTheme = this.uninstallTheme.bind(this);
    this.updatePropertyHandler = this.updatePropertyHandler.bind(this);
    this[readSystemThemeHandler] = this[readSystemThemeHandler].bind(this);
    this[osThemeUpdateHandler] = this[osThemeUpdateHandler].bind(this);

    this.manager = new ThemePluginsManager();
    if (!skipUpdateCheck) {
      this[checkUpdateDebounce]();
    }
  }
  
  /**
   * Creates a model for theme info file.
   * @return {ThemeInfo}
   */
  get themeInfo() {
    return new ThemeInfo();
  }

  /**
   * Listens for the ipc events to support theme changes
   */
  listen() {
    ipcMain.handle('theme-manager-read-themes', this.readState);
    ipcMain.handle('theme-manager-active-theme-info', this.readActive);
    ipcMain.handle('theme-manager-activate-theme', this.activateTheme);
    ipcMain.handle('theme-manager-install-theme', this.installTheme);
    ipcMain.handle('theme-manager-uninstall-theme', this.uninstallTheme);
    ipcMain.handle('theme-manager-update-property', this.updatePropertyHandler);
    ipcMain.handle('theme-manager-system-theme', this[readSystemThemeHandler]);
    nativeTheme.on('updated', this[osThemeUpdateHandler]);
  }

  /**
   * Reads the current theme info
   * @returns {Promise<ArcThemeStore>}
   */
  async readState() {
    return this.themeInfo.load();
  }

  /**
   * @returns {Promise<InstalledTheme>}
   */
  async readActive() {
    const state = await this.readState();
    const { themes, active } = state;
    if (!Array.isArray(themes)) {
      throw new Error(`No installed themes available.`);
    }
    const { defaultTheme } = this;
    // first find the active theme
    let info = themes.find((theme) => theme.name === active || theme._id === active);
    if (!info && active === defaultTheme) {
      throw new Error(`The default theme is not installed.`);
    }
    if (info) {
      return info;
    }
    // then find the default theme.
    info = themes.find((theme) => theme.name === defaultTheme || theme._id === defaultTheme);
    if (!info && active === defaultTheme) {
      throw new Error(`The default theme is not installed.`);
    }
    return info;
  }

  /**
   * A handler for the `theme-manager-activate-theme` event from the renderer
   * process.
   * @param {any} event
   * @param {string} name
   * @returns {Promise<void>} 
   */
  async activateTheme(event, name) {
    await this.themeInfo.setActive(name);
    this.arcApp.wm.notifyAll('theme-manager-theme-activated', name);
  }

  /**
   * @param {any} e 
   * @param {string} name The theme to install
   * @returns {Promise<void>} 
   */
  async installTheme(e, name) {
    if (!name || typeof name !== 'string') {
      throw new Error('The name is not valid.');
    }
    const index = name.indexOf('#');
    let version;
    if (index !== -1) {
      version = name.substr(index + 1);
      name = name.substr(0, index);
    }
    const info = await this.manager.install(name, version);
    await this.activateTheme(e, info.name);
  }

  /**
   * @param {any} e 
   * @param {string} name The theme to uninstall
   * @returns {Promise<void>} 
   */
  async uninstallTheme(e, name) {
    if (!name || typeof name !== 'string') {
      throw new Error('The name is not valid.');
    }
    await this.manager.uninstall(name);
    await this.activateTheme(e, this.defaultTheme);
  }

  [checkUpdateDebounce]() {
    setTimeout(() => this[checkUpdate](), 10000);
  }

  async [checkUpdate]() {
    logger.debug('Checking for themes updates...');
    try {
      const info = await this.manager.checkForUpdates();
      if (!info || !info.length) {
        logger.debug('Themes update not available.');
        return;
      }
      logger.debug('Updating themes....');
      const result = await this.manager.update(info);
      result.forEach((item) => {
        if (!item.error) {
          return;
        }
        const { name, message } = item;
        logger.info(`Theme ${name} update error: ${message}`);
      });
      logger.info('Themes updated. The change will be applied with next app reload.');
    } catch (e) {
      logger.error(e);
    }
  }

  /**
   * @param {any} e 
   * @param {string} path The path to the value
   * @param {any} value The value to set.
   * @returns {Promise<void>} 
   */
  async updatePropertyHandler(e, path, value) {
    await this.themeInfo.setProperty(path, value);
    this.arcApp.wm.notifyAll('theme-property-changed', [path, value]);
  }

  /**
   * @returns {SystemThemeInfo} 
   */
  generateSystemThemeInfo() {
    return {
      shouldUseDarkColors: nativeTheme.shouldUseDarkColors,
      shouldUseHighContrastColors: nativeTheme.shouldUseHighContrastColors,
      shouldUseInvertedColorScheme: nativeTheme.shouldUseInvertedColorScheme,
    };
  }

  /**
   * @returns {Promise<SystemThemeInfo>} 
   */
  async [readSystemThemeHandler]() {
    return this.generateSystemThemeInfo();
  }

  /**
   * Handler for the native theme update event.
   */
  [osThemeUpdateHandler]() {
    const info = this.generateSystemThemeInfo();
    this.arcApp.wm.notifyAll('system-theme-changed', info);
  }
}
