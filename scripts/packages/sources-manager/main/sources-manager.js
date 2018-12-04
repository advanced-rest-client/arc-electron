const {ipcMain: ipc, app} = require('electron');
const path = require('path');
const {ThemeInfo} = require('../../../main/models/theme-info');
const {ThemePluginsManager} = require('../../plugin-manager/main');
/**
 * This is main process interface.
 *
 * Manages themes state for ARC application. It tells the application where
 * the application sources are.
 *
 * For most cases ARC uses the default web components path which is located
 * in application config directory (this is different depending on the OS).
 * This class tells the main application where the sources
 * are and which theme to load.
 */
class SourcesManager {
  /**
   * @param {PreferencesManager} pm ARC preferences manager module instance
   * @param {Object} so Applicartion startup options. It supports the following
   * keys:
   * - appComponents (String) - Location to the directory where application
   * web components are located. This path must contain `bower_components`
   * directory.
   */
  constructor(pm, so) {
    this.prefsManager = pm;
    this.startupOptions = so || {};
    /**
     * Base path to the themes folder.
     * @type {String}
     */
    this.themesBasePath = path.join(app.getPath('userData'), 'themes');
    /**
     * Location of the installed themes info file.
     * @type {String}
     */
    this.infoFilePath = path.join(this.themesBasePath, 'themes-info.json');
    /**
     * ARC default theme ID
     * @type {String}
     */
    this.defaultTheme = 'advanced-rest-client/arc-electron-default-theme';
    /**
     * Main module (ARC's) path location to generate absolute URL
     * @type {String}
     */
    this.root = path.dirname(require.main.filename);

    this._listThemesHandler = this._listThemesHandler.bind(this);
    this._themeInfoHandler = this._themeInfoHandler.bind(this);
    this._activateHandler = this._activateHandler.bind(this);
    this._installHandler = this._installHandler.bind(this);
    this._uninstallHandler = this._uninstallHandler.bind(this);
  }
  /**
   * Creates a model for theme info file.
   * @return {ThemeInfo}
   */
  get themeInfo() {
    return new ThemeInfo(this.infoFilePath);
  }
  /**
   * Listens for the ipc events to suppot theme changes
   */
  listen() {
    ipc.on('theme-manager-list-themes', this._listThemesHandler);
    ipc.on('theme-manager-active-theme-info', this._themeInfoHandler);
    ipc.on('theme-manager-activate-theme', this._activateHandler);
    ipc.on('theme-manager-install-theme', this._installHandler);
    ipc.on('theme-manager-uninstall-theme', this._uninstallHandler);
  }
  /**
   * Removes event listeners
   */
  unlisten() {
    ipc.removeListener('theme-manager-list-themes', this._listThemesHandler);
    ipc.removeListener('theme-manager-active-theme-info', this._themeInfoHandler);
    ipc.removeListener('theme-manager-activate-theme', this._activateHandler);
    ipc.removeListener('theme-manager-install-theme', this._installHandler);
    ipc.removeListener('theme-manager-uninstall-theme', this._uninstallHandler);
  }
  /**
   * Resolves file path to correct path if it's starts with `~`.
   *
   * @param {String} file Settings file path
   * @return {String} Path to the file.
   */
  resolvePath(file) {
    if (file && file[0] === '~') {
      file = app.getPath('home') + file.substr(1);
    }
    return file;
  }

  _findThemeInfo(id, themes) {
    if (!themes || !themes.length) {
      return;
    }
    return themes.find((item) => item._id === id);
  }
  /**
   * A handler for the `theme-manager-list-themes` event from the renderer
   * process.
   * @param {Object} e
   * @param {String} id
   */
  _listThemesHandler(e, id) {
    this.themeInfo.load()
    .then((list) => {
      e.sender.send('theme-manager-themes-list', id, list);
    })
    .catch((cause) => this._handleError(e.sender, id, cause));
  }
  /**
   * A handler for the `theme-manager-active-theme-info` event from the renderer
   * process.
   * @param {Object} e
   * @param {String} id
   */
  _themeInfoHandler(e, id) {
    Promise.all([
      this.prefsManager.load(),
      this.themeInfo.load()
    ])
    .then((result) => {
      const [settings, themes] = result;
      const themeId = settings.theme || this.defaultTheme;
      let theme = this._findThemeInfo(themeId, themes);
      if (!theme) {
        if (themeId === this.defaultTheme) {
          e.sender.send('theme-manager-error', id, {
            message: 'Selected theme do not exists.'
          });
          return;
        }
        theme = this._findThemeInfo(this.defaultTheme, themes);
        if (!theme) {
          e.sender.send('theme-manager-error', id, {
            message: 'Default theme do not exists.'
          });
          return;
        }
      }
      e.sender.send('theme-manager-active-theme-info', id, theme);
    })
    .catch((cause) => this._handleError(e.sender, id, cause));
  }
  /**
   * A handler for the `theme-manager-activate-theme` event from the renderer
   * process.
   * @param {Object} e
   * @param {String} id
   * @param {String} themeId
   */
  _activateHandler(e, id, themeId) {
    this.prefsManager.load()
    .then((settings) => {
      settings.theme = themeId;
      return this.prefsManager.store();
    })
    .then(() => this.getAppConfig())
    .then((config) => {
      e.sender.send('theme-manager-theme-activated', id, config);
    })
    .catch((cause) => this._handleError(e.sender, id, cause));
  }

  _installHandler(e, id, name) {
    if (!name || typeof name !== 'string') {
      e.sender.send('theme-manager-error', id, {message: 'The name is not valid.'});
      return;
    }
    const manager = new ThemePluginsManager();
    const index = name.indexOf('#');
    let version;
    if (index !== -1) {
      version = name.substr(index + 1);
      name = name.substr(0, index);
    }
    manager.install(name, version)
    .then((info) => {
      e.sender.send('theme-manager-theme-installed', id, info);
    })
    .catch((cause) => this._handleError(e.sender, id, cause));
  }

  _uninstallHandler(e, id, name) {
    if (!name || typeof name !== 'string') {
      e.sender.send('theme-manager-error', id, {message: 'The name is not valid.'});
      return;
    }
    const manager = new ThemePluginsManager();
    manager.uninstall(name)
    .then((info) => {
      e.sender.send('theme-manager-theme-installed', id, info);
    })
    .catch((cause) => this._handleError(e.sender, id, cause));
  }

  _handleError(sender, id, cause) {
    if (cause instanceof Error) {
      cause = {
        message: cause.message
      };
    }
    sender.send('theme-manager-error', id, cause);
  }
}

module.exports.SourcesManager = SourcesManager;
