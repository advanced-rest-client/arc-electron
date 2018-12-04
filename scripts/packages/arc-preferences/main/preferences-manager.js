const {ArcPreferences} = require('../lib/preferences');
const {ipcMain, BrowserWindow} = require('electron');
const log = require('electron-log');
/**
 * A class handling queries from any application window (renderer) to read
 * or store application preferences.
 */
class PreferencesManager extends ArcPreferences {
  /**
   * @param {?Object} opts - Initialization options:
   * - file - Path to a settings file. It overrides other settings and
   * uses this file as a final store.
   * - fileName - A name for the settings file. By default it's `settings.json`
   * - filePath - Path to the preferences file. By default it's system's
   * application directory for user profile.
   */
  constructor(opts) {
    super(opts);
    this._readHandler = this._readHandler.bind(this);
    this._changeHandler = this._changeHandler.bind(this);
  }
  /**
   * Listens for application events related to preferences management.
   */
  observe() {
    ipcMain.on('read-app-preferences', this._readHandler);
    ipcMain.on('update-app-preference', this._changeHandler);
  }
  /**
   * Handler for the IPC `read-app-preferences` event
   * @param {Event} event
   * @param {?String} id Optional ID send back with the `app-preferences` event
   * response
   */
  _readHandler(event, id) {
    this.load()
    .then((settings) => {
      event.sender.send('app-preferences', settings, id);
    })
    .catch((cause) => {
      log.error(cause);
      console.error(cause);
      event.sender.send('app-preferences', {}, id);
    });
  }
  /**
   * Handler for the IPC `update-app-preference` event
   * @param {Event} event
   * @param {String} name Preference name
   * @param {any} value Preference value
   */
  _changeHandler(event, name, value) {
    let p;
    if (!this.__settings) {
      p = this.load();
    } else {
      p = Promise.resolve();
    }
    p.then(() => {
      this.__settings[name] = value;
      return this.store();
    })
    .then(() => this._informChange(name, value))
    .catch((cause) => {
      log.error(cause);
      console.error(cause);
      event.sender.send('app-preference-update-error', name, cause.message);
    });
  }
  /**
   * Informs all available windows about the change in the preferences.
   * @param {String} name Preference name
   * @param {String} value New value
   */
  _informChange(name, value) {
    this.emit('settings-changed', name, value);
    const windows = BrowserWindow.getAllWindows();
    for (let i = 0, len = windows.length; i < len; i++) {
      windows[i].webContents.send('app-preference-updated', name, value);
    }
  }
  /**
   * Creates default settings object.
   *
   * @return {Object} Default settings object.
   */
  defaultSettings() {
    return Promise.resolve({
      'useVariables': true,
      'useCookieStorage': true,
      'requestDefaultTimeout': 45,
      'autoUpdate': true,
      'telemetry': true
    });
  }
}
module.exports.PreferencesManager = PreferencesManager;
