const fs = require('fs-extra');
const path = require('path');
const log = require('../logger');
/**
 * A class that is responsible for setting up theme defaults.
 */
class WorkspaceDefaults {
  /**
   * Ensures that the workspace
   *
   * @return {Promise} Resolved promise when the defaults are stored.
   */
  async prepareEnvironment() {
    log.debug('Preparing ARC workspace.');
    await this._ensureWorkspaceDir();
  }

  async _ensureWorkspaceDir() {
    const dir = process.env.ARC_WORKSPACE_PATH;
    const file = path.join(dir, 'workspace.json');
    const exists = await fs.pathExists(dir);
    if (exists) {
      return;
    }
    log.silly('Workspace directory does not exists. Creating.');
    await fs.ensureDir(dir);
    const fileExists = await fs.pathExists(file);
    if (fileExists) {
      return;
    }
    log.silly('Workspace default file does not exists. Creating.');
    await fs.ensureFile(file);
  }
}
exports.WorkspaceDefaults = WorkspaceDefaults;
