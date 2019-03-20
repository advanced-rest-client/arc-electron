const {ipcRenderer} = require('electron');
/**
 * Class that provides access to user settings file in the renderer process.
 */
class ArcPreferencesProxy {
  /**
   * @constructor
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
   * Observers window and IPC events which makes this class work.
   */
  observe() {
    window.addEventListener('settings-read', this._readHandler);
    window.addEventListener('settings-changed', this._changeHandler);
    ipcRenderer.on('app-preference-updated', this._mainChangedHandler);
    ipcRenderer.on('app-preferences', this._mainPrefsHandler);
  }
  /**
   * Stop observing window and IPC events
   */
  unobserve() {
    window.removeEventListener('settings-read', this._readHandler);
    window.removeEventListener('settings-changed', this._changeHandler);
    ipcRenderer.removeListener('app-preference-updated', this._mainChangedHandler);
    ipcRenderer.removeListener('app-preferences', this._mainPrefsHandler);
  }
  /**
   * Handler for the `settings-read` custom event. Reads current settings.
   * It set's the `result` property on event's detail object with the
   * promise from calling `load()` function.
   *
   * @param {CustomEvent} e Custom event
   */
  _readHandler(e) {
    e.preventDefault();
    e.stopPropagation();
    e.detail.result = this.load();
  }
  /**
   * Loads application settings from the main thread.
   * @return {Promise}
   */
  load() {
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
  /**
   * A handler for app-preferences event from the main process.
   * The event is dispatched to the window that requested this information
   * so the corresponding promise can be fulfilled.
   *
   * The implementation is in ../main/preferences-manager.js file.
   *
   * @param {Event} e
   * @param {Object} settings Restored application settings.
   * @param {String} id The id used to request the data
   */
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
  /**
   * A handler for window `settings-changed` custom event.
   * Sends the intent to the main proces to update preferences.
   * @param {CustomEvent} e
   */
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
    e.detail.result = this.store(name, e.detail.value);
  }

  /**
   * Updates the data and stores it in the settings file.
   * @param {String} name Property name
   * @param {?any} value Property value
   * @return {Promise} Promise resolved when the changes has been commited to
   * the file.
   */
  store(name, value) {
    return new Promise((resolve) => {
      this.promises.push({
        type: 'store',
        resolve,
        name
      });
      ipcRenderer.send('update-app-preference', name, value);
    });
  }

  /**
   * Handler for `app-preference-updated` main process event.
   * The event is dispatched each time a preference change.
   *
   * If corresponding promise exists it will resolve it.
   * It always dispatches `app-preference-updated` custom event.
   *
   * @param {Event} e
   * @param {String} name Name of changed property
   * @param {any} value
   */
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
    document.body.dispatchEvent(new CustomEvent('settings-changed', {
      bubbles: true,
      detail: {
        name: name,
        value: value
      }
    }));
  }
}
exports.ArcPreferencesProxy = ArcPreferencesProxy;
