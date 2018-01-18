const fs = require('fs-extra');
const electron = require('electron');
const path = require('path');
const app = (electron.app || electron.remote.app);
const {ArcPreferences} = require('../main/arc-preferences');

class ThemeLoader {
  constructor() {
    // List of themes available in app
    this.themes = undefined;
    this.basePath = path.join(app.getPath('userData'), 'themes');
    this.listThemesHandler = this.listThemesHandler.bind(this);
    this.activeThemeHandler = this.activeThemeHandler.bind(this);
    this.activateHandler = this.activateHandler.bind(this);
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
    if (this.themes) {
      e.detail.result = Promise.resolve(this.themes);
    } else {
      e.detail.result = this.loadThemes();
    }
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
        theme = this.defaultInfo();
      }
      return theme;
    });
  }
  /**
   * Activates a theme selected by the user.
   */
  activateHandler(e) {
    var info = e.detail.theme;
    return this.getTheme(info)
    .then(data => this.updateThemeData(data));
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
    this.themes = [];
    return this._scanPackages();
  }
  /**
   * Reads theme file content
   *
   * @param {Object} info Theme info object
   * @return {Promise} Resolved promise to the file content as string
   */
  getTheme(info) {
    if (!info || !info.path) {
      return Promise.resolve();
    }
    return fs.pathExists(info.path)
    .then(exists => {
      if (!exists) {
        return;
      }
      return fs.readFile(info.path, 'utf8');
    });
  }

  defaultInfo() {
    let main = 'app-theme.html';
    let info = {
      name: 'Default theme',
      main: 'app-theme.html',
      path: path.join(this.basePath, 'default-theme', main)
    };
    return info;
  }

  defaultTheme() {
    return this.getTheme(this.defaultInfo());
  }

  _scanPackages() {
    return fs.ensureDir(this.basePath)
    .then(() => fs.readdir(this.basePath))
    .then(files => this._processPackages(files))
    .then(info => {
      this.themes = info;
      return info;
    });
  }

  _processPackages(files) {
    files = files.filter(i => i.indexOf('.') !== 0);
    files = files.filter(i => {
      const fullPath = path.join(this.basePath, i);
      try {
        return fs.lstatSync(fullPath).isDirectory();
      } catch (e) {
        return false;
      }
    });
    files = files.map(i => path.join(this.basePath, i));
    return this._readPackagesInfo(files);
  }

  _readPackagesInfo(paths, result) {
    result = result || [];
    if (!paths.length) {
      return Promise.resolve(result);
    }
    var themePath = paths.shift();
    var file = path.join(themePath, 'package.json');
    return fs.pathExists(file)
    .then(exists => {
      if (!exists) {
        return;
      }
      return this._getPackageInfo(file);
    })
    .then(info => {
      if (!info) {
        return;
      }
      result.push(info);
    })
    .then(() => this._readPackagesInfo(paths, result));
  }

  _getPackageInfo(file) {
    return fs.readJson(file, {throws: false})
    .then(data => {
      if (!data) {
        return;
      }
      let main = data.main;
      if (main instanceof Array) {
        main = main[0];
      } else if (!main) {
        main = path.basename(main);
      }
      let info = {
        name: data.name,
        main: main,
        path: path.join(path.dirname(file), main),
        description: data.description
      };
      return info;
    });
  }

  updateThemeData(data) {
    var style = document.body.querySelector('style[is="custom-style"]');
    if (style) {
      document.body.removeChild(style);
    }
    var t = document.createElement('template');
    t.innerHTML = data;
    var clone = document.importNode(t.content, true);
    document.body.appendChild(clone);
  }
}
exports.ThemeLoader = ThemeLoader;
