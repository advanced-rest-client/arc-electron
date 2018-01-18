const fs = require('fs-extra');
const electron = require('electron');
const path = require('path');
const app = (electron.app || electron.remote.app);
const {ArcPreferences} = require('../main/arc-preferences');

class ThemeLoader {
  constructor() {
    this.basePath = path.join(app.getPath('userData'), 'themes');
    this.infoFilePath = path.join(this.basePath, 'themes-info.json');
    this.listThemesHandler = this.listThemesHandler.bind(this);
    this.activeThemeHandler = this.activeThemeHandler.bind(this);
    this.activateHandler = this.activateHandler.bind(this);
    this.defaultTheme = 'dd1b715f-af00-4ee8-8b0c-2a262b3cf0c8';
  }

  listen() {
    window.addEventListener('themes-list', this.listThemesHandler);
    window.addEventListener('theme-active-info', this.activeThemeHandler);
    window.addEventListener('theme-activate', this.activateHandler);
  }
  /**
   * Handler for the `themes-list` custom event from theme panel.
   */
  listThemesHandler(e) {
    e.preventDefault();
    e.detail.result = this.loadThemes();
  }
  /**
   * Handler for the `theme-active-info` custom event from theme panel.
   */
  activeThemeHandler(e) {
    const prefs = new ArcPreferences(this.settingsFile);
    e.preventDefault();
    e.detail.result = prefs.loadSettings()
    .then(config => {
      var theme;
      if (config && config.theme) {
        theme = config.theme;
      }
      if (!theme) {
        theme = this.defaultTheme;
      }
      return theme;
    });
  }
  /**
   * Activates a theme selected by the user.
   */
  activateHandler(e) {
    const id = e.detail.theme;
    return this.activateTheme(id)
    .then(() => this.updateThemeSettings(id));
  }
  /**
   * Activates theme for given ID.
   * IDs are generated upon theme installation and stored in `this.basePath`
   * in `themes-info.json` file. This function reads the file to find
   * the theme.
   *
   * @param {[type]} id [description]
   * @return {[type]} [description]
   */
  activateTheme(id) {
    var model;
    var themes;
    this.removeCustomStyle();
    return this.loadThemes()
    .then(data => {
      themes = data;
      return this.getThemeInfo(id, data);
    })
    .then(info => {
      if (!info) {
        console.error('Theme not found. Going back to the default theme.');
        info = this.getThemeInfo(this.defaultTheme, themes);
      }
      return info;
    })
    .then(info => this._fillThemeInfo(info))
    .then(info => {
      model = info;
      return info;
    })
    .then(info => this.loadTheme(info.fileLocation))
    .then(() => this.includeCustomStyle(model.themeName));
  }
  /**
   * Imports theme file from user's filesystem.
   *
   * @param {String} themeLocation Theme file location.
   * @return {Promise]} Promise resolved when the theme file is loaded.
   */
  loadTheme(themeLocation) {
    return new Promise((resolve, reject) => {
      Polymer.Base.importHref(themeLocation, () => {
        resolve();
      }, () => {
        reject();
      });
    });
  }
  /**
   * Removes pre-existing custom style module with theme definition.
   * It also uses Polymer's low level API to clear variables and mixins.
   */
  removeCustomStyle() {
    var old = document.body.querySelector('[data-theme]');
    if (!old) {
      return;
    }
    var cached = Polymer.StyleDefaults._styles;
    if (!cached) {
      return;
    }
    var theme = old.dataset.theme;
    for (var i = cached.length - 1; i >= 0; i--) {
      let item = cached[i];
      if (item.dataset.theme !== theme) {
        continue;
      }
      let removed = Polymer.StyleDefaults._styles.splice(i, 1)[0];
      try {
        removed.parentNode.removeChild(removed);
      } catch (e) {}
    }
    Polymer.StyleDefaults._properties = undefined;
  }
  /**
   * Creates a custom style module that includes theme definition.
   *
   * @param {String} themeName Loaded theme module name to include in the styles.
   */
  includeCustomStyle(themeName) {
    var s = document.createElement('style', 'custom-style');
    s.include = themeName;
    s.dataset.theme = themeName;
    document.body.appendChild(s);
    Polymer.updateStyles();
  }
  /**
   * Finds a theme by its ID in themes array.
   *
   * @param {String} id Generated theme ID
   * @param {Array} themes List og themes objects
   * @return {Object} Theme model.
   */
  getThemeInfo(id, themes) {
    themes = themes || [];
    return themes.find(item => item._id === id);
  }
  /**
   * Adds required by this program fields to the Theme info model.
   *
   * @param {Object} info Theme model object
   * @return {Object} Updated theme model.
   */
  _fillThemeInfo(info) {
    var name = 'arc-theme-';
    name += info.main.replace('.html', '');
    info.themeName  = name;
    info.fileLocation = path.join(info.path, info.main);
    return info;
  }

  /**
   * Updates settings file location so next check for theme configuration will
   * be made to correct configuration file.
   */
  setupSettingsFile(path) {
    this.settingsFile = path;
  }

  /**
   * Loads list of themes from apps directory.
   */
  loadThemes() {
    return fs.readJson(this.infoFilePath, {throws: false})
    .then(info => {
      if (!info) {
        info = [];
      }
      return info;
    });
  }
  /**
   * Updates theme preferences in the settings file.
   *
   * @param {String} themeId Preferred theme ID
   * @return {Promise} Resolved promise when settings file is saved.
   */
  updateThemeSettings(themeId) {
    const prefs = new ArcPreferences(this.settingsFile);
    return prefs.loadSettings()
    .then(() => prefs.saveConfig('theme', themeId));
  }
}
exports.ThemeLoader = ThemeLoader;
