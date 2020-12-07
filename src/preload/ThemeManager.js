import { ipcRenderer as ipc } from 'electron';
import logger from 'electron-log';

/** @typedef {import('@advanced-rest-client/arc-types').Themes.ArcThemeStore} ArcThemeStore */
/** @typedef {import('@advanced-rest-client/arc-types').Themes.InstalledTheme} InstalledTheme */

/**
 * Theme manager class for renderer process.
 *
 * It listens for web and ipc events to manage themes.
 */
export class ThemeManager {
  constructor() {
    this._listThemesHandler = this._listThemesHandler.bind(this);
    this._activeThemeHandler = this._activeThemeHandler.bind(this);
    this._activateHandler = this._activateHandler.bind(this);
    this._installHandler = this._installHandler.bind(this);
    this._uninstallHandler = this._uninstallHandler.bind(this);
  }
  
  /**
   * Listens for the ipc events to support theme changes
   */
  listen() {
    window.addEventListener('themes-list', this._listThemesHandler);
    window.addEventListener('theme-active-info', this._activeThemeHandler);
    window.addEventListener('theme-activate', this._activateHandler);
    window.addEventListener('theme-install', this._installHandler);
    window.addEventListener('theme-uninstall', this._uninstallHandler);
  }

  /**
   * Removes event listeners
   */
  unlisten() {
    window.removeEventListener('themes-list', this._listThemesHandler);
    window.removeEventListener('theme-active-info', this._activeThemeHandler);
    window.removeEventListener('theme-activate', this._activateHandler);
    window.removeEventListener('theme-install', this._installHandler);
    window.removeEventListener('theme-uninstall', this._uninstallHandler);
  }

  /**
   * Handler for the `themes-list` custom event from theme panel.
   *
   * @param {CustomEvent} e
   */
  _listThemesHandler(e) {
    e.preventDefault();
    e.detail.result = this.readState();
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
   * Handler for the `theme-active-info` custom event from theme panel.
   *
   * @param {CustomEvent} e
   */
  _activeThemeHandler(e) {
    e.preventDefault();
    e.detail.result = this.readActiveThemeInfo();
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
   * Activates the theme selected by the user.
   *
   * @param {CustomEvent} e
   */
  _activateHandler(e) {
    e.preventDefault();
    const id = e.detail.theme;
    e.detail.result = this.activate(id);
  }

  /**
   * Activates the theme. It stores theme id in user preferences and loads the
   * theme.
   * @param {string} name Theme name to activate
   * @return {Promise<void>} Promise resolved when the theme is activated
   */
  activate(name) {
    logger.silly(`activating a theme: ${name}`);
    return ipc.invoke('theme-manager-activate-theme', name);
  }

  _installHandler(e) {
    e.preventDefault();
    const {name} = e.detail;
    e.detail.result = this.installTheme(name);
  }

  /**
   * @param {string} name The theme to install
   * @returns {Promise<void>} 
   */
  installTheme(name) {
    logger.silly(`installing a theme: ${name}`);
    if (!name) {
      return Promise.reject(new Error('Name is required'));
    }
    return ipc.invoke('theme-manager-install-theme', name);
  }

  _uninstallHandler(e) {
    e.preventDefault();
    const {name} = e.detail;
    e.detail.result = this.uninstallTheme(name);
  }

  /**
   * @param {string} name The theme to uninstall
   * @returns {Promise<void>} 
   */
  uninstallTheme(name) {
    logger.silly(`uninstalling a theme: ${name}`);
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
    const defaultTheme = 'advanced-rest-client/arc-electron-default-theme';
    let id = themeId;
    if (!id || id === 'dd1b715f-af00-4ee8-8b0c-2a262b3cf0c8') {
      id = defaultTheme;
    } else if (id === '859e0c71-ce8b-44df-843b-bca602c13d06') {
      id = 'advanced-rest-client/arc-electron-anypoint-theme';
    }
    try {
      await this._loadTheme(id);
    } catch (cause) {
      if (!noFallback && id !== defaultTheme) {
        await this._loadTheme(defaultTheme);
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
