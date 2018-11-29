const fs = require('fs-extra');
const path = require('path');
const log = require('../logger');

/**
 * A class that is responsible for setting up theme defaults.
 */
class ThemeDefaults {
  /**
   * @param {SourcesManager} sm
   */
  constructor(sm) {
    this.themePath = sm.themesBasePath;
    this.infoFilePath = sm.infoFilePath;
  }
  /**
   * Sets defaults if the defaults are not yet set.
   * It copues anypoint and default theme to theme location
   * and creates theme-info file.
   *
   * @return {Promise} Resolved promise when the defaults are stored.
   */
  prepareEnvironment() {
    return this._readDefaultThemesPackages()
    .then((names) => this._ensureThemes(names))
    .then(() => this._setThemeInfo());
  }

  _readDefaultThemesPackages() {
    const source = path.join(__dirname, '..', '..', '..', 'appresources', 'themes');
    return fs.readdir(source)
    .then((items) => {
      const themePaths = [];
      items.forEach((name) => {
        const loc = path.join(source, name);
        const stats = fs.statSync(loc);
        if (stats.isDirectory()) {
          themePaths[themePaths.length] = {
            name,
            location: loc
          };
        }
      });
      return themePaths;
    });
  }

  _ensureThemes(themes) {
    const item = themes.shift();
    if (!item) {
      return Promise.resolve();
    }
    return this._ensureTheme(item)
    .then(() => this._ensureThemes(themes))
    .catch(() => this._ensureThemes(themes));
  }

  _ensureTheme(info) {
    const file = path.join(this.themePath, info.name);
    return fs.pathExists(file)
    .then((exists) => {
      if (exists) {
        return;
      }
      return this._copyThemeFiles(info);
    });
  }

  _copyThemeFiles(info) {
    const dest = path.join(this.themePath, info.name);
    return fs.ensureDir(dest)
    .then(() => fs.copy(info.location, dest))
    .catch((cause) => {
      log.error('Unable to copy default theme from ', info.location, 'to', dest, cause);
    });
  }
  // Setups theme info file if missing
  _setThemeInfo() {
    const file = path.join(this.themePath, 'themes-info.json');
    return fs.pathExists(file)
    .then((exists) => {
      if (exists) {
        return this._ensureThemesInfoVersion(file);
      }
      log.info('Creating themes-info.json file');
      return this._copyInfoFile();
    });
  }

  _ensureThemesInfoVersion(file) {
    return fs.readJson(file, {throws: false})
    .then((data) => {
      if (!data || !data.length) {
        return this._copyInfoFile();
      }
      const item = data[0];
      if (!item.location) {
        return this._copyInfoFile();
      }
    });
  }

  _copyInfoFile() {
    const source =
      path.join(__dirname, '..', '..', '..', 'appresources', 'themes', 'themes-info.json');
    const dest = this.infoFilePath;
    return fs.readJson(source, {throws: false})
    .then((info) => {
      info = info || [];
      return info;
    })
    .then((info) => fs.writeJson(dest, info));
  }
}
exports.ThemeDefaults = ThemeDefaults;
