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
  prepareEnvironment() {
    log.debug('Preparing ARC workspace.');
    return this._ensureWorkspaceDir();
  }

  _ensureWorkspaceDir() {
    const dir = process.env.ARC_WORKSPACE_PATH;
    const file = path.join(dir, 'workspace.json');
    return fs.pathExists(dir)
    .then((exists) => {
      if (exists) {
        return;
      }
      log.silly('Workspace directory does not exists. Creating.');
      return fs.ensureDir(dir);
    })
    .then(() => fs.pathExists(file))
    .then((exists) => {
      if (exists) {
        return;
      }
      log.silly('Workspace default file does not exists. Creating.');
      return fs.ensureFile(file);
    });
  }
}
exports.WorkspaceDefaults = WorkspaceDefaults;
