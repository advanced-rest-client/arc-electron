const { app } = require('electron');
const path = require('path');
const log = require('../../../main/logger');
const fs = require('fs-extra');
const { ThemeInfo } = require('../../../main/models/theme-info');
const { PluginManager } = require('live-plugin-manager');
const semver = require('semver');
/**
 * This is the main process interface.
 *
 * Manages themes packages. Installs, uninstalls and updates themes from it's
 * repository or npm registry.
 */
class ThemePluginsManager {
  /**
   * Creates, if needed, the PluginManager and returns it.
   * @return {PluginManager}
   */
  get pluginManager() {
    if (!this.__pluginManager) {
      this.__pluginManager = new PluginManager({
        cwd: process.env.ARC_THEMES,
        pluginsPath: process.env.ARC_THEMES
      });
    }
    return this.__pluginManager;
  }
  /**
   * Creates a model for theme info file.
   * @return {ThemeInfo}
   */
  get themeInfo() {
    return new ThemeInfo();
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
   * @param {String} name NPM name or Github repo. Local paths are symlink
   * to target location.
   * @param {String} version Theme version to install.
   * @return {Promise}
   */
  async install(name, version) {
    let message = 'Installing theme: ' + name;
    if (version) {
      message += ', version ' + version;
    }
    log.info(message);
    let info = await this._installPackage(name, version);
    info = await this._createThemeInfo(name, info);
    return await this._addThemeEntry(info);
  }
  /**
   * Implementation of installation process.
   * If the `name` argument represents a pato to a directory then
   * local installation is performed. PluginManager is used otherwise.
   * @param {String} name NPM name or Github repo. Local paths are symlink
   * to target location.
   * @param {String} version Theme version to install.
   * @return {Promise<Object>} Promise resolved to theme info object
   */
  _installPackage(name, version) {
    try {
      fs.accessSync(name, fs.constants.R_OK | fs.constants.X_OK);
      return this._installLocalPackage(name);
    } catch (_) {
      return this._installRemotePackage(name, version);
    }
  }
  /**
   * Creates a symlink from a local package to themes directory.
   * @param {String} name Package location.
   * @return {Promise<Object>} Promise resolved to theme info object
   */
  _installLocalPackage(name) {
    log.info('Installing theme from local sources...');
    const info = {
      isSymlink: true
    };
    return fs.readJson(path.join(name, 'package.json'))
    .catch(() => {
      throw new Error('Unable to read package.json file of the theme.');
    })
    .then((pkg) => {
      info.name = pkg.name;
      info.version = pkg.version;
      info.location = path.join(process.env.ARC_THEMES, pkg.name);
      if (pkg.main) {
        info.mainFile = path.join(info.location, pkg.main);
      } else {
        info.mainFile = path.join(info.location, path.basename(name));
      }
      return this._ensureSymlinkPath(info.location);
    })
    .then(() => fs.symlink(path.resolve(name), path.resolve(info.location), 'dir'))
    .then(() => {
      log.info('Installation complete.');
      return info;
    });
  }
  /**
   * Ensures the path to create a symlint is created.
   * @param {String} location Symlink location
   * @return {Promise}
   */
  _ensureSymlinkPath(location) {
    location = path.dirname(location);
    return fs.ensureDir(location);
  }
  /**
   * Uses PluginManager to install package from npm or GitHub.
   * @param {String} name NPM name or Github repo. Local paths are symlink
   * to target location.
   * @param {String} version Theme version to install.
   * @return {Promise<Object>} Promise resolved to theme info object
   */
  _installRemotePackage(name, version) {
    log.info('Installing theme from remote sources...');
    return this.pluginManager.install(
      ...this._prepareSourceAndVersion(name, version));
  }
  /**
   * Uninstalls package and removes it from the registry file.
   * @param {String} name Name of the package.
   * @return {Promise}
   */
  async uninstall(name) {
    log.info('Uninstalling theme ' + name);
    await this._uninstallPackage(name);
    await this._removeThemeEntry(name);
  }
  /**
   * Implementation of removing process.
   * @param {String} name NPM name or Github repo. Local paths are symlink
   * to target location.
   * @return {Promise<Object>} Promise resolved to theme info object
   */
  async _uninstallPackage(name) {
    const info = await this.getInfo(name);
    if (!info) {
      throw new Error(`Package ${name} is not installed.`);
    }
    if (info.isSymlink) {
      await fs.remove(info.location);
    } else {
      await this.pluginManager.uninstall(info.name);
    }
    return info;
  }
  /**
   * Updates themes from passed list.
   * @param {Array<Object>} data A list of objects with `name` and `version`
   * proeprtires.
   * @return {Promise}
   */
  async update(data) {
    const result = [];
    for (let i = 0, len = data.length; i < len; i++) {
      const { name, version } = data[i];
      try {
        await this._installPackage(name, version);
        await this._updateVersionInfo(name, version);
        result[result.length] = {
          error: false,
          name
        };
      } catch (e) {
        result[result.length] = {
          error: true,
          message: e.message,
          name
        };
      }
    }
    return result;
  }
  /**
   * Reads information from the theme registry abiut the theme.
   * @param {String} name Name of the package (_id in info object).
   * @return {Promise<Object>} Resolves to theme info object.
   */
  async getInfo(name) {
    const info = await this.themeInfo.load();
    const { themes } = info;
    for (let i = 0, len = themes.length; i < len; i++) {
      if (themes[i].name === name || themes[i]._id === name) {
        return themes[i];
      }
    }
  }
  /**
   * Checks for updates to all installed packages.
   * @return {Promise<Object>} Promise resolved to a map of package names and
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

  async _processCandidateUpdateInfo(candidate) {
    const { name, version } = candidate;
    /* eslint-disable require-atomic-updates */
    let result;
    try {
      result = await this.checkUpdateAvailable(name, version);
      await this._updateUpdateTime(name);
    } catch (e) {
      log.warn(`Unable to get theme package info ${e.message}`);
    }
    return result;
  }

  async _updateUpdateTime(name) {
    const store = this.themeInfo;
    const info = await store.load();
    const { themes } = info;
    for (let i = 0, len = themes.length; i < len; i++) {
      if (themes[i].name === name || themes[i]._id === name) {
        themes[i].updateCheck = Date.now();
        return await store.store();
      }
    }
  }

  async _updateVersionInfo(name, version) {
    const store = this.themeInfo;
    const info = await store.load();
    const { themes } = info;
    for (let i = 0, len = themes.length; i < len; i++) {
      if (themes[i].name === name || themes[i]._id === name) {
        themes[i].version = version;
        return await store.store();
      }
    }
  }

  async checkUpdateAvailable(name, version) {
    const names = this._prepareSourceAndVersion(name, version);
    const localInfo = await this.getInfo(name);
    const remoteInfo = await this.pluginManager.queryPackage(names[0]);
    if (!this._compareVersions(remoteInfo, localInfo)) {
      return;
    }
    if (this._compareEngines(remoteInfo)) {
      return remoteInfo;
    }
  }

  _compareVersions(remoteInfo, localInfo) {
    return semver.gt(remoteInfo.version, localInfo.version);
  }

  _compareEngines(remoteInfo) {
    const engines = remoteInfo.engines;
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
   * @param {String} source NPM name or Github repo
   * @param {String} version Theme version to install.
   * @return {Array<String>} First item is the source and version the other.
   */
  _prepareSourceAndVersion(source, version) {
    if (source.indexOf('/') !== -1 && source[0] !== '@') {
      if (!version) {
        version = 'master';
      }
      version = source + '#' + version;
    }
    return [source, version];
  }
  /**
   * Creates a theme info object from both `live-plugin-manager` install response
   * and installed theme package file.
   * @param {String} id
   * @param {Object} info
   * @return {Object} An object to be stored in theme info file.
   */
  async _createThemeInfo(id, info) {
    const result = {
      _id: id,
      name: info.name,
      version: info.version,
      location: info.location,
      mainFile: info.mainFile,
      title: info.name,
      description: '',
      isSymlink: info.isSymlink
    };
    const pkg = await fs.readJson(path.join(info.location, 'package.json'));
    if (pkg.themeTitle) {
      result.title = pkg.themeTitle;
    }
    if (pkg.description) {
      result.description = pkg.description;
    }
    return result;
  }
  /**
   * Adds theme info object to themes registry file.
   * @param {Object} info An object to add.
   * @return {Promise<Object>} Promise resolve to the info object.
   */
  async _addThemeEntry(info) {
    const store = this.themeInfo;
    const data = await store.load();
    const { themes } = data;
    themes.push(info);
    await store.store();
    return info;
  }

  async _removeThemeEntry(name) {
    const store = this.themeInfo;
    const info = await store.load();
    const { themes } = info;
    for (let i = 0, len = themes.length; i < len; i++) {
      if (themes[i].name === name || themes[i]._id === name) {
        themes.splice(i, 1);
        return store.store();
      }
    }
  }
}

module.exports.ThemePluginsManager = ThemePluginsManager;
