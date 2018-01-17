const {ThemeLoader} = require('../renderer/theme-loader');
const fs = require('fs-extra');
const path = require('path');
const log = require('electron-log');
/**
 * Class responsible for keeping application base environment stable.
 *
 * It copies default resources to it's default locations and sets up the application
 * environment.
 */
class AppDefaults {

  constructor() {
    this.themePath = new ThemeLoader().basePath;
  }

  prepareEnvironment() {
    return this._setDefaultTheme()
    .then(() => this._setAnypointTheme());
  }
  /**
   * Copies the default theme data to themes folder if not created
   */
  _setDefaultTheme() {
    const defaultTheme = path.join(this.themePath, 'default-theme', 'app-theme.html');
    return fs.ensureDir(this.themePath)
    .then(() => fs.pathExists(defaultTheme))
    .then(exists => {
      if (exists) {
        return;
      }
      return this._copyThemeFiles('default-theme', this.themePath);
    });
  }

  _setAnypointTheme() {
    const file = path.join(this.themePath, 'anypoint-theme', 'app-theme.html');
    return fs.pathExists(file)
    .then(exists => {
      if (exists) {
        return;
      }
      return this._copyThemeFiles('anypoint-theme', this.themePath);
    });
  }

  _copyThemeFiles(theme, themesLocation) {
    const source = path.join(__dirname, '..', '..', 'appresources', theme);
    const dest = path.join(themesLocation, theme);
    const file = 'app-theme.html';
    const pkg = 'package.json';
    return fs.ensureDir(dest)
    .then(() => fs.copy(path.join(source, file), path.join(dest, file)))
    .then(() => fs.copy(path.join(source, pkg), path.join(dest, pkg)))
    .catch(cause => {
      log.error('Unable to copy default theme from ', source, 'to', dest, cause);
    });
  }
}
exports.AppDefaults = AppDefaults;
