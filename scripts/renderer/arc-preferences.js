const {ipcRenderer} = require('electron');
/**
 * Class that provides access to user settings file in the renderer process.
 */
class ArcPreferencesRenderer {
  /*
   * @param {?String} settingsFile Settings file lection if different than
   * default one.
   */
  constructor() {
    this._readHandler = this._readHandler.bind(this);
    this._changeHandler = this._changeHandler.bind(this);
    this._mainPrefsHandler = this._mainPrefsHandler.bind(this);
    this._mainChangedHandler = this._mainChangedHandler.bind(this);
    this.promises = [];
    this.lastRequestId = 0;
  }
  /**
   * Observers window events.
   */
  observe() {
    window.addEventListener('settings-read', this._readHandler);
    window.addEventListener('settings-changed', this._changeHandler);
    ipcRenderer.on('app-preference-updated', this._mainChangedHandler);
    ipcRenderer.on('app-preferences', this._mainPrefsHandler);
  }
  /**
   * Handler for the `settings-read` custom event. Reads current settings.
   * It set's the `result` property on event's detail object with the
   * promise from calling `loadSettings()` function.
   *
   * @param {CustomEvent} e Custom event
   */
  _readHandler(e) {
    e.preventDefault();
    e.stopPropagation();
    e.detail.result = this.loadSettings();
  }
  /**
   * Loads application settings from the main thread.
   * @return {Promise}
   */
  loadSettings() {
    return new Promise((resolve) => {
      const id = (++this.lastRequestId);
      this.promises.push({
        type: 'read',
        resolve,
        id
      });
      ipcRenderer.send('read-app-preferences', id);
    });
  }

  _mainPrefsHandler(e, settings, id) {
    if (!id) {
      return;
    }
    let p;
    for (let i = 0, len = this.promises.length; i < len; i++) {
      if (this.promises[i].id === id) {
        p = this.promises[i];
        this.promises.splice(i, 1);
        break;
      }
    }
    if (p) {
      p.resolve(settings);
    }
  }

  _changeHandler(e) {
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
    e.detail.result = new Promise((resolve) => {
      const value = e.detail.value;
      this.promises.push({
        type: 'store',
        resolve,
        name
      });
      ipcRenderer.send('update-app-preference', name, value);
    });
  }

  _mainChangedHandler(e, name, value) {
    let p;
    for (let i = 0, len = this.promises.length; i < len; i++) {
      const item = this.promises[i];
      if (item.type === 'store' && item.name === name) {
        p = item;
        this.promises.splice(i, 1);
        break;
      }
    }
    if (p) {
      p.resolve();
    }
    document.body.dispatchEvent(new CustomEvent('app-preference-updated', {
      bubbles: true,
      detail: {
        name: name,
        value: value
      }
    }));
  }
}
exports.ArcPreferencesRenderer = ArcPreferencesRenderer;
