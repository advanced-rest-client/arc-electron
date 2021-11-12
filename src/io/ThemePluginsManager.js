/* eslint-disable no-await-in-loop */
/* eslint-disable no-bitwise */
/* eslint-disable no-param-reassign */
import { app } from 'electron';
import path from 'path';
import fs from 'fs-extra';
import { PluginManager } from 'live-plugin-manager';
import semver from 'semver';
import { ThemeInfo } from './models/ThemeInfo.js';
import { logger } from './Logger.js';

/** @typedef {import('@advanced-rest-client/events').Theme.ArcThemeStore} ArcThemeStore */
/** @typedef {import('@advanced-rest-client/events').Theme.InstalledTheme} InstalledTheme */
/** @typedef {import('live-plugin-manager').IPluginInfo} IPluginInfo */
/** @typedef {import('live-plugin-manager').PackageInfo} PackageInfo */

export const pluginManagerSymbol = Symbol('pluginManager');

export class ThemePluginsManager {
  /**
   * Creates a model for theme info file.
   * @return {ThemeInfo}
   */
  get themeInfo() {
    return new ThemeInfo();
  }

  constructor() {
    this[pluginManagerSymbol] = new PluginManager({
      cwd: process.env.ARC_THEMES,
      pluginsPath: process.env.ARC_THEMES
    });
  }

  /**
   * Resolves file path to correct path if it's starts with `~`.
   *
   * @param {String} file Settings file path
   * @return {String} Path to the file.
   */
  resolvePath(file) {
    if (file && file[0] === '~') {
      file = app.getPath('home') + file.substr(1);
    }
    return file;
  }
  
  /**
   * Installs a theme package to the themes directory.
   * @param {string} name NPM name or Github repo. Local paths are symlink to target location.
   * @param {String=} version Theme version to install.
   * @returns {Promise<InstalledTheme>}
   */
  async install(name, version) {
    let message = `Installing theme: ${name}`;
    if (version) {
      message += `, version ${version}`;
    }
    logger.info(message);
    const info = await this._installPackage(name, version);
    await this.themeInfo.addTheme(info);
    return info;
  }
  
  /**
   * Implementation of installation process.
   * 
   * If the `name` argument represents a path to a directory then
   * local installation is performed. PluginManager is used otherwise.
   * 
   * @param {string} name NPM name or Github repo. Local paths are symlink
   * to target location.
   * @param {string} version Theme version to install.
   * @return {Promise<InstalledTheme>} Promise resolved to theme info object
   */
  _installPackage(name, version) {
    try {
      fs.accessSync(name, fs.constants.R_OK | fs.constants.X_OK);
      return this._installLocalPackage(name);
    } catch (_) {
      // ...
    }
    return this._installRemotePackage(name, version);
  }

  /**
   * Creates a symlink from a local package to themes directory.
   * @param {string} name Package location.
   * @return {Promise<InstalledTheme>} Promise resolved to theme info object
   */
  async _installLocalPackage(name) {
    logger.info('Installing theme from local sources...');
    let pkg;
    try {
      pkg = await fs.readJson(path.join(name, 'package.json'));
    } catch (e) {
      logger.error(e);
      throw new Error('Unable to read package.json file of the theme.');
    }

    const location = path.join(process.env.ARC_THEMES, pkg.name);
    let mainFile;
    if (pkg.main) {
      mainFile = path.join(location, pkg.main);
    } else {
      mainFile = path.join(location, path.basename(name));
    }

    const info = /** @type InstalledTheme */ ({
      isSymlink: true,
      _id: pkg.name,
      name: pkg.name,
      version: pkg.version,
      location,
      mainFile,
      description: pkg.description,
      isDefault: false,
    });
    if (pkg.themeTitle) {
      info.title = pkg.themeTitle;
    }
    
    await this._ensureSymlinkPath(location);
    await fs.symlink(path.resolve(name), path.resolve(info.location), 'dir');
    
    logger.info('Installation complete.');
    return info;
  }

  /**
   * Ensures the path to create a symlink is created.
   * @param {string} location Symlink location
   * @return {Promise<void>}
   */
  async _ensureSymlinkPath(location) {
    location = path.dirname(location);
    await fs.ensureDir(location);
  }

  /**
   * Uses PluginManager to install package from npm or GitHub.
   * @param {string} name NPM name or Github repo. Local paths are symlink
   * to target location.
   * @param {string} version Theme version to install.
   * @return {Promise<InstalledTheme>} Promise resolved to theme info object
   */
  async _installRemotePackage(name, version) {
    logger.info('Installing theme from remote sources...');
    const [n, v] = this._prepareSourceAndVersion(name, version);
    try {
      const result = await this[pluginManagerSymbol].install(n, v);
      const info = /** @type InstalledTheme */ ({
        isSymlink: false,
        _id: result.name,
        name: result.name,
        version: result.version,
        location: result.location,
        mainFile: result.mainFile,
        title: '',
        description: '',
        isDefault: false,
      });
      return info;
    } catch (e) {
      logger.error(e);
      throw e;
    }
  }

  /**
   * Uninstalls package and removes it from the registry file.
   * @param {string} name Name of the package.
   * @return {Promise<void>}
   */
  async uninstall(name) {
    logger.info(`Uninstalling theme ${name}`);
    await this._uninstallPackage(name);
    await this.themeInfo.removeTheme(name);
  }

  /**
   * Implementation of removing process.
   * @param {string} name NPM name or Github repo. Local paths are symlink
   * to target location.
   * @return {Promise<InstalledTheme>} Promise resolved to theme info object
   */
  async _uninstallPackage(name) {
    const info = await this.themeInfo.readTheme(name);
    if (!info) {
      throw new Error(`Package ${name} is not installed.`);
    }
    if (info.isSymlink) {
      await fs.remove(info.location);
    } else {
      await this[pluginManagerSymbol].uninstall(info.name);
    }
    return info;
  }

  /**
   * Updates themes from passed list.
   * @param {{name: string, version: string}[]} data A list of objects with `name` and `version`
   * @returns {Promise<{name: string, error: boolean, message?: string}[]>} Update result.
   */
  async update(data) {
    const result = [];
    for (let i = 0, len = data.length; i < len; i++) {
      const { name, version } = data[i];
      try {
        await this._installPackage(name, version);
        await this.themeInfo.setThemeVersion(name, version);
        result[result.length] = {
          error: false,
          name,
        };
      } catch (e) {
        result[result.length] = {
          error: true,
          message: e.message,
          name,
        };
      }
    }
    return result;
  }
  
  
  /**
   * Checks for updates to all installed packages.
   * @return {Promise<PackageInfo[]>} Promise resolved to a map of package names and
   * info objects downloaded from the remote server. Only packages with
   * update available are returned.
   */
  async checkForUpdates() {
    const candidates = await this._getUpdateCandidates();
    const result = [];
    for (let i = 0, len = candidates.length; i < len; i++) {
      const item = candidates[i];
      const data = await this._processCandidateUpdateInfo(item);
      if (data) {
        result[result.length] = data;
      }
    }
    return result;
  }

  /**
   * @returns {Promise<{name: string, version: string}[]>} The list of installed packages to check for the update.
   */
  async _getUpdateCandidates() {
    const now = Date.now();
    const info = await this.themeInfo.load();
    const { themes } = info;
    const names = [];
    themes.forEach((item) => {
      if (item.isSymlink) {
        return;
      }
      if (item.updateCheck) {
        const delta = now - item.updateCheck;
        if (delta < 7.2e+6) {
          // 2 hours
          return;
        }
      }
      names[names.length] = {
        name: item.name,
        version: item.version
      };
    });
    return names;
  }

  /**
   * 
   * @param {{name: string, version: string}} candidate The package to check for update.
   * @returns {Promise<PackageInfo|undefined>}
   */
  async _processCandidateUpdateInfo(candidate) {
    const { name, version } = candidate;
    /* eslint-disable require-atomic-updates */
    let result;
    try {
      result = await this.checkUpdateAvailable(name, version);
      await this.themeInfo.setUpdateCheckTime(name);
    } catch (e) {
      logger.warn(`Unable to get theme package info ${e.message}`);
    }
    return result;
  }

  /**
   * Checks whether an update is available for the theme.
   * @param {string} name The theme `name`
   * @param {string} version The current version
   * @returns {Promise<PackageInfo|undefined>}
   */
  async checkUpdateAvailable(name, version) {
    const names = this._prepareSourceAndVersion(name, version);
    const localInfo = await this.themeInfo.readTheme(name);
    const remoteInfo = await this[pluginManagerSymbol].queryPackage(names[0]);
    if (!this._compareVersions(remoteInfo, localInfo)) {
      return undefined;
    }
    if (this._compareEngines(remoteInfo)) {
      return remoteInfo;
    }
    return undefined;
  }


  /**
   * Checks whether the version of the remove package is higher then the local package. 
   * @param {PackageInfo} remoteInfo Remote package version
   * @param {InstalledTheme} localInfo Local package version
   * @returns {boolean}
   */
  _compareVersions(remoteInfo, localInfo) {
    return semver.gt(remoteInfo.version, localInfo.version);
  }

  /**
   * @param {PackageInfo} remoteInfo 
   * @returns {boolean}
   */
  _compareEngines(remoteInfo) {
    // @ts-ignore
    const { engines } = remoteInfo;
    if (!engines || !engines.arc) {
      return true;
    }
    const engine = engines.arc;
    const version = process.env.npm_package_version;
    if (semver.validRange(engine)) {
      return semver.satisfies(version, engine);
    }
    return true;
  }

  /**
   * Processes source and version properties to produce right input for
   * `live-plugin-manager`
   * @param {string} source NPM name or Github repo
   * @param {string=} version Theme version to install.
   * @return {string[]} First item is the source and version the other.
   */
  _prepareSourceAndVersion(source, version) {
    if (source.indexOf('/') !== -1 && source[0] !== '@') {
      if (!version) {
        version = 'master';
      }
      version = `${source}#${version}`;
    }
    return [source, version];
  }
}
