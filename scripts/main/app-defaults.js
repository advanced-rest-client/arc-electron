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

  prepareEnvironment() {
    return this._setDefaultTheme();
  }
  /**
   * Copies the default theme data to themes folder if not created
   */
  _setDefaultTheme() {
    const loader = new ThemeLoader();
    const themesPath = loader.basePath;
    const defaultTheme = path.join(themesPath, 'default-theme', 'app-theme.html');
    return fs.ensureDir(themesPath)
    .then(() => fs.pathExists(defaultTheme))
    .then(exists => {
      if (exists) {
        return;
      }
      return this._copyDefaultTheme(themesPath);
    });
  }

  _copyDefaultTheme(themesLocation) {
    const source = path.join(__dirname, '..', '..', 'appresources', 'default-theme');
    const dest = path.join(themesLocation, 'default-theme');
    return fs.copy(source, dest)
    .catch(cause => {
      log.error('Unable to copy default theme from ', source, 'to', dest, cause);
    });
  }
}
exports.AppDefaults = AppDefaults;
