const electron = require('electron');
const path = require('path');
const fs = require('fs-extra');
const {ArcBase} = require('./arc-base');
/**
 * A module responsible for storing / restoring user settings.
 */
class ArcPreferences extends ArcBase {
  /**
   * @constructor
   *
   * @param {?String} settingsFile Path to a settings file. If not set default
   * location is used.
   */
  constructor(settingsFile) {
    super();
    this._setupPaths(settingsFile);
    // Current read settings.
    this.__settings = undefined;
  }
  /**
   * Setups paths to settings files.
   *
   * @param {?String} settingsFile Optional path to a settings file different
   * than the default one.
   */
  _setupPaths(settingsFile) {
    const app = (electron.app || electron.remote.app);
    this.userSettingsDir = app.getPath('userData');
    this.applicationSettingsDir = app.getPath('appData');
    if (settingsFile) {
      settingsFile = this._resolvePath(settingsFile);
      this.settingsFile = settingsFile;
    } else {
      this.settingsFile = path.join(this.userSettingsDir, 'settings.json');
    }
  }
  /**
   * Resolves file path to correct path if it's starts with `~`.
   *
   * @param {String} file Settings file path
   * @return {String} Path to the file.
   */
  _resolvePath(file) {
    if (file[0] === '~') {
      const app = (electron.app || electron.remote.app);
      file = app.getPath('home') + file.substr(1);
    }
    return file;
  }
  /**
   * Ensures that the file exists and reads it's content as JSON.
   * @param {String} file Path to a file
   * @return {Promise} Promise resolved to file content or empty object.
   */
  restoreFile(file) {
    return fs.ensureFile(file)
    .then(() => fs.readJson(file, {throws: false}));
  }
  /**
   * Stores JSON `data` in `file`.
   *
   * @param {String} file Path to a file.
   * @param {Object} data JavaScript object to store.
   * @return {Promise} Promise resolved when the `file` is updated.
   */
  storeFile(file, data) {
    return fs.outputJson(file, data, {
      spaces: 2
    });
  }
  /**
   * Loads current settings from settings file.
   *
   * @return {Promise} Promise resolved to a settings file.
   */
  loadSettings() {
    if (this.__settings) {
      return Promise.resolve(this.__settings);
    }
    return this.restoreFile(this.settingsFile)
    .then((data) => this._processSettings(data))
    .catch(() => this._processSettings());
  }
  /**
   * Processes data from settings file. Creates default settings if settings
   * file do not exists.
   *
   * @param {?Object} data Settings read from the settings file.
   * @return {Object} Settings for the app.
   */
  _processSettings(data) {
    if (!data || !Object.keys(data).length) {
      this.__settings = this.defaultSettings();
      return this.updateSettings()
      .then(() => {
        return this.__settings;
      });
    }
    this.__settings = data;
    return data;
  }
  /**
   * Stores current settings to file.
   *
   * @return {Promise} Promise resolved when the settings are stored.
   */
  updateSettings() {
    return this.storeFile(this.settingsFile, this.__settings);
  }
  /**
   * Creates default settings object.
   *
   * @return {Object} Default settings object.
   */
  defaultSettings() {
    return {
      'useVariables': true,
      'useCookieStorage': true,
      'requestDefaultTimeout': 45,
      'autoUpdate': true,
      'telemetry': true
    };
  }
}
exports.ArcPreferences = ArcPreferences;
