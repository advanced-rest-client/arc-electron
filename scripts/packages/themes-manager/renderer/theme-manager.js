const { ipcRenderer: ipc } = require('electron');
const log = require('electron-log');
/**
 * Theme manager class for renderer process.
 *
 * It listens for web and ipc events to manage themes.
 */
class ThemeManager {
  constructor() {
    this._listThemesHandler = this._listThemesHandler.bind(this);
    this._activeThemeHandler = this._activeThemeHandler.bind(this);
    this._activateHandler = this._activateHandler.bind(this);
    this._installHandler = this._installHandler.bind(this);
    this._uninstallHandler = this._uninstallHandler.bind(this);
    this._errorHandler = this._errorHandler.bind(this);
    this._ipcThemesListHandler = this._ipcThemesListHandler.bind(this);
    this._ipcInfoHandler = this._ipcInfoHandler.bind(this);
    this._ipcActivatedHandler = this._ipcActivatedHandler.bind(this);
    this._ipcInstalledHandler = this._ipcInstalledHandler.bind(this);
    this._ipcUninstalledHandler = this._ipcUninstalledHandler.bind(this);
    this._promises = {};
    this._lastId = 0;
  }
  /**
   * Listens for the ipc events to suppot theme changes
   */
  listen() {
    window.addEventListener('themes-list', this._listThemesHandler);
    window.addEventListener('theme-active-info', this._activeThemeHandler);
    window.addEventListener('theme-activate', this._activateHandler);
    window.addEventListener('theme-install', this._installHandler);
    window.addEventListener('theme-uninstall', this._uninstallHandler);
    ipc.on('theme-manager-error', this._errorHandler);
    ipc.on('theme-manager-themes-list', this._ipcThemesListHandler);
    ipc.on('theme-manager-active-theme-info', this._ipcInfoHandler);
    ipc.on('theme-manager-theme-activated', this._ipcActivatedHandler);
    ipc.on('theme-manager-theme-installed', this._ipcInstalledHandler);
    ipc.on('theme-manager-theme-uninstalled', this._ipcUninstalledHandler);
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
    ipc.removeListener('theme-manager-error', this._errorHandler);
    ipc.removeListener('theme-manager-themes-list', this._ipcThemesListHandler);
    ipc.removeListener('theme-manager-active-theme-info', this._ipcInfoHandler);
    ipc.removeListener('theme-manager-theme-activated', this._ipcActivatedHandler);
    ipc.removeListener('theme-manager-theme-installed', this._ipcInstalledHandler);
    ipc.removeListener('theme-manager-theme-uninstalled', this._ipcUninstalledHandler);
  }
  /**
   * Handler for the `themes-list` custom event from theme panel.
   *
   * @param {CustomEvent} e
   */
  _listThemesHandler(e) {
    e.preventDefault();
    e.detail.result = this.listThemes();
  }
  /**
   * Lists installed themes in the application.
   * @return {Promise<Array>} A promise resolved to the theme info array
   */
  listThemes() {
    const id = (++this._lastId);
    ipc.send('theme-manager-list-themes', id);
    return new Promise((resolve, reject) => {
      this._promises[id] = { resolve, reject };
    });
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
   * @return {Promise<Object>} A promise resolved to the theme info
   */
  readActiveThemeInfo() {
    const id = (++this._lastId);
    ipc.send('theme-manager-active-theme-info', id);
    return new Promise((resolve, reject) => {
      this._promises[id] = { resolve, reject };
    });
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
   * @param {String} themeId Theme ID to activate
   * @return {Promise} Promise resolved when theme is avtivated
   */
  activate(themeId) {
    const requestid = (++this._lastId);
    ipc.send('theme-manager-activate-theme', requestid, themeId);
    return new Promise((resolve, reject) => {
      this._promises[requestid] = { resolve, reject };
    });
  }

  _installHandler(e) {
    e.preventDefault();
    const name = e.detail.name;
    e.detail.result = this.installTheme(name);
  }

  installTheme(name) {
    if (!name) {
      return Promise.reject(new Error('Name is required'));
    }
    const requestid = (++this._lastId);
    ipc.send('theme-manager-install-theme', requestid, name);
    return new Promise((resolve, reject) => {
      this._promises[requestid] = { resolve, reject };
    });
  }

  _uninstallHandler(e) {
    e.preventDefault();
    const name = e.detail.name;
    e.detail.result = this.uninstallTheme(name);
  }

  uninstallTheme(name) {
    if (!name) {
      return Promise.reject(new Error('Name is required'));
    }
    const requestid = (++this._lastId);
    ipc.send('theme-manager-uninstall-theme', requestid, name);
    return new Promise((resolve, reject) => {
      this._promises[requestid] = { resolve, reject };
    });
  }

  /**
   * Loads theme file and activates it.
   * @param {String} themeId ID of installed theme of location of theme file.
   *
   * @param {Boolean} noFallback By default the manager will try to revert to default
   * theme when passed theme cannot be loaded. When this opttion is set then
   * it will throw error instead of loading default theme.
   * @return {Promise}
   */
  async loadTheme(themeId, noFallback) {
    const defaultTheme = 'advanced-rest-client/arc-electron-default-theme';
    if (!themeId || themeId === 'dd1b715f-af00-4ee8-8b0c-2a262b3cf0c8') {
      themeId = defaultTheme;
    } else if (themeId === '859e0c71-ce8b-44df-843b-bca602c13d06') {
      themeId = 'advanced-rest-client/arc-electron-anypoint-theme';
    }
    try {
      return await this._loadTheme(themeId);
    } catch (cause) {
      if (!noFallback && themeId !== defaultTheme) {
        return await this._loadTheme(defaultTheme);
      }
      throw cause;
    }
  }

  async _loadTheme(themeId) {
    const nodes = document.head.querySelectorAll('link[rel="stylesheet"]');
    for (let i = nodes.length - 1; i >= 0; i--) {
      const href = nodes[i].href;
      if (href && href.indexOf('themes:') === 0) {
        nodes[i].parentNode.removeChild(nodes[i]);
      }
    }
    const link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('type', 'text/css');
    link.setAttribute('href', 'themes://' + themeId);
    document.head.appendChild(link);
  }
  /**
   * Gets and removes promise from the pending list.
   * @param {String} id Request ID.
   * @return {Object|undefined}
   */
  _getPromise(id) {
    const p = this._promises[id];
    if (!p) {
      return;
    }
    delete this._promises[id];
    return p;
  }
  /**
   * Handler for the error message from the main IPC.
   * @param {Object} e
   * @param {String} id Request id
   * @param {Object} cause Error object with "message".
   */
  _errorHandler(e, id, cause) {
    const p = this._getPromise(id);
    if (!p) {
      log.error(cause);
      return;
    }
    p.reject(cause);
  }
  /**
   * Handler for `theme-manager-themes-list` event from the main IPC.
   * @param {Object} e
   * @param {String} id Request id
   * @param {Array<Object>} list List of installed themes
   */
  _ipcThemesListHandler(e, id, list) {
    const p = this._getPromise(id);
    if (!p) {
      log.error(`ThemeManager: Pending request ${id} do not exist.`);
      return;
    }
    p.resolve(list);
  }
  /**
   * Handler for `theme-manager-active-theme-info` event from the main IPC.
   * @param {Object} e
   * @param {String} id Request id
   * @param {Object} info Theme meta data
   */
  _ipcInfoHandler(e, id, info) {
    const p = this._getPromise(id);
    if (!p) {
      log.error(`ThemeManager: Pending request ${id} do not exist.`);
      return;
    }
    p.resolve(info);
  }
  /**
   * Handler for `theme-manager-theme-activated` event from the main IPC.
   * @param {Object} e
   * @param {String} id Request id
   * @param {String} themeId ID of activated theme.
   */
  async _ipcActivatedHandler(e, id, themeId) {
    const p = this._getPromise(id);
    if (p) {
      p.resolve();
    }
    // this.requireReload();
    await this.loadTheme(themeId);
    document.body.dispatchEvent(new CustomEvent('theme-activated', {
      bubbles: true,
      detail: themeId
    }));
  }

  _ipcInstalledHandler(e, id, info) {
    const p = this._getPromise(id);
    if (!p) {
      log.error(`ThemeManager: Pending request ${id} do not exist.`);
      return;
    }
    p.resolve(info);
  }

  _ipcUninstalledHandler(id) {
    const p = this._getPromise(id);
    if (!p) {
      log.error(`ThemeManager: Pending request ${id} do not exist.`);
      return;
    }
    p.resolve();
  }
  /**
   * Dispatches `reload-app-required` event to the main process.
   */
  requireReload() {
    const message = 'Theme change requires application reload.';
    ipc.send('reload-app-required', message);
  }
}
module.exports.ThemeManager = ThemeManager;
