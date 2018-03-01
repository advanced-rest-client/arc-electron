const {ArcPreferences} = require('../main/arc-preferences');
const electron = require('electron');
/**
 * Class that provides access to user settings file in the renderer process.
 *
 * @extends ArcPreferences
 */
class ArcPreferencesRenderer extends ArcPreferences {
  /**
   * @constructor
   *
   * @param {?String} settingsFile Settings file lection if different than
   * default one.
   */
  constructor(settingsFile) {
    super(settingsFile);
    this._settingsReadHandler = this._settingsReadHandler.bind(this);
    this._settingsChangeHandler = this._settingsChangeHandler.bind(this);
    this._mainSettingsChangedHandler =
      this._mainSettingsChangedHandler.bind(this);
  }
  /**
   * Observers window events.
   */
  observe() {
    window.addEventListener('settings-read', this._settingsReadHandler);
    window.addEventListener('settings-changed', this._settingsChangeHandler);
    electron.ipcRenderer.on('settings-changed',
      this._mainSettingsChangedHandler);
  }
  /**
   * Handler for the `settings-read` custom event. Reads current settings.
   * It set's the `result` property on event's detail object with the
   * promise from calling `loadSettings()` function.
   *
   * @param {CustomEvent} e Custom event
   */
  _settingsReadHandler(e) {
    e.preventDefault();
    e.stopPropagation();
    e.detail.result = this.loadSettings();
  }
  /**
   * Handler for the `settings-changed` custom event.
   * Stores settings by calling `saveConfig()` function. Result of calling the
   * function is assigned to detail's `result` property.
   *
   * @param {CustomEvent} e Event handled by the script.
   */
  _settingsChangeHandler(e) {
    if (!e.cancelable) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    let name = e.detail.name;
    if (!name) {
      e.detail.result = Promise.reject(new Error('Name is not set.'));
      return;
    }
    e.detail.result = this.saveConfig(name, e.detail.value);
  }
  /**
   * Updates and stores configuration for a property.
   *
   * @param {String} name Name of the property to update.
   * @param {String|Boolean|Object|Array|Number} value Value to store.
   * @return {Promise} Promise resolved when the settings are stored.
   */
  saveConfig(name, value) {
    if (!this.__settings) {
      return Promise.reject('Settings not ready!');
    }
    this.__settings[name] = value;
    return this.updateSettings()
    .then(() => this._informChanged(name, value, 'local'));
  }
  /**
   * Sends the cotification about the change to the main process
   * and calls `_informChangeWeb()` function to notify components about
   * the change.
   * @param {String} key Setting key
   * @param {Any} value Setting value
   * @param {String} area Source storage area
   */
  _informChanged(key, value, area) {
    electron.ipcRenderer.send('settings-changed', key, value, area);
    this._informChangeWeb(key, value, area);
  }
  /**
   * Dispatches `settings-changed` event.
   * This can only happen in renderer process.
   * @param {String} key Setting key
   * @param {Any} value Setting value
   * @param {String} area Source storage area
   */
  _informChangeWeb(key, value, area) {
    let event = new CustomEvent('settings-changed', {
      detail: {
        name: key,
        value: value,
        area: area
      },
      cancelable: false,
      bubbles: true
    });
    document.body.dispatchEvent(event);
  }
  /**
   * Handler for the `settings-changed` event emmited by the
   * main process.
   *
   * @param {Event} event Event received from the main process.
   * @param {Object} data Event arguments.
   */
  _mainSettingsChangedHandler(event, data) {
    this._informChangeWeb(data.key, data.value, data.area);
  }
}
exports.ArcPreferencesRenderer = ArcPreferencesRenderer;
