const path = require('path');
const {ArcPreferences} = require('./../main/arc-preferences');
/**
 * A module responsible for storing / restoring latest request from user FS.
 */
class WorkspaceState extends ArcPreferences {
  constructor() {
    super();
    this.dataFile = path.join(this.userSettingsDir, 'workspace.json');
    this._data = undefined;
  }

  restore() {
    if (this._data) {
      return Promise.resolve(this._data);
    }
    return this.restoreFile(this.dataFile)
    .then(data => {
      this._data = data;
      return data;
    });
  }

  store(data) {
    return this.storeFile(this.dataFile, data);
  }

  updateRequestsSate(requests) {
    if (!this._data) {
      this._data = {};
    }
    this._data.requests = requests;
    return this.store(this._data);
  }

  updateSelected(selected) {
    if (!this._data) {
      this._data = {};
    }
    this._data.selected = selected;
    return this.store(this._data);
  }
}
exports.WorkspaceState = WorkspaceState;
