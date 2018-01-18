const {ThemeLoader} = require('../../renderer/theme-loader');
const fs = require('fs-extra');
const path = require('path');
const log = require('electron-log');

/**
 * A class that is responsible for setting up theme defaults.
 */
class ThemeDefaults {
  constructor() {
    this.themePath = new ThemeLoader().basePath;
  }
  /**
   * Sets defaults if the defaults are not yet set.
   * It copues anypoint and default theme to theme location
   * and creates theme-info file.
   *
   * @return {Promise} Resolved promise when the defaults are stored.
   */
  prepareEnvironment() {
    return this._setDefaultTheme()
    .then(() => this._setAnypointTheme())
    .then(() => this._setThemeInfo());
  }

  /**
   * Copies the default theme data to themes folder if not created
   */
  _setDefaultTheme() {
    const themePath = 'default-theme';
    const themeFile = 'default-theme.html';
    return this._ensureTheme(themePath, themeFile);
  }

  _setAnypointTheme() {
    const themePath = 'anypoint-theme';
    const themeFile = 'anypoint-theme.html';
    return this._ensureTheme(themePath, themeFile);
  }

  _ensureTheme(themePath, themeFile) {
    const file = path.join(this.themePath, themePath, themeFile);
    return fs.pathExists(file)
    .then(exists => {
      if (exists) {
        return;
      }
      return this._copyThemeFiles(themePath, themeFile);
    });
  }

  _copyThemeFiles(theme, file) {
    const source = path.join(__dirname, '..', '..', '..', 'appresources', 'themes', theme);
    const dest = path.join(this.themePath, theme);
    const pkg = 'package.json';
    return fs.ensureDir(dest)
    .then(() => fs.copy(path.join(source, file), path.join(dest, file)))
    .then(() => fs.copy(path.join(source, pkg), path.join(dest, pkg)))
    .catch(cause => {
      log.error('Unable to copy default theme from ', source, 'to', dest, cause);
    });
  }
  // Setups theme info file if missing
  _setThemeInfo() {
    const file = path.join(this.themePath, 'themes-info.json');
    return fs.pathExists(file)
    .then(exists => {
      if (exists) {
        return;
      }
      log.info('Creating themes-info.json file');
      return this._copyThemesInfo();
    });
  }

  _copyThemesInfo() {
    const source =
      path.join(__dirname, '..', '..', '..', 'appresources', 'themes', 'themes-info.json');
    const dest = path.join(this.themePath, 'themes-info.json');
    return fs.readJson(source, {throws: false})
    .then(info => {
      info = info || [];
      info = info.map(i => {
        i.path = path.join(this.themePath, i.path);
        return i;
      });
      return info;
    })
    .then(info => fs.writeJson(dest, info));
  }
}
exports.ThemeDefaults = ThemeDefaults;
