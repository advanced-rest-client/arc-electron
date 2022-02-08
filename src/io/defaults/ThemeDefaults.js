/* eslint-disable no-param-reassign */
/* eslint-disable no-await-in-loop */
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import semver from 'semver';
import { fileURLToPath } from 'url';
import { logger } from '../Logger.js';
import * as FsUtils from '../lib/FsUtils.js';

/** @typedef {import('@advanced-rest-client/events').Theme.ArcThemeStore} ArcThemeStore */

/** 
 * @typedef DefaultThemeInfo
 * @property {string} name The name of the them (the id)
 * @property {string} main The main file of the theme
 * @property {string} location The location of the theme directory
 * @property {string[]=} files Files ot copy with the theme.
 */

/**
 * A class that is responsible for setting up theme defaults.
 */
export class ThemeDefaults {
  constructor() {
    const base = path.dirname(fileURLToPath(import.meta.url));
    this.appPath = path.join(base, '..', '..', '..');
  }

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

  /**
   * @returns {Promise<DefaultThemeInfo[]|undefined>} 
   */
  async _readDefaultThemesPackages() {
    logger.silly('Reading local (app) themes info file...');
    const source = path.join(this.appPath, 'appresources', 'themes');
    logger.silly(`Searching for default themes in ${source}...`);
    const themes = await this._listThemePackages(source);
    if (themes) {
      logger.silly(`Found ${themes.length} default themes.`);
    }
    return themes;
  }

  /**
   * @param {string} themePath Path to the themes folder.
   * @param {string=} parent Parent folder, if any
   * @returns {Promise<DefaultThemeInfo[]|undefined>} 
   */
  async _listThemePackages(themePath, parent) {
    /** @type string[]|undefined */
    let items;
    try {
      fsSync.readdirSync(themePath);
      items = await fs.readdir(themePath);
    } catch (e) {
      logger.error(`Unable to read themes path ${themePath}. Skipping themes initialization.\n${e.message}`);
      if (e.stack) {
        logger.error(e.stack);
      }
      return undefined;
    }
    let themePaths = [];
    for (let name of items) {
      const loc = path.join(themePath, name);
      const stats = await fs.stat(loc);
      if (stats.isDirectory()) {
        const pkgFile = path.join(loc, 'package.json');
        const hasPackage = await FsUtils.canRead(pkgFile);
        if (hasPackage) {
          const pkgContent = /** @type DefaultThemeInfo */ (await FsUtils.readJson(pkgFile, { throws: false }));
          const main = this._readMainFile(pkgContent, name);
          if (parent) {
            name = path.join(parent, name);
          }
          let files = [];
          if (pkgContent && Array.isArray(pkgContent.files)) {
            files = pkgContent.files;
          }
          logger.silly(`Found default theme: ${name}`);
          themePaths[themePaths.length] = {
            name,
            main,
            location: loc,
            files,
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

  /**
   * @param {any} pkgContent
   * @param {string} name
   * @returns {string} 
   */
  _readMainFile(pkgContent, name) {
    // Default to package name ??
    const defaultName = `${name}.js`;
    if (!pkgContent) {
      return defaultName;
    }
    if (pkgContent.main) {
      return pkgContent.main;
    }
    return defaultName;
  }

  /**
   * @param {DefaultThemeInfo[]} themes
   * @returns {Promise<void>} 
   */
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

  /**
   * @param {DefaultThemeInfo} info
   * @returns {Promise<void>} 
   */
  async _ensureTheme(info) {
    const file = path.join(process.env.ARC_THEMES, info.name, info.main);
    const exists = await FsUtils.canRead(file);
    if (!exists) {
      await this._copyThemeFiles(info);
      return;
    }
    const localPkgFile = path.join(info.location, 'package.json');
    const localPkg = /** @type any */ (await FsUtils.readJson(localPkgFile));
    const installedPkgFile = path.join(process.env.ARC_THEMES, info.name, 'package.json');
    const installedPkg = /** @type any */ (await FsUtils.readJson(installedPkgFile));
    const localVersion = localPkg.version;
    const installedVersion = installedPkg.version;
    if (semver.gt(localVersion, installedVersion)) {
      logger.debug(`New version of ${info.name} theme found.`);
      await this._copyThemeFiles(info);
      return;
    }
    logger.silly(`Theme ${file} exists. Skipping initialization.`);
  }

  /**
   * @param {DefaultThemeInfo} info
   * @returns {Promise<void>}
   */
  async _copyThemeFiles(info) {
    logger.debug(`Creating ${info.name} theme...`);
    const dest = path.join(process.env.ARC_THEMES, info.name);
    try {
      await FsUtils.emptyDir(dest);
      await FsUtils.copy(info.location, dest);
      await this._updateThemeVersion(info);
    } catch (cause) {
      logger.error(`Unable to copy default theme from ${info.location} to ${dest}`);
      logger.error(cause);
    }
  }

  /**
   * Set ups theme info file if missing
   * @returns {Promise<void>} 
   */
  async _setThemeInfo() {
    const file = path.join(process.env.ARC_THEMES, 'themes-info.json');
    const exists = await FsUtils.canRead(file);
    if (exists) {
      logger.debug(`${file} exists. Ensuring info scheme.`);
      await this._ensureThemesInfoVersion(file);
      return;
    }
    logger.info('Creating themes-info.json file');
    await this._copyInfoFile();
  }

  /**
   * @param {string} file Themes info file location.
   * @returns {Promise<void>}
   */
  async _ensureThemesInfoVersion(file) {
    const data = /** @type any */ (await FsUtils.readJson(file, { throws: false }));
    if (!data) {
      return this._copyInfoFile();
    }
    if (Array.isArray(data)) {
      // version 0
      return this._upgradeInfoFile(file, data);
    }
    if (!Array.isArray(data.themes)) {
      return this._copyInfoFile();
    }
    const item = data.themes[0];
    if (!item || !item.location) {
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
    return path.join(this.appPath, 'appresources', 'themes', 'themes-info.json');
  }

  /**
   * Copies theme info file from local resources to themes folder.
   * @returns {Promise<void>}
   */
  async _copyInfoFile() {
    const dest = process.env.ARC_THEMES_SETTINGS;
    await FsUtils.ensureDir(process.env.ARC_THEMES);
    let info = await FsUtils.readJson(this.localThemeInfoFile, { throws: false })
    info = info || {};
    await FsUtils.writeJson(dest, info);
  }

  /**
   * Upgrades original theme info file structure to v1.
   *
   * This function checks for already installed themes that are not default themes
   * and adds it to the list of newly created file.
   *
   * @param {string} file Theme info (installed) file location.
   * @param {Array<Object>} installed List of currently installed packages.
   * @returns {Promise<void>}
   */
  async _upgradeInfoFile(file, installed) {
    let info = /** @type any */ (await FsUtils.readJson(this.localThemeInfoFile, { throws: false }));
    if (!info || !info.themes) {
      info = { themes: [] };
    }
    installed.forEach((item) => {
      if (item.isDefault) {
        return;
      }
      info.themes.push(item);
    });
    info.systemPreferred = false;
    await FsUtils.writeJson(file, info);
  }

  /**
   * @param {DefaultThemeInfo} info
   * @returns {Promise<void>}
   */
  async _updateThemeVersion(info) {
    const dbFile = process.env.ARC_THEMES_SETTINGS;
    const db = /** @type ArcThemeStore */ (await FsUtils.readJson(dbFile));
    // name contains path separator that is different on different platforms.
    const normalizedName = info.name.replace(/[\\/]/g, '');
    const theme = db.themes.find((i) => i.name.replace(/[\\/]/g, '') === normalizedName);
    if (!theme) {
      return;
    }
    const localPkgFile = path.join(info.location, 'package.json');
    const localPkg = /** @type any */ (await FsUtils.readJson(localPkgFile));
    theme.version = localPkg.version;
    await FsUtils.writeJson(dbFile, db);
  }
}
