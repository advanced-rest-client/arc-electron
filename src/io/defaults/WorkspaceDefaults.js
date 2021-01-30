import fs from 'fs-extra';
import path from 'path';
import { logger } from '../Logger.js';

/**
 * A class that is responsible for setting up theme defaults.
 */
export class WorkspaceDefaults {
  /**
   * Ensures that the workspace
   *
   * @return {Promise} Resolved promise when the defaults are stored.
   */
  async prepareEnvironment() {
    logger.debug('Preparing ARC workspace.');
    await this._ensureWorkspaceDir();
  }

  async _ensureWorkspaceDir() {
    const dir = process.env.ARC_WORKSPACE_PATH;
    const file = path.join(dir, 'workspace.json');
    const exists = await fs.pathExists(dir);
    if (exists) {
      return;
    }
    logger.silly('Workspace directory does not exists. Creating.');
    await fs.ensureDir(dir);
    const fileExists = await fs.pathExists(file);
    if (fileExists) {
      return;
    }
    logger.silly('Workspace default file does not exists. Creating.');
    await fs.ensureFile(file);
  }
}
