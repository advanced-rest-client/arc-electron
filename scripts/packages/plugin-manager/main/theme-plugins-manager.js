const {app} = require('electron');
const path = require('path');
const log = require('electron-log');
const fs = require('fs-extra');
const {ThemeInfo} = require('./theme-info');
const {PluginManager} = require('live-plugin-manager');
const semver = require('semver');
/**
 * This is the main process interface.
 *
 * Manages themes packages. Installs, uninstalls and updates themes from it's
 * repository or npm registry.
 */
class ThemePluginsManager {
  /**
   * @param {?String} basePath Themes base location. If not set the default
   * path is used.
   */
  constructor(basePath) {
    /**
     * Base path to the themes folder.
     * @type {String}
     */
    this.themesBasePath = this.resolvePath(basePath) ||
      path.join(app.getPath('userData'), 'themes');
    /**
     * Location of the installed themes info file.
     * @type {String}
     */
    this.infoFilePath = path.join(this.themesBasePath, 'themes-info.json');
  }
  /**
   * Creates, if needed, the PluginManager and returns it.
   * @return {PluginManager}
   */
  get pluginManager() {
    if (!this.__pluginManager) {
      this.__pluginManager = new PluginManager({
        cwd: this.themesBasePath,
        pluginsPath: this.themesBasePath
      });
    }
    return this.__pluginManager;
  }
  /**
   * Creates a model for theme info file.
   * @return {ThemeInfo}
   */
  get themeInfo() {
    return new ThemeInfo(this.infoFilePath);
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
  install(name, version) {
    let message = 'Installing theme: ' + name;
    if (version) {
      message += ', version ' + version;
    }
    log.info(message);
    return this._installPackage(name, version)
    .then((info) => this._createThemeInfo(name, info))
    .then((info) => this._addThemeEntry(info));
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
      info.location = path.join(this.themesBasePath, pkg.name);
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
  uninstall(name) {
    log.info('Uninstalling theme ' + name);
    return this._uninstallPackage(name)
    .then(() => this._removeThemeEntry(name));
  }
  /**
   * Implementation of removing process.
   * @param {String} name NPM name or Github repo. Local paths are symlink
   * to target location.
   * @return {Promise<Object>} Promise resolved to theme info object
   */
  _uninstallPackage(name) {
    return this.getInfo(name)
    .then((info) => {
      if (!info) {
        throw new Error(`Package ${name} is not installed.`);
      }
      if (info.isSymlink) {
        return fs.remove(info.location);
      }
      return this.pluginManager.uninstall(info.name);
    });
  }
  /**
   * Updates themes from passed list.
   * @param {Object} info A map of theme name and version.
   * Version is optional and if not set it installs latest version.
   * @return {Promise}
   */
  update(info) {
    const data = Object.keys(info).map((name) => {
      return {
        name,
        version: info[name]
      };
    });
    return this._updatesQueue(data);
  }

  _updatesQueue(queue, result) {
    if (!result) {
      result = {};
    }
    const item = queue.shift();
    if (!item) {
      return Promise.resolve(result);
    }
    return this.install(item.name, item.version)
    .then(() => {
      result[item.name] = {
        error: false
      };
    })
    .catch((cause) => {
      result[item.name] = {
        error: true,
        message: cause.message
      };
    })
    .then(() => this._updatesQueue(queue, result));
  }
  /**
   * Reads information from the theme registry abiut the theme.
   * @param {String} name Name of the package (_id in info object).
   * @return {Promise<Object>} Resolves to theme info object.
   */
  getInfo(name) {
    return this.themeInfo.load()
    .then((themes) => {
      for (let i = 0, len = themes.length; i < len; i++) {
        if (themes[i]._id === name) {
          return themes[i];
        }
      }
    });
  }
  /**
   * Checks for updates to all installed packages.
   * @return {Promise<Object>} Promise resolved to a map of package names and
   * info objects downloaded from the remote server. Only packages with
   * update available are returned.
   */
  checkForUpdates() {
    return this._getUpdateCandidates()
    .then((names) => this._updatesInfoQueue(names));
  }

  _getUpdateCandidates() {
    const now = Date.now();
    return this.themeInfo.load()
    .then((themes) => {
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
        names[names.length] = item._id;
      });
      return names;
    });
  }

  _updatesInfoQueue(queue, result) {
    if (!result) {
      result = {};
    }
    const name = queue.shift();
    if (!name) {
      return Promise.resolve(result);
    }

    return this.checkUpdateAvailable(name)
    .then((info) => {
      if (info) {
        result[name] = info;
      }
      return this._updateUpdateTime(name);
    })
    .catch(() => {})
    .then(() => this._updatesInfoQueue(queue, result));
  }

  _updateUpdateTime(name) {
    const store = this.themeInfo;
    return store.load()
    .then((themes) => {
      for (let i = 0, len = themes.length; i < len; i++) {
        if (themes[i]._id === name) {
          themes[i].updateCheck = Date.now();
          return store.store();
        }
      }
    });
  }

  checkUpdateAvailable(name, version) {
    const names = this._prepareSourceAndVersion(name, version);
    const qPromise = this.pluginManager.queryPackage(...names);
    const iPromise = this.getInfo(name);
    return Promise.all([iPromise, qPromise])
    .then((data) => {
      const localInfo = data[0];
      const remoteInfo = data[1];
      if (!this._compareVersions(remoteInfo, localInfo)) {
        return;
      }
      if (this._compareEngines(remoteInfo)) {
        return remoteInfo;
      }
    });
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
  _createThemeInfo(id, info) {
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
    return fs.readJson(path.join(info.location, 'package.json'))
    .then((pkg) => {
      if (pkg.themeTitle) {
        result.title = pkg.themeTitle;
      }
      if (pkg.description) {
        result.description = pkg.description;
      }
      return result;
    });
  }
  /**
   * Adds theme info object to themes registry file.
   * @param {Object} info An object to add.
   * @return {Promise<Object>} Promise resolve to the info object.
   */
  _addThemeEntry(info) {
    const store = this.themeInfo;
    return store.load()
    .then((themes) => {
      themes.push(info);
      return store.store();
    })
    .then(() => info);
  }

  _removeThemeEntry(name) {
    const store = this.themeInfo;
    return store.load()
    .then((themes) => {
      for (let i = 0, len = themes.length; i < len; i++) {
        if (themes[i]._id === name) {
          themes.splice(i, 1);
          return store.store();
        }
      }
    });
  }
}

module.exports.ThemePluginsManager = ThemePluginsManager;
