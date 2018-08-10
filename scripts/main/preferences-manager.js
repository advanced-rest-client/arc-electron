const {ipcMain, BrowserWindow} = require('electron');
const log = require('electron-log');
const {ArcPreferences} = require('./arc-preferences');
/**
 * A class handling queries from any application window to read
 * or store application preferences.
 */
class PreferencesManager extends ArcPreferences {
  /**
   * @param {?String} settingsFile Settings file lection if different than
   * default one.
   */
  constructor(settingsFile) {
    super(settingsFile);
    this._readHandler = this._readHandler.bind(this);
    this._changeHandler = this._changeHandler.bind(this);
  }
  /**
   * Listens for application events related to preferences management.
   */
  listen() {
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
    this.loadSettings()
    .then((settings) => {
      event.sender.send('app-preferences', settings, id);
    })
    .catch((cause) => {
      log.error(cause);
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
      p = this.loadSettings();
    } else {
      p = Promise.resolve();
    }
    p.then(() => {
      this.__settings[name] = value;
      return this.updateSettings();
    })
    .then(() => this._informChange(name, value))
    .catch((cause) => {
      event.sender.send('app-preference-update-error', name, cause.message);
    });
  }
  /**
   * Informs all available windows about the change in the preferences.
   * @param {String} name Preference name
   * @param {String} value New value
   */
  _informChange(name, value) {
    const windows = BrowserWindow.getAllWindows();
    for (let i = 0, len = windows.length; i < len; i++) {
      windows[i].webContents.send('app-preference-updated', name, value);
    }
  }
}
module.exports.PreferencesManager = PreferencesManager;
