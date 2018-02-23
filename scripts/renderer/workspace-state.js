const path = require('path');
const {ArcPreferencesRenderer} = require('./arc-preferences');
const log = require('electron-log');
/**
 * A module responsible for storing / restoring latest request from user FS.
 */
class WorkspaceState extends ArcPreferencesRenderer {
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

  restore() {
    if (this._data) {
      return Promise.resolve(this._data);
    }
    log.info('Restoring workspace data from', this.dataFile);
    return this.restoreFile(this.dataFile)
    .then(data => {
      log.info('Restored workspace data from', this.dataFile);
      this.initialized = true;
      this._data = data;
      return data;
    })
    .catch(cause => {
      log.info('Unable to restore workspace data', cause);
    });
  }

  store(data) {
    if (!this.initialized) {
      return;
    }
    log.info('Storing workspace data to', this.dataFile);
    return this.storeFile(this.dataFile, data);
  }

  updateRequestsSate(requests) {
    if (!this.initialized) {
      return;
    }
    log.info('Updating workspace request data...');
    if (!this._data) {
      this._data = {};
    }
    this._data.requests = requests;
    return this.store(this._data);
  }

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
}
exports.WorkspaceState = WorkspaceState;
