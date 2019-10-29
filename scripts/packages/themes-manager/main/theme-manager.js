const { ipcMain: ipc } = require('electron');
const { ThemeInfo } = require('../../../main/models/theme-info');
const { ThemePluginsManager } = require('../../plugin-manager/main');
const log = require('../../../main/logger');

class ThemeManager {
  constructor(arcApp) {
    this.arcApp = arcApp;
    /**
     * ARC default theme ID
     * @type {String}
     */
    this.defaultTheme = 'advanced-rest-client/arc-electron-default-theme';
    this._listThemesHandler = this._listThemesHandler.bind(this);
    this._themeInfoHandler = this._themeInfoHandler.bind(this);
    this._activateHandler = this._activateHandler.bind(this);
    this._installHandler = this._installHandler.bind(this);
    this._uninstallHandler = this._uninstallHandler.bind(this);

    this.manager = new ThemePluginsManager();
    this._checkUpdates();
  }
  /**
   * Creates a model for theme info file.
   * @return {ThemeInfo}
   */
  get themeInfo() {
    return new ThemeInfo();
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
   * A handler for the `theme-manager-list-themes` event from the renderer
   * process.
   * @param {Object} e
   * @param {String} id
   */
  _listThemesHandler(e, id) {
    this.themeInfo.load()
    .then((info) => {
      const { themes } = info;
      e.sender.send('theme-manager-themes-list', id, themes);
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
      this.arcApp.config.load(),
      this.themeInfo.load()
    ])
    .then((result) => {
      const [settings, themesInfo] = result;
      const { themes } = themesInfo;
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

  _findThemeInfo(id, themes) {
    if (!themes || !themes.length) {
      return;
    }
    return themes.find((item) => item._id === id);
  }
  /**
   * A handler for the `theme-manager-activate-theme` event from the renderer
   * process.
   * @param {Object} e
   * @param {String} id
   * @param {String} themeId
   */
  async _activateHandler(e, id, themeId) {
    try {
      const settings = await this.arcApp.config.load();
      settings.theme = themeId;
      await this.arcApp.config.store();
      e.sender.send('theme-manager-theme-activated', id, themeId);
    } catch (cause) {
      this._handleError(e.sender, id, cause);
    }
  }

  _installHandler(e, id, name) {
    if (!name || typeof name !== 'string') {
      e.sender.send('theme-manager-error', id, { message: 'The name is not valid.' });
      return;
    }
    const index = name.indexOf('#');
    let version;
    if (index !== -1) {
      version = name.substr(index + 1);
      name = name.substr(0, index);
    }
    this.manager.install(name, version)
    .then((info) => {
      e.sender.send('theme-manager-theme-installed', id, info);
    })
    .catch((cause) => this._handleError(e.sender, id, cause));
  }

  _uninstallHandler(e, id, name) {
    if (!name || typeof name !== 'string') {
      e.sender.send('theme-manager-error', id, { message: 'The name is not valid.' });
      return;
    }
    this.manager.uninstall(name)
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

  _checkUpdates() {
    setTimeout(() => {
      this.__updateCheck();
    }, 10000);
  }

  async __updateCheck() {
    log.debug('Checking for themes updates...');
    try {
      const info = await this.manager.checkForUpdates();
      if (!info || !info.length) {
        log.debug('Themes update not available.');
        return;
      }
      log.debug('Updating themes....');
      const result = await this.manager.update(info);
      result.forEach((item) => {
        if (!result.error) {
          return;
        }
        const { name, message } = item;
        log.info(`Theme ${name} update error: ${message}`);
      });
      log.info('Themes updated. The change will be applied with next app reload.');
    } catch (e) {
      log.error(e);
    }
  }
}
module.exports.ThemeManager = ThemeManager;
