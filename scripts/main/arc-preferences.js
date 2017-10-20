const electron = require('electron');
const path = require('path');
const fs = require('fs-extra');
const {ArcBase} = require('./arc-base');
/**
 * A module responsible for storing / restoring user settings.
 */
class ArcPreferences extends ArcBase {
  constructor() {
    super();
    const app = (electron.app || electron.remote.app);
    this.userSettingsDir = app.getPath('userData');
    this.applicationSettingsDir = app.getPath('appData');
    this.settingsFile = path.join(this.userSettingsDir, 'settings.json');
    // Current read settings.
    this.__settings = undefined;
    this._settingsReadHandler = this._settingsReadHandler.bind(this);
    this._settingsChangeHandler = this._settingsChangeHandler.bind(this);
  }

  observe() {
    window.addEventListener('settings-read', this._settingsReadHandler);
    window.addEventListener('settings-changed', this._settingsChangeHandler);
  }
  /**
   * Ensures that the file exists and reads it's content as JSON.
   * @param {String} file Path to a file
   * @return {Promise} Promise resolved to file content or empty object.
   */
  restoreFile(file) {
    return fs.ensureFile(file)
    .then(() => fs.readJson(file));
  }
  /**
   * Stores JSON `data` in `file`.
   *
   * @param {String} file Path to a file.
   * @param {Object} data JavaScript object to store.
   * @return {Promise} Promise resolved when the `file` is updated.
   */
  storeFile(file, data) {
    return fs.outputJson(file, data);
  }

  loadSettings() {
    if (this.__settings) {
      return Promise.resolve(this.__settings);
    }
    return this.restoreFile(this.settingsFile)
    .then(data => this._processSettings(data))
    .catch(() => this._processSettings());
  }

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

  updateSettings() {
    return this.storeFile(this.settingsFile, this.__settings);
  }
  /**
   * Creates default settings object.
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

  _settingsReadHandler(e) {
    e.preventDefault();
    e.stopPropagation();

    e.detail.result = this.loadSettings();
  }

  _settingsChangeHandler(e) {
    if (!e.cancelable) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    var name = e.detail.name;
    if (!name) {
      e.detail.result = Promise.reject(new Error('Name is not set.'));
      return;
    }
    e.detail.result = this.saveConfig(name, e.detail.value);
  }

  saveConfig(name, value) {
    if (!this.__settings) {
      return Promise.reject('Settings not ready!');
    }
    this.__settings[name] = value;
    return this.updateSettings()
    .then(() => this._informChanged(name, value, 'local'));
  }

  /**
   * Dispatches `settings-changed` event
   * @param {String} key Setting key
   * @param {Any} value Setting value
   * @param {String} area Source storage area
   */
  _informChanged(key, value, area) {
    var event = new CustomEvent('settings-changed', {
      detail: {
        name: key,
        value: value,
        area: area
      },
      cancelable: false
    });
    document.body.dispatchEvent(event);
  }
}
exports.ArcPreferences = ArcPreferences;
