const { ArcPreferences } = require('../lib/preferences');
const { PayloadProcessor } = require(
  '@advanced-rest-client/arc-electron-payload-processor');
const log = require('electron-log');
/**
 * A class handling queries from any application window (renderer) to read
 * or store application preferences.
 */
class WorkspaceManager extends ArcPreferences {
  /**
   * @param {String} workspaceFile Location of the workspace state file to use.
   */
  constructor(workspaceFile) {
    super({
      file: workspaceFile
    });
    log.info('State file is ', this.settingsFile);
    /**
     * Store data debounce timer.
     * By default it's 500 ms.
     * @type {Number}
     */
    this.storeDebounce = 500;
    this._readHandler = this._readHandler.bind(this);
    this._changeHandler = this._changeHandler.bind(this);
  }
  /**
   * Observers window custom events
   */
  observe() {
    window.addEventListener('workspace-state-read', this._readHandler);
    window.addEventListener('workspace-state-store', this._changeHandler);
  }
  /**
   * Removed web event listeners from ythe window object
   */
  unobserve() {
    window.removeEventListener('workspace-state-read', this._readHandler);
    window.removeEventListener('workspace-state-store', this._changeHandler);
  }
  /**
   * Generates the default settings. It is used by the parten class when
   * settings are not avaiolable.
   * @return {Promise}
   */
  defaultSettings() {
    return Promise.resolve({
      requests: [],
      selected: 0,
      environment: 'default'
    });
  }
  /**
   * Handler for web `workspace-state-read` custom event.
   * @param {CustomEvent} e
   */
  _readHandler(e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    e.detail.result = this.restore();
  }
  /**
   * Handler for web `workspace-state-store` custom event.
   * @param {CustomEvent} e
   */
  _changeHandler(e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    if (!e.detail.value) {
      const message = 'workspace-state-store event has no value';
      log.warn(message);
      return;
    }
    this.__settings = e.detail.value;
    this.storeWorkspace();
  }
  /**
   * Restores state file.
   *
   * @return {Promise} Promise resolved to content of the file.
   */
  async restore() {
    log.info('Restoring workspace data from', this.settingsFile);
    try {
      const data = await this.load();
      log.info('Restored workspace data from', this.settingsFile);
      this.initialized = true;
      this._processRestoredPayload(data);
      return data;
    } catch (cause) {
      log.warn('Unable to restore workspace data');
      log.warn(cause);
      this.initialized = true;
      return {};
    }
  }
  /**
   * Stores current data to state file.
   *
   * This task is async and delayed
   *
   * @param {Object} data Store file contents
   */
  storeWorkspace() {
    if (!this.initialized) {
      return;
    }
    if (this.__storeDebouncer) {
      return;
    }
    this.__storeDebouncer = true;
    setTimeout(() => {
      this.__storeDebouncer = false;
      this._doStoreWorkspace();
    }, this.storeDebounce);
  }

  async _doStoreWorkspace() {
    log.info('Storing workspace data to', this.settingsFile);
    try {
      await this.store();
    } catch (cause) {
      log.error('Unable to store workspace data to ' + this.settingsFile);
      log.error(cause);
    }
  }
  /**
   * Updates state of the request entries.
   *
   * @param {Object} requests List of ARC requests objects.
   * @return {Promise} Promise resolved when data is saved.
   */
  async updateRequestsSate(requests) {
    if (!this.initialized) {
      return;
    }
    log.info('Updating workspace request data...');
    if (!this.__settings) {
      this.__settings = {};
    }
    const data = await this._processRequests(requests);
    this.__settings.requests = data;
    this.storeWorkspace();
  }
  /**
   * Updates selected request data.
   *
   * @param {Number} selected Selected request
   */
  updateSelected(selected) {
    if (!this.initialized) {
      return;
    }
    log.info('Updating workspace selection data...');
    if (!this.__settings) {
      this.__settings = {};
    }
    this.__settings.selected = selected;
    this.storeWorkspace();
  }
  /**
   * Processes requests payloads and transforms them to string if needed.
   *
   * @param {Array<Object>} requests List of ARC requests
   * @param {?Number} index Index of processed request
   * @param {?Array} result Result of processing.
   * @return {Promise} Promise resolved when all requests has been processed.
   * Resolved promise contains the copy of request objects.
   */
  async _processRequests(requests, index, result) {
    index = index || 0;
    result = result || [];
    const item = requests[index];
    if (!item) {
      return result;
    }
    const request = await PayloadProcessor.payloadToString(item);
    /* eslint-disable-next-line require-atomic-updates */
    result[index] = request;
    index++;
    return await this._processRequests(requests, index, result);
  }
  /**
   * When restoring data it processes requests payload data.
   * @param {Object} state
   */
  _processRestoredPayload(state) {
    if (!state || !state.requests || !state.requests.length) {
      return;
    }
    for (let i = 0, len = state.requests.length; i < len; i++) {
      if (state.requests[i].multipart) {
        try {
          state.requeststs[i].payload = PayloadProcessor.restoreMultipart(
            state.requests[i].multipart);
          delete state.requests[i].multipart;
        } catch (_) {
          // ...
        }
      } else if (state.requests[i].blob) {
        try {
          state.requeststs[i].payload = PayloadProcessor._dataURLtoBlob(
            state.requests[i].blob);
          delete state.requests[i].blob;
        } catch (_) {
          // ...
        }
      }
    }
  }
}
module.exports.WorkspaceManager = WorkspaceManager;
