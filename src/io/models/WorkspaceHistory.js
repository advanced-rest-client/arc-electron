import path from 'path';
import { ArcPreferences } from '../../common/ArcPreferences.js';
/**
 * A preferences class to store and read theme info file.
 */
export class WorkspaceHistory extends ArcPreferences {
  /**
   * @param {number=} limit The menu items list limit
   */
  constructor(limit=15) {
    super(path.join(process.env.ARC_HOME, 'workspace', 'workspace-history.json'));
    this.limit = limit;
  }

  async defaultSettings() {
    return {
      kind: 'ARC#WorkspaceHistory',
      entries: []
    };
  }
  /**
   * Sort function to sort history entries by time.
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
   * @return {Promise<Array|undefined>} List of entries or undefined if none found.
   */
  async loadEntries() {
    const data = await this.load();
    if (!data) {
      return undefined;
    }
    if (!Array.isArray(data.entries)) {
      return undefined;
    }
    if (!data.entries.length) {
      return undefined;
    }
    data.entries.sort(this.sortEntries);
    return data.entries;
  }

  /**
   * Adds history entry to the stored list.
   * @param {string} filePath A workspace file path location.
   * @return {Promise<void>}
   */
  async addEntry(filePath) {
    if (!filePath) {
      throw new Error('File path argument not set.');
    }
    const data = await this.load();
    if (!Array.isArray(data.entries)) {
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
    const data = await this.load();
    data.entries = [];
    await this.store();
  }
}
