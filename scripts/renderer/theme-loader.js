const fs = require('fs-extra');
const electron = require('electron');
const path = require('path');
const app = (electron.app || electron.remote.app);

class ThemeLoader {
  constructor() {
    // List of themes available in app
    this.themes = [];
    this.basePath = path.join(app.getPath('userData'), 'themes');
  }
  /**
   * Loads list of themes from apps directory.
   */
  loadThemes() {
    this.themes = [];
    return this._scanPackages();
  }

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

  defaultTheme() {
    let main = 'app-theme.html';
    let info = {
      name: 'Default theme',
      main: 'app-theme.html',
      path: path.join(this.basePath, 'default-theme', main)
    };
    return this.getTheme(info);
  }

  _scanPackages() {
    return fs.ensureDir(this.basePath)
    .then(() => fs.readdir(this.basePath))
    .then(files => this._processPackages(files))
    .then(info => console.log(info));
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
        path: path.join(path.dirname(file), main)
      };
      return info;
    });
  }
}
exports.ThemeLoader = ThemeLoader;
