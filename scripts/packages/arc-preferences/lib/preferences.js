const EventEmitter = require('events');
const electron = require('electron');
const path = require('path');
const fs = require('fs-extra');
/**
 * A module responsible for storing / restoring user settings.
 * This works with any file and is not mean to work specifically with
 * ARC settings file. Extending this class you'll get access to most common
 * methods when working with files.
 *
 * By default files are stored in user's application data directory. It can be
 * changed by passing `file` property to the constructor.
 */
class ArcPreferences extends EventEmitter {
  /**
   * @constructor
   *
   * @param {?Object} opts - Initialization options:
   * - file - Path to a settings file. It overrides other settings and
   * uses this file as a final store.
   * - fileName - A name for the settings file. By default it's `settings.json`
   * - filePath - Path to the preferences file. By default it's system's
   * application directory for user profile.
   * - appendFilePath - If true it appends `filePath` to the default path.
   */
  constructor(opts) {
    super();
    // Current read settings.
    this.__settings = undefined;
    /**
     * The application directory where user settings are stored.
     * @type {String}
     */
    this.userSettingsDir = undefined;
    /**
     * Full path to the preferences file where the data is stored.
     * @type {String}
     */
    this.settingsFile = undefined;
    this._setupPaths(opts);
  }
  /**
   * Setups paths to settings files.
   *
   * @param {?Object} opts See constructor for description.
   */
  _setupPaths(opts) {
    if (!opts) {
      opts = {};
    }
    const app = (electron.app || electron.remote.app);
    this.userSettingsDir = app.getPath('userData');
    if (opts.file) {
      this.settingsFile = this._resolvePath(opts.file);
    } else {
      const file = opts.fileName || 'settings.json';
      let dir;
      if (opts.filePath) {
        if (opts.appendFilePath) {
          dir = path.join(this.userSettingsDir, opts.filePath);
        } else {
          dir = opts.filePath;
        }
      } else {
        dir = this.userSettingsDir;
      }
      this.userSettingsDir = dir;
      this.settingsFile = path.join(dir, file);
    }
  }
  /**
   * Resolves file path to correct path if it's starts with `~`.
   *
   * @param {String} file Settings file path
   * @return {String} Path to the file.
   */
  _resolvePath(file) {
    if (file[0] === '~') {
      const app = (electron.app || electron.remote.app);
      file = app.getPath('home') + file.substr(1);
    }
    return file;
  }
  /**
   * Ensures that the file exists and reads it's content as JSON.
   * @param {String} file Path to a file
   * @return {Promise} Promise resolved to file content or empty object.
   */
  _restoreFile(file) {
    return fs.ensureFile(file)
    .then(() => fs.readJson(file, {throws: false}));
  }
  /**
   * Stores JSON `data` in `file`.
   *
   * @param {String} file Path to a file.
   * @param {Object} data JavaScript object to store.
   * @return {Promise} Promise resolved when the `file` is updated.
   */
  _storeFile(file, data) {
    return fs.outputJson(file, data, {
      spaces: 2
    });
  }
  /**
   * Loads current settings from settings file.
   *
   * @return {Promise} Promise resolved to a settings file.
   */
  load() {
    if (this.__settings) {
      return Promise.resolve(this.__settings);
    }
    return this._restoreFile(this.settingsFile)
    .then((data) => this._processSettings(data))
    .catch(() => this._processSettings());
  }
  /**
   * Processes data from settings file. Creates default settings if settings
   * file do not exists.
   *
   * @param {?Object} data Settings read from the settings file.
   * @return {Promise<Object>} Settings for the app.
   */
  _processSettings(data) {
    if (!data || !Object.keys(data).length) {
      if (typeof this.defaultSettings === 'function') {
        return this.defaultSettings()
        .then((settings) => {
          this.__settings = settings;
          return this.store();
        })
        .then(() => this.__settings);
      } else {
        return Promise.resolve({});
      }
    }
    this.__settings = data;
    return Promise.resolve(data);
  }
  /**
   * Stores current settings to file.
   *
   * @return {Promise} Promise resolved when the settings are stored.
   */
  store() {
    return this._storeFile(this.settingsFile, this.__settings);
  }
}
exports.ArcPreferences = ArcPreferences;
