import { app } from 'electron';
import path from 'path';
import fs from 'fs-extra';
import { logger } from './Logger.js';

export const settingsFileSymbol = Symbol('settingsFileSymbol');
export const themesBasePathSymbol = Symbol('themesBasePathSymbol');
export const themesSettingsSymbol = Symbol('themesSettingsSymbol');
export const workspacePathSymbol = Symbol('workspacePathSymbol');
export const stateFileSymbol = Symbol('stateFileSymbol');

export class ApplicationPaths {
  get settingsFile() {
    return this[settingsFileSymbol];
  }

  get themesBasePath() {
    return this[themesBasePathSymbol];
  }

  get themesSettings() {
    return this[themesSettingsSymbol];
  }

  get stateFile() {
    return this[stateFileSymbol];
  }

  constructor() {
    /** 
     * The path to the application settings file
     * @type {string}
     */
    this[settingsFileSymbol] = undefined;
    /** 
     * The path to the application themes folder
     * @type {string}
     */
    this[themesBasePathSymbol] = undefined;
    /** 
     * The path to the application themes settings file.
     * @type {string}
     */
    this[themesSettingsSymbol] = undefined;
    /** 
     * The path to the application workspace directory
     * @type {string}
     */
    this[workspacePathSymbol] = undefined;
    /** 
     * The path to the application state file where other than "settings" preferences are stored.
     * @type {string}
     */
    this[stateFileSymbol] = undefined;
  }

  /**
   * Resolves file path to a correct path if it's starts with `~`.
   *
   * @param {string} file The file path
   * @return {string} Resolved path to the file.
   */
  resolvePath(file) {
    let result = file;
    if (result[0] === '~') {
      result = app.getPath('home') + result.substr(1);
    }
    return result;
  }

  /**
   * @returns {string} a location to the application directory depending on the OS
   */
  getAppDirectory() {
    switch (process.platform) {
      case 'darwin':
        return process.execPath.substring(0, process.execPath.indexOf('.app') + 4);
      case 'linux':
      case 'win32':
        return path.join(process.execPath, '..');
      default: return '';
    }
  }

  /**
   * Safely checks whether the current user has access to the location.
   * @param {string} dir the location to test
   * @returns {boolean} a location to the application directory depending on the OS
   */
  hasWriteAccess(dir) {
    const testFilePath = path.join(dir, 'write.test');
    try {
      fs.writeFileSync(testFilePath, new Date().toISOString(), { flag: 'w+' });
      fs.unlinkSync(testFilePath);
      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * Initializes settings file location in the application.
   * @param {string=} file Settings file location.
   */
  setSettingsFile(file) {
    let loc = file;
    if (loc) {
      loc = this.resolvePath(loc);
      const dir = path.dirname(loc);
      try {
        fs.ensureDirSync(dir);
        this[settingsFileSymbol] = loc;
      } catch (_) {
        logger.error(`Insufficient permission to settings file folder "${dir}".`);
      }
    }
    if (!this[settingsFileSymbol]) {
      this[settingsFileSymbol] = path.join(process.env.ARC_HOME, 'settings.json');
    }
    process.env.ARC_SETTINGS_FILE = this[settingsFileSymbol];
    logger.debug(`ARC_SETTINGS_FILE is set to: ${process.env.ARC_SETTINGS_FILE}`);
  }

  /**
   * Sets a home location for the application.
   */
  setHome() {
    const portableHomePath = path.join(this.getAppDirectory(), '..', '.arc');
    if (fs.pathExistsSync(portableHomePath)) {
      if (this.hasWriteAccess(portableHomePath)) {
        process.env.ARC_HOME = portableHomePath;
      } else {
        logger.error(`Insufficient permission to portable ARC_HOME "${portableHomePath}".`);
      }
    }
    if (!process.env.ARC_HOME) {
      process.env.ARC_HOME = app.getPath('userData');
    }
    logger.debug(`ARC_HOME is set to: ${process.env.ARC_HOME}`);
  }

  /**
   * Sets locations related to themes
   * @param {string=} themesPath A path to the themes directory
   * @param {string=} [themesSettingsFile='themes-info.json'] A path to the themes settings file.
   */
  setThemesPath(themesPath, themesSettingsFile='themes-info.json') {
    if (themesPath) {
      const resolved = this.resolvePath(themesPath);
      try {
        fs.ensureDirSync(resolved);
        this[themesBasePathSymbol] = resolved;
      } catch (_) {
        logger.error(`Insufficient permission to themes installation location "${resolved}".`);
      }
    }

    if (!this[themesBasePathSymbol]) {
      this[themesBasePathSymbol] = path.join(process.env.ARC_HOME, 'themes-esm');
    }
    
    this[themesSettingsSymbol] = path.join(this[themesBasePathSymbol], themesSettingsFile);
    process.env.ARC_THEMES = this[themesBasePathSymbol];
    process.env.ARC_THEMES_SETTINGS = this[themesSettingsSymbol];
    logger.debug(`ARC_THEMES is set to: ${process.env.ARC_THEMES}`);
    logger.debug(`ARC_THEMES_SETTINGS is set to: ${process.env.ARC_THEMES_SETTINGS}`);
  }

  /**
   * Sets the default location of the workspace data,
   * @param {string=} workspacePath A path to the workspace directory
   */
  setWorkspacePath(workspacePath) {
    if (workspacePath) {
      const resolved = this.resolvePath(workspacePath);
      try {
        this[workspacePathSymbol] = resolved;
      } catch (_) {
        logger.error(`Insufficient permission to themes installation location "${resolved}".`);
      }
    }
    if (!this[workspacePathSymbol]) {
      this[workspacePathSymbol] = path.join(process.env.ARC_HOME, 'workspace');
    }
    process.env.ARC_WORKSPACE_PATH = this[workspacePathSymbol];
    logger.debug(`ARC_WORKSPACE_PATH is set to: ${process.env.ARC_WORKSPACE_PATH}`);
  }

  /**
   * Initializes state file location in the application.
   * @param {string=} file State file location.
   */
  setStateFile(file) {
    let loc = file;
    if (loc) {
      loc = this.resolvePath(loc);
      const dir = path.dirname(loc);
      try {
        fs.ensureDirSync(dir);
        this[stateFileSymbol] = loc;
      } catch (_) {
        logger.error(`Insufficient permission to state file folder "${dir}".`);
      }
    }
    if (!this[stateFileSymbol]) {
      this[stateFileSymbol] = path.join(process.env.ARC_HOME, 'state.json');
    }
    process.env.ARC_STATE_FILE = this[stateFileSymbol];
    logger.debug(`ARC_STATE_FILE is set to: ${process.env.ARC_STATE_FILE}`);
  }
}
