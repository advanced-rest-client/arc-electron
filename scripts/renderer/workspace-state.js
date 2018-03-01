const path = require('path');
const {ArcPreferencesRenderer} = require('./arc-preferences');
const {PayloadProcessor} = require('./lib/payload-processor');
const log = require('electron-log');
/**
 * A module responsible for storing / restoring latest request from user FS.
 */
class WorkspaceState extends ArcPreferencesRenderer {
  /**
   * @constructor
   *
   * @param {String} stateFile Location of workspace state file if diffrent
   * from default.
   */
  constructor(stateFile) {
    super();
    log.info('Initializing workspace state class.');
    this.initialized = false;
    if (stateFile) {
      this.dataFile = this._resolvePath(stateFile);
    } else {
      this.dataFile = path.join(this.userSettingsDir, 'workspace.json');
    }
    log.info('State file is ', this.dataFile);
    this._data = undefined;
  }
  /**
   * Restores state file.
   *
   * @return {Promise} Promise resolved to content of the file.
   */
  restore() {
    if (this._data) {
      return Promise.resolve(this._data);
    }
    log.info('Restoring workspace data from', this.dataFile);
    return this.restoreFile(this.dataFile)
    .then((data) => {
      log.info('Restored workspace data from', this.dataFile);
      this.initialized = true;
      this._data = data;
      return data;
    })
    .catch((cause) => {
      log.info('Unable to restore workspace data', cause);
    });
  }
  /**
   * Stores current data to state file.
   *
   * @param {Object} data Store file contents
   * @return {Promise} Promise resolved when file is saved.
   */
  store(data) {
    if (!this.initialized) {
      return;
    }
    log.info('Storing workspace data to', this.dataFile);
    return this.storeFile(this.dataFile, data);
  }
  /**
   * Updates state of the request entries.
   *
   * @param {Object} requests List of ARC requests objects.
   * @return {Promise} Promise resolved when data is saved.
   */
  updateRequestsSate(requests) {
    if (!this.initialized) {
      return;
    }
    log.info('Updating workspace request data...');
    if (!this._data) {
      this._data = {};
    }
    return this._processRequests(requests)
    .then((data) => {
      this._data.requests = data;
      return this.store(this._data);
    });
  }
  /**
   * Updates selected request data.
   *
   * @param {Number} selected Selected request
   * @return {Promise} Promise resolved when data is saved.
   */
  updateSelected(selected) {
    if (!this.initialized) {
      return;
    }
    log.info('Updating workspace selection data...');
    if (!this._data) {
      this._data = {};
    }
    this._data.selected = selected;
    return this.store(this._data);
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
  _processRequests(requests, index, result) {
    index = index || 0;
    result = result || [];
    let item = requests[index];
    if (!item) {
      return Promise.resolve(result);
    }
    let processor = new PayloadProcessor(item);
    return processor.payloadToString()
    .then((request) => {
      result[index] = request;
      index++;
      return this._processRequests(requests, index, result);
    });
  }
}
exports.WorkspaceState = WorkspaceState;
