const fs = require('fs-extra');
const electron = require('electron');
const ipc = electron.ipcRenderer;
const path = require('path');
const app = (electron.app || electron.remote.app);
/**
 * A class responsible for loading ARC components and
 * theme from appropieate source.
 *
 * Anypoint theme has to use different source as it uses different definitions
 * for `paper-*` components (like input or dropdown menu). Because there's
 * no possibility to replace a defined element at runtime it has to be done
 * before any custom element is registered. Hence this loader.
 */
class ThemeLoader {
  /**
   * @param {?String} userTheme A theme to be restored. If not set default is
   * used
   */
  constructor(userTheme) {
    this.userTheme = userTheme;
    this.basePath = path.join(app.getPath('userData'), 'themes');
    this.infoFilePath = path.join(this.basePath, 'themes-info.json');
    this._listThemesHandler = this._listThemesHandler.bind(this);
    this._activeThemeHandler = this._activeThemeHandler.bind(this);
    this._activateHandler = this._activateHandler.bind(this);
    this.defaultTheme = 'dd1b715f-af00-4ee8-8b0c-2a262b3cf0c8';
    this.anypointTheme = '859e0c71-ce8b-44df-843b-bca602c13d06';
    this.activeTheme = this.userTheme || this.defaultTheme;
    this.importFileName = 'import.html';
    this.componentsBasePath = path.join('./', 'components');
  }
  /**
   * @return {String} A path to insllaed web components directory
   */
  get componentsDir() {
    let packageName;
    if (this.activeTheme === this.anypointTheme) {
      packageName = 'anypoint';
    } else {
      packageName = 'default';
    }
    return path.join('components', packageName, 'bower_components');
  }

  listen() {
    window.addEventListener('themes-list', this._listThemesHandler);
    window.addEventListener('theme-active-info', this._activeThemeHandler);
    window.addEventListener('theme-activate', this._activateHandler);
  }
  /**
   * Handler for the `themes-list` custom event from theme panel.
   *
   * @param {CustomEvent} e
   */
  _listThemesHandler(e) {
    e.preventDefault();
    e.detail.result = this.loadThemes();
  }
  /**
   * Handler for the `theme-active-info` custom event from theme panel.
   *
   * @param {CustomEvent} e
   */
  _activeThemeHandler(e) {
    e.preventDefault();
    if (this.activeTheme) {
      e.detail.result = Promise.resolve(this.activeTheme);
      return;
    }
    e.detail.result = Promise.resolve(this.activeTheme);
  }
  /**
   * Activates a theme selected by the user.
   *
   * Anypoint theme is a special case when the window has to be reloaded when
   * switching from / to the theme. It loads different components definitions
   * which cannot be updated once an element has been already registered.
   *
   * @param {CustomEvent} e
   */
  _activateHandler(e) {
    const id = e.detail.theme;
    let p;
    let reload = false;
    if (id === this.anypointTheme || this.activeTheme === this.anypointTheme) {
      p = Promise.resolve();
      reload = true;
    } else {
      p = this.activateTheme(id);
    }
    p
    .then(() => this.updateThemeSettings(id))
    .then(() => {
      if (reload) {
        this.requireReload();
      }
    });
  }
  /**
   * Activates theme for given ID.
   *
   * @param {String} id Theme ID
   * @return {Promise}
   */
  activateTheme(id) {
    let model;
    let themes;

    if (!id) {
      id = this.activeTheme;
    }

    return this.unactivateTheme(this.activeTheme)
    .then(() => {
      this.activeTheme = id;
      return this.loadThemes();
    })
    .then((data) => {
      themes = data;
      return this.getThemeInfo(id, data);
    })
    .then((info) => {
      if (!info) {
        console.error('Theme not found. Going back to the default theme.');
        this.activeTheme = this.defaultTheme;
        info = this.getThemeInfo(this.defaultTheme, themes);
      }
      return info;
    })
    .then((info) => this._fillThemeInfo(info))
    .then((info) => {
      model = info;
    })
    .then(() => this._loadAppComponents(id))
    .then(() => {
      Polymer.importHref(model.fileLocation, () => {
        const el = Polymer.StyleGather.stylesFromModule(model.themeName)[0];
        const newStyle = new Polymer.CustomStyle();
        const sc = document.createElement('style');
        sc.innerText = el.innerText;
        newStyle.appendChild(sc);
        document.body.appendChild(newStyle);
      }, () => {
        debugger;
      }, true);
    });
    // .then((info) => this._loadWebComponent(info.fileLocation))
    // .then(() => this._loadAppComponents(id))
    // .then(() => this.includeCustomStyle(model.themeName));
  }

  unactivateTheme() {
    if (this.activeTheme) {
      this.removeCustomStyle();
    }
    return Promise.resolve();
  }
  /**
   * Removes pre-existing custom style module with theme definition.
   * It also uses Polymer's low level API to clear variables and mixins.
   */
  removeCustomStyle() {
    const old = document.body.querySelector('[data-theme]');
    if (!old) {
      return;
    }
    const cached = Polymer.StyleDefaults._styles;
    if (!cached) {
      return;
    }
    const theme = old.dataset.theme;
    for (let i = cached.length - 1; i >= 0; i--) {
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
    const s = document.createElement('style', 'custom-style');
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
    return themes.find((item) => item._id === id);
  }
  /**
   * Adds required by this program fields to the Theme info model.
   *
   * @param {Object} info Theme model object
   * @return {Object} Updated theme model.
   */
  _fillThemeInfo(info) {
    let name = 'arc-theme-';
    name += info.main.replace('.html', '');
    info.themeName = name;
    info.fileLocation = path.join(info.path, info.main);
    return info;
  }

  /**
   * Updates settings file location so next check for theme configuration will
   * be made to correct configuration file.
   *
   * @param {String} path A path to app settings file.
   */
  setupSettingsFile(path) {
    this.settingsFile = path;
  }

  setupComponentsPath(path) {
    this.ignoreComponentPath = true;
    this.componentsBasePath = path;
  }

  /**
   * Loads list of themes from apps directory.
   * @return {Promise}
   */
  loadThemes() {
    return fs.readJson(this.infoFilePath, {throws: false})
    .then((info) => {
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
    const e = new CustomEvent('settings-changed', {
      cancelable: true,
      bubbles: true,
      detail: {
        name: 'theme',
        value: themeId
      }
    });
    document.body.dispatchEvent(e);
    return e.detail.result;
  }

  _loadAppComponents(id) {
    let packageName;
    if (id === this.anypointTheme) {
      packageName = 'anypoint';
    } else {
      packageName = 'default';
    }
    const file = path.join(this.componentsBasePath, packageName, this.importFileName);
    return this._loadWebComponent(file);
  }

  _loadWebComponent(href) {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'import';
      link.href = href;
      let loadListener;
      let errorListener;
      loadListener = function(e) {
        e.target.__firedLoad = true;
        e.target.removeEventListener('load', loadListener);
        e.target.removeEventListener('error', errorListener);
        resolve();
      };
      errorListener = function(e) {
        e.target.__firedError = true;
        e.target.removeEventListener('load', loadListener);
        e.target.removeEventListener('error', errorListener);
        reject();
      };
      link.addEventListener('load', loadListener);
      link.addEventListener('error', errorListener);
      document.head.appendChild(link);
    });
  }

  requireReload() {
    ipc.send('reload-app-required');
  }
}
exports.ThemeLoader = ThemeLoader;
