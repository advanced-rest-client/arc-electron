import fs from 'fs-extra';
import path from 'path';

/**
 * This class moves data from old ARC installation to new one.
 * 
 * In ARC < 16 the renderer process was running from the `file:` scheme and without a hostname.
 * ARC 16 >= 16 runs from the `web-module:` protocol and `advanced-rest-client` host name. The downside of this change 
 * is that the origin has changed and all data sha to be moved from the old origin to the new one.
 */
export class DataStore {
  async ensureDataUpgraded() {
    const lockFile = path.join(process.env.ARC_HOME, '.db-moved-hostname');
    const lockExists = await fs.pathExists(lockFile);
    if (lockExists) {
      return;
    }
  }
}
