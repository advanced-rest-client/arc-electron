import fs from 'fs-extra';
import { logger } from '../Logger.js';

/** @typedef {import('@advanced-rest-client/events').HostRule.HostRule} HostRule */

const WINDOWS = process.platform === 'win32';

export class Hosts {
  /**
   * @returns {string} The location of the OS' hosts file.
   */
  get file() {
    return WINDOWS ? 'C:/Windows/System32/drivers/etc/hosts' : '/etc/hosts';
  }

  /**
   * Reads the contents of the hosts file.
   * It returns empty string when the file cannot be found or accessed.
   */
  async contents() {
    const { file } = this;
    logger.silly(`reading OS hosts file from ${file}`);
    let contents = '';
    try {
      contents = await fs.readFile(file, 'utf8');
    } catch (e) {
      // ...
      logger.debug(`Unable to read the hosts file: ${e.message}`);
    }
    return contents;
  }

  /**
   * @param {string} contents The hosts file contents.
   * @returns {HostRule[]} The list of hosts rules.
   */
  parse(contents) {
    /** @type HostRule[] */
    const result = [];

    contents.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('#')) {
        return;
      }
      const matches = /^\s*?(.+?)\s+(.+?)\s*$/.exec(trimmed);
      if (matches && matches.length === 3) {
        const from = matches[1];
        const to = matches[2];
        const item = /** @type HostRule */ ({
          enabled: true,
          from,
          to,
        });
        result.push(item);
      }
    });
    return result;
  }

  /**
   * Reads and parses the OS' hosts file.
   * @returns {Promise<HostRule[]>} The list of hosts rules. The list is empty when error reading the file.
   */
  async read() {
    const contents = await this.contents();
    return this.parse(contents);
  }
}
