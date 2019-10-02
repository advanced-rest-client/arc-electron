const { app } = require('electron');
const path = require('path');
const fs = require('fs-extra');
const log = require('./logger');

class ArcPaths {
  /**
   * Resolves file path to correct path if it's starts with `~`.
   *
   * @param {String} file Settings file path
   * @return {String} Path to the file.
   */
  _resolvePath(file) {
    if (file[0] === '~') {
      file = app.getPath('home') + file.substr(1);
    }
    return file;
  }

  get settingsFile() {
    return this._settingsFile;
  }

  setSettingsFile(file) {
    if (file) {
      file = this._resolvePath(file);
      const dir = path.dirname(file);
      try {
        fs.ensureDirSync(dir);
        this._settingsFile = file;
      } catch (_) {
        log.error(`Insufficient permission to settings file folder "${dir}".`);
      }
    }
    if (!this._settingsFile) {
      this._settingsFile = path.join(process.env.ARC_HOME, 'settings.json');
    }
    process.env.ARC_SETTINGS_FILE = this._settingsFile;
    log.debug('ARC settings is set to: ' + process.env.ARC_SETTINGS_FILE);
  }

  getAppDirectory() {
    switch (process.platform) {
      case 'darwin':
        return process.execPath.substring(0, process.execPath.indexOf('.app') + 4);
      case 'linux':
      case 'win32':
        return path.join(process.execPath, '..');
    }
  }

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

  setHome() {
    const portableHomePath = path.join(this.getAppDirectory(), '..', '.arc');
    if (fs.pathExistsSync(portableHomePath)) {
      if (this.hasWriteAccess(portableHomePath)) {
        process.env.ARC_HOME = portableHomePath;
      } else {
        log.error(`Insufficient permission to portable ARC home "${portableHomePath}".`);
      }
    }
    if (!process.env.ARC_HOME) {
      process.env.ARC_HOME = app.getPath('userData');
    }
    log.debug('ARC home is set to: ' + process.env.ARC_HOME);
  }

  get themesBasePath() {
    return this._themesBasePath;
  }

  get themesSettings() {
    return this._themesSettings;
  }

  setThemesPath(themesPath, themesSettingsFile) {
    if (themesPath) {
      themesPath = this._resolvePath(themesPath);
      try {
        fs.ensureDirSync(themesPath);
        this._themesBasePath = themesPath;
      } catch (_) {
        log.error(`Insufficient permission to themes installation location "${themesPath}".`);
      }
    }
    if (!this._themesBasePath) {
      this._themesBasePath = path.join(process.env.ARC_HOME, 'themes-esm');
    }
    if (!themesSettingsFile) {
      themesSettingsFile = 'themes-info.json';
    }
    this._themesSettings = path.join(this._themesBasePath, themesSettingsFile);
    process.env.ARC_THEMES = this._themesBasePath;
    process.env.ARC_THEMES_SETTINGS = this._themesSettings;
    log.debug('ARC themes path is set to: ' + process.env.ARC_THEMES);
    log.debug('ARC themes DB is set to: ' + process.env.ARC_THEMES_SETTINGS);
  }

  get workspacePath() {
    return this._workspacePath;
  }

  setWorkspacePath(workspacePath) {
    if (workspacePath) {
      workspacePath = this._resolvePath(workspacePath);
      try {
        this._workspacePath = workspacePath;
      } catch (_) {
        log.error(`Insufficient permission to themes installation location "${workspacePath}".`);
      }
    }
    if (!this._workspacePath) {
      this._workspacePath = path.join(process.env.ARC_HOME, 'workspace');
    }
    process.env.ARC_WORKSPACE_PATH = this._workspacePath;
    log.debug('ARC workspace path is set to: ' + process.env.ARC_WORKSPACE_PATH);
  }
}

const paths = new ArcPaths();

module.exports = {
  setSettingsFile: (file) => paths.setSettingsFile(file),
  setThemesPath: (themesPath, themesSettingsFil) => paths.setThemesPath(themesPath, themesSettingsFil),
  setHome: () => paths.setHome(),
  setWorkspacePath: (workspacePath) => paths.setWorkspacePath(workspacePath),
  get workspacePath() {
    return paths.workspacePath;
  },
  get themesSettings() {
    return paths.themesSettings;
  },
  get themesBasePath() {
    return paths.themesBasePath;
  },
  get settingsFile() {
    return paths.settingsFile;
  }
};
