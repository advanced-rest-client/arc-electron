const { ArcPreferences } = require('../../packages/arc-preferences');
const path = require('path');
/**
 * A preferences class to store and read theme info file.
 */
class WorkspaceHistory extends ArcPreferences {
  constructor(limit) {
    super({
      file: path.join(process.env.ARC_HOME, 'workspace', 'workspace-history.json')
    });
    this.limit = limit || 15;
  }

  async defaultSettings() {
    return {
      kind: 'ARC#WorkspaceHistory',
      entries: []
    };
  }
  /**
   * Sort function to sort history entirs by time.
   * @param {Object} a
   * @param {Object} b
   * @return {Number}
   */
  sortEntries(a, b) {
    if (a.used > b.used) {
      return -1;
    }
    if (a.used < b.used) {
      return 1;
    }
    return 0;
  }
  /**
   * Loads list of history entires from the configuration file.
   * @return {Array|undefined} List of entries or undefined if none found.
   */
  async loadEntries() {
    const data = await this.load();
    if (!data) {
      return;
    }
    if (!(data.entries instanceof Array)) {
      return;
    }
    if (!data.entries.length) {
      return;
    }
    data.entries.sort(this.sortEntries);
    return data.entries;
  }

  /**
   * Adds history entry to the stored list.
   * @param {String} filePath A workspace file path location.
   * @return {Promise}
   */
  async addEntry(filePath) {
    if (!filePath) {
      throw new Error('File path argument not set.');
    }
    let data = await this.load();
    if (!data) {
      data = {};
      this.__settings = data;
    }
    if (!(data.entries instanceof Array)) {
      data.entries = [];
    }
    const index = data.entries.findIndex((item) => item.file === filePath);
    if (index === -1) {
      data.entries.push({
        used: Date.now(),
        file: filePath
      });
    } else {
      data.entries[index].used = Date.now();
    }
    data.entries.sort(this.sortEntries);
    if (data.entries.length > this.limit) {
      data.entries.pop();
    }
    await this.store();
  }
  /**
   * Clears entries history.
   * @return {Promise}
   */
  async clearHistory() {
    let data = this.load();
    if (!data) {
      data = {};
      this.__settings = data;
    }
    data.entries = [];
    await this.store();
  }
}
module.exports.WorkspaceHistory = WorkspaceHistory;
