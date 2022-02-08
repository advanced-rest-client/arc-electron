import { ThemeDefaults } from './defaults/ThemeDefaultsNew.js';
import { WorkspaceDefaults } from  './defaults/WorkspaceDefaults.js';
import { DataStore } from  './defaults/DataStore.js';

/** @typedef {import('./WindowsManager').WindowsManager} WindowsManager */

/**
 * Class responsible for keeping application base environment stable.
 *
 * It copies default resources to it's default locations and sets up
 * the application environment.
 */
export class ApplicationDefaults {
  /**
   * Prepares environment files while opening the application.
   * Copies application themes to themes location.
   * @return {Promise}
   */
  async prepareEnvironment() {
    const td = new ThemeDefaults();
    await td.prepareEnvironment();
    const wd = new WorkspaceDefaults();
    await wd.prepareEnvironment();
  }

  /**
   * @param {WindowsManager} vm
   */
  async prepareDatabaseUpgrade(vm) {
    const db = new DataStore(vm);
    await db.ensureDataUpgraded();
  }
}
