import { ipcRenderer as ipc } from 'electron';
import logger from 'electron-log';

/** @typedef {import('@advanced-rest-client/arc-types').Themes.ArcThemeStore} ArcThemeStore */
/** @typedef {import('@advanced-rest-client/arc-types').Themes.InstalledTheme} InstalledTheme */

const themeActivatedHandler = Symbol('themeActivatedHandler');

/**
 * Theme manager class for renderer process.
 *
 * It listens for web and ipc events to manage themes.
 */
export class ThemeManager {
  static get defaultTheme() {
    return '@advanced-rest-client/arc-electron-default-theme';
  }

  static get anypointTheme() {
    return '@advanced-rest-client/arc-electron-anypoint-theme';
  }

  constructor() {
    this[themeActivatedHandler] = this[themeActivatedHandler].bind(this);
  }
  
  /**
   * Listens for the ipc events to support theme changes
   */
  listen() {
    ipc.on('theme-manager-theme-activated', this[themeActivatedHandler]);
  }

  /**
   * Removes event listeners
   */
  unlisten() {
    ipc.off('theme-manager-theme-activated', this[themeActivatedHandler]);
  }

  /**
   * Handler for the theme activated event. Updates the theme in the current window.
   * @param {*} e
   * @param {string} id
   */
  async [themeActivatedHandler](e, id) {
    await this.loadTheme(id);
    document.body.dispatchEvent(new CustomEvent('themeactivated', {
      detail: id,
      bubbles: true,
    }));
  }

  /**
   * Lists installed themes in the application.
   * @return {Promise<ArcThemeStore>} A promise resolved to the theme info array
   */
  readState() {
    logger.silly('listing themes');
    return ipc.invoke('theme-manager-read-themes');
  }

  /**
   * Reads information about current theme.
   * @return {Promise<InstalledTheme>} A promise resolved to the theme info
   */
  readActiveThemeInfo() {
    logger.silly('reading active theme');
    return ipc.invoke('theme-manager-active-theme-info');
  }

  /**
   * Activates the theme. It stores theme id in user preferences and loads the
   * theme.
   * @param {string} name Theme name to activate
   * @return {Promise<void>} Promise resolved when the theme is activated
   */
  activate(name) {
    logger.info(`activating theme: ${name}`);
    return ipc.invoke('theme-manager-activate-theme', name);
  }

  /**
   * @param {string} name The theme to install
   * @returns {Promise<void>} 
   */
  installTheme(name) {
    logger.info(`installing theme: ${name}`);
    if (!name) {
      return Promise.reject(new Error('Name is required'));
    }
    return ipc.invoke('theme-manager-install-theme', name);
  }

  /**
   * @param {string} name The theme to uninstall
   * @returns {Promise<void>} 
   */
  uninstallTheme(name) {
    logger.info(`uninstalling a theme: ${name}`);
    if (!name) {
      return Promise.reject(new Error('Name is required'));
    }
    return ipc.invoke('theme-manager-uninstall-theme', name);
  }

  /**
   * Loads theme file and activates it.
   * @param {string=} themeId ID of installed theme of location of theme file.
   *
   * @param {boolean=} noFallback By default the manager will try to revert to default
   * theme when passed theme cannot be loaded. When this option is set then
   * it will throw error instead of loading default theme.
   * @return {Promise<void>}
   */
  async loadTheme(themeId, noFallback) {
    logger.silly(`loading theme: ${themeId}`);
    let id = themeId;
    if (!id || id === 'dd1b715f-af00-4ee8-8b0c-2a262b3cf0c8') {
      id = ThemeManager.defaultTheme;
    } else if (id === '859e0c71-ce8b-44df-843b-bca602c13d06') {
      id = ThemeManager.anypointTheme;
    }
    try {
      await this._loadTheme(id);
    } catch (cause) {
      if (!noFallback && id !== ThemeManager.defaultTheme) {
        await this._loadTheme(ThemeManager.defaultTheme);
        return;
      }
      throw cause;
    }
  }

  async _loadTheme(themeId) {
    const nodes = document.head.querySelectorAll('link[rel="stylesheet"]');
    for (let i = nodes.length - 1; i >= 0; i--) {
      // @ts-ignore
      const { href } = nodes[i];
      if (href && href.indexOf('themes:') === 0) {
        logger.silly(`removing previous theme: ${href}`);
        nodes[i].parentNode.removeChild(nodes[i]);
      }
    }
    logger.silly(`adding theme to the DOM: ${themeId}`);
    const link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('type', 'text/css');
    link.setAttribute('href', `themes://${themeId}`);
    document.head.appendChild(link);
  }
}
