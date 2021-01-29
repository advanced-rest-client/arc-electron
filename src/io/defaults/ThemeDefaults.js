/* eslint-disable no-param-reassign */
/* eslint-disable no-await-in-loop */
import fs from 'fs-extra';
import path from 'path';
import semver from 'semver';
import { logger } from '../Logger.js';
/**
 * A class that is responsible for setting up theme defaults.
 */
export class ThemeDefaults {
  /**
   * Sets defaults if the defaults are not yet set.
   * It copies anypoint and default theme to theme location
   * and creates theme-info file.
   *
   * @return {Promise} Resolved promise when the defaults are stored.
   */
  async prepareEnvironment() {
    logger.debug('Preparing themes environment...');
    const names = await this._readDefaultThemesPackages();
    if (!names) {
      return;
    }
    await this._setThemeInfo();
    await this._ensureThemes(names);
  }

  async _readDefaultThemesPackages() {
    const source = path.join(__dirname, '..', '..', '..', 'appresources', 'themes');
    logger.silly('Searching for default themes...');
    const themes = await this._listThemePackages(source);
    if (themes) {
      logger.silly(`Found ${themes.length} default themes.`);
    }
    return themes;
  }

  async _listThemePackages(themePath, parent) {
    let items;
    try {
      items = await fs.readdir(themePath);
    } catch (e) {
      logger.warn(`Unable to read themes path ${themePath}.`);
      return undefined;
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
          logger.silly(`Found default theme: ${name}`);
          themePaths[themePaths.length] = {
            name,
            main,
            location: loc
          };
        } else {
          logger.silly(`Searching subdirectories of ${loc} for themes`);
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
    const defaultName = `${name}.js`;
    let data;
    try {
      const content = await fs.readFile(pkgFile);
      data = JSON.parse(String(content));
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
      logger.error(e);
    }
    await this._ensureThemes(themes);
  }

  async _ensureTheme(info) {
    const file = path.join(process.env.ARC_THEMES, info.name, info.main);
    const exists = await fs.pathExists(file);
    if (!exists) {
      await this._copyThemeFiles(info);
      return;
    }
    const localPkgFile = path.join(info.location, 'package.json');
    const localPkg = await fs.readJson(localPkgFile);
    const installedPkgFile = path.join(process.env.ARC_THEMES, info.name, 'package.json');
    const installedPkg = await fs.readJson(installedPkgFile);
    const localVersion = localPkg.version;
    const installedVersion = installedPkg.version;
    if (semver.gt(localVersion, installedVersion)) {
      await this._copyThemeFiles(info);
      return;
    }
    logger.silly(`Theme ${file} exists. Skipping initialization.`);
  }

  async _copyThemeFiles(info) {
    logger.debug(`Creating ${info.name} theme...`);
    const dest = path.join(process.env.ARC_THEMES, info.name);
    try {
      await fs.emptyDir(dest);
      await fs.copy(info.location, dest);
      await this._updateThemeVersion(info);
    } catch (cause) {
      logger.error(`Unable to copy default theme from ${info.location} to ${dest}`);
      logger.error(cause);
    }
  }

  // Setups theme info file if missing
  async _setThemeInfo() {
    const file = path.join(process.env.ARC_THEMES, 'themes-info.json');
    const exists = await fs.pathExists(file);
    if (exists) {
      logger.debug(`${file} exists. Ensuring info scheme.`);
      return this._ensureThemesInfoVersion(file);
    }
    logger.info('Creating themes-info.json file');
    return this._copyInfoFile();
  }

  async _ensureThemesInfoVersion(file) {
    const data = await fs.readJson(file, { throws: false });
    if (!data) {
      return this._copyInfoFile();
    }
    if (Array.isArray(data)) {
      // version 0
      return this._upgradeInfoFile(file, data);
    }
    if (!(data.themes instanceof Array)) {
      return this._copyInfoFile();
    }
    const item = data.themes[0];
    if (!item.location) {
      return this._copyInfoFile();
    }
    if ((item.mainFile || '').indexOf('.js') !== -1) {
      // early 14.x.x preview
      return this._copyInfoFile();
    }
    return undefined;
  }

  /**
   * @return {string} Location of theme info file in local resources.
   */
  get localThemeInfoFile() {
    return path.join(__dirname, '..', '..', '..', 'appresources', 'themes', 'themes-info.json');
  }

  /**
   * Copies theme info file from local resources to themes folder.
   * @return {Promise<void>}
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
   * @param {string} file Theme info (installed) file location.
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
