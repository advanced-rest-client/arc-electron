const fs = require('fs-extra');
const path = require('path');
const log = require('../logger');
const semver = require('semver');
/**
 * A class that is responsible for setting up theme defaults.
 */
class ThemeDefaults {
  /**
   * Sets defaults if the defaults are not yet set.
   * It copues anypoint and default theme to theme location
   * and creates theme-info file.
   *
   * @return {Promise} Resolved promise when the defaults are stored.
   */
  async prepareEnvironment() {
    log.debug('Preparing themes environment...');
    const names = await this._readDefaultThemesPackages();
    if (!names) {
      return;
    }
    await this._setThemeInfo();
    await this._ensureThemes(names);
  }

  async _readDefaultThemesPackages() {
    const source = path.join(__dirname, '..', '..', '..', 'appresources', 'themes');
    log.silly('Searching for default themes...');
    const themes = await this._listThemePackages(source);
    if (themes) {
      log.silly(`Found ${themes.length} default themes.`);
    }
    return themes;
  }

  async _listThemePackages(themePath, parent) {
    let items;
    try {
      items = await fs.readdir(themePath);
    } catch (e) {
      log.warn(`Unable to read themes path ${themePath}.`);
      return;
    }
    let themePaths = [];
    for (let name of items) {
      const loc = path.join(themePath, name);
      const stats = await fs.stat(loc);
      if (stats.isDirectory()) {
        const pkgFile = path.join(loc, 'package.json');
        const hasPackage = await fs.pathExists(pkgFile);
        if (hasPackage) {
          const main = await this._readMainFile(pkgFile, name);
          if (parent) {
            name = path.join(parent, name);
          }
          log.silly('Found default theme: ' + name);
          themePaths[themePaths.length] = {
            name,
            main,
            location: loc
          };
        } else {
          log.silly(`Searching subdirectories of ${loc} for themes`);
          if (parent) {
            parent = path.join(parent, name);
          } else {
            parent = name;
          }
          const deepThemes = await this._listThemePackages(loc, parent);
          if (deepThemes) {
            themePaths = themePaths.concat(deepThemes);
          }
        }
      }
    }
    return themePaths;
  }

  async _readMainFile(pkgFile, name) {
    // Default to package name ??
    const defaultName = name + '.js';
    let data;
    try {
      const content = await fs.readFile(pkgFile);
      data = JSON.parse(content);
    } catch (_) {
      return defaultName;
    }
    if (data.main) {
      return data.main;
    }
    return defaultName;
  }

  async _ensureThemes(themes) {
    const item = themes.shift();
    if (!item) {
      return;
    }
    try {
      await this._ensureTheme(item);
    } catch (e) {
      log.error(e);
    }
    await this._ensureThemes(themes);
  }

  async _ensureTheme(info) {
    const file = path.join(process.env.ARC_THEMES, info.name, info.main);
    const exists = await fs.pathExists(file);
    if (!exists) {
      return await this._copyThemeFiles(info);
    }
    const localPkgFile = path.join(info.location, 'package.json');
    const localPkg = await fs.readJson(localPkgFile);
    const installedPkgFile = path.join(process.env.ARC_THEMES, info.name, 'package.json');
    const installedPkg = await fs.readJson(installedPkgFile);
    const localVersion = localPkg.version;
    const installedVersion = installedPkg.version;
    if (semver.gt(localVersion, installedVersion)) {
      return await this._copyThemeFiles(info);
    }
    log.silly(`Theme ${file} exists. Skipping initialization.`);
  }

  async _copyThemeFiles(info) {
    log.debug(`Creating ${info.name} theme...`);
    const dest = path.join(process.env.ARC_THEMES, info.name);
    try {
      await fs.emptyDir(dest);
      await fs.copy(info.location, dest);
      await this._updateThemeVersion(info);
    } catch (cause) {
      log.error('Unable to copy default theme from ' + info.location + ' to ' + dest);
      log.error(cause);
    }
  }
  // Setups theme info file if missing
  async _setThemeInfo() {
    const file = path.join(process.env.ARC_THEMES, 'themes-info.json');
    const exists = await fs.pathExists(file);
    if (exists) {
      log.debug(`${file} exists. Ensuring info scheme.`);
      return await this._ensureThemesInfoVersion(file);
    }
    log.info('Creating themes-info.json file');
    return await this._copyInfoFile();
  }

  async _ensureThemesInfoVersion(file) {
    const data = await fs.readJson(file, { throws: false });
    if (!data) {
      return await this._copyInfoFile();
    }
    if (data instanceof Array) {
      // version 0
      return await this._upgradeInfoFile(file, data);
    }
    if (!(data.themes instanceof Array)) {
      return await this._copyInfoFile();
    }
    const item = data.themes[0];
    if (!item.location) {
      return await this._copyInfoFile();
    }
    if ((item.mainFile || '').indexOf('.js') !== -1) {
      // early 14.x.x preview
      return await this._copyInfoFile();
    }
  }
  /**
   * @return {String} Location of theme info file in local resources.
   */
  get localThemeInfoFile() {
    return path.join(__dirname, '..', '..', '..', 'appresources', 'themes', 'themes-info.json');
  }
  /**
   * Copies theme info file from local resources to themes folder.
   * @return {Promise}
   */
  async _copyInfoFile() {
    const dest = process.env.ARC_THEMES_SETTINGS;
    await fs.ensureDir(process.env.ARC_THEMES);
    let info = await fs.readJson(this.localThemeInfoFile, { throws: false })
    info = info || {};
    await fs.writeJson(dest, info);
  }
  /**
   * Upgrades original theme info file structure to v1.
   *
   * This function checks for already installed themes that are not default themes
   * and adds it to the list of newly created file.
   *
   * @param {String} file Theme info (installed) file location.
   * @param {Array<Object>} installed List of currently installed packages.
   * @return {Promise}
   */
  async _upgradeInfoFile(file, installed) {
    let info = await fs.readJson(this.localThemeInfoFile, { throws: false });
    if (!info || !info.themes) {
      info = { themes: [] };
    }
    installed.forEach((item) => {
      if (item.isDefault) {
        return;
      }
      info.themes.push(item);
    });
    await fs.writeJson(file, info);
  }

  async _updateThemeVersion(info) {
    const dbFile = process.env.ARC_THEMES_SETTINGS;
    const db = await fs.readJson(dbFile);
    // name contains path separator that is different on different platforms.
    const normalizedName = info.name.replace(/[\\/]/g, '');
    const theme = db.themes.find((i) => i.name.replace(/[\\/]/g, '') === normalizedName);
    if (!theme) {
      return;
    }
    const localPkgFile = path.join(info.location, 'package.json');
    const localPkg = await fs.readJson(localPkgFile);
    theme.version = localPkg.version;
    await fs.writeJson(dbFile, db, {
      spaces: 2
    });
  }
}
exports.ThemeDefaults = ThemeDefaults;
