/* eslint-disable no-bitwise */
import { session } from 'electron';
import path from 'path';
import fs from 'fs-extra';
import { logger } from './Logger.js';
import { MainWindowPersist, TaskManagerWindowPersist } from './Constants.js';
import { ThemeInfo } from './models/ThemeInfo.js';

export const requestHandler = Symbol('requestHandler');

/**
 * A class responsible for handling `themes:` protocol.
 * 
 * 
 *
 * Theme protocol is used to load theme file from themes installation location
 * by using only theme id.
 *
 * Example usage in the renderer process:
 *
 * ```
 * <script type="module" src="themes://dd1b715f-af00-4ee8-8b0c-2a262b3cf0c8"></script>
 * ```
 *
 * If the location represents a path then then file will be loaded from this
 * location.
 *
 * ```
 * <script type="module" src="themes:///path/to/a/theme.js"></script>
 * ```
 */
export class ThemesProtocol {
  constructor() {
    this[requestHandler] = this[requestHandler].bind(this);
  }

  /**
   * Registers the protocol handler.
   * This must be called after the `ready` event.
   */
  register() {
    logger.debug('Registering themes protocol');
    session.fromPartition(MainWindowPersist)
    .protocol
    .registerStringProtocol('themes', this[requestHandler]);
    session.fromPartition(TaskManagerWindowPersist)
    .protocol
    .registerStringProtocol('themes', this[requestHandler]);
  }

  /**
   * @param {Electron.ProtocolRequest} request
   * @param {(response: string | Electron.ProtocolResponse) => void} callback
   * @returns
   */
  async [requestHandler](request, callback) {
    let url = request.url.substr(9);
    logger.silly(`ThemesProtocol::requestHandler::${url}`);
    try {
      fs.accessSync(url, fs.constants.R_OK | fs.constants.X_OK);
      await this.loadFileTheme(url, callback);
      return;
    } catch (_) {
      // ..
    }
    if (url === 'dd1b715f-af00-4ee8-8b0c-2a262b3cf0c8') {
      url = 'advanced-rest-client/arc-electron-default-theme';
    }
    await this.loadInstalledTheme(url, callback);
  }

  /**
   * @param {string} themeLocation
   * @param {(response: string | Electron.ProtocolResponse) => void} callback
   */
  async loadFileTheme(themeLocation, callback) {
    logger.silly(`ThemesProtocol::loading theme from ${themeLocation}`);
    try {
      const data = await fs.readFile(themeLocation, 'utf8');
      callback({
        data,
        mimeType: 'text/css',
        charset: 'utf8'
      });
    } catch (cause) {
      logger.error('Unable to load theme');
      logger.error(cause);
      callback(-6);
    }
  }

  /**
   * @param {string} themeLocation
   * @param {(response: string | Electron.ProtocolResponse) => void} callback
   */
  async loadInstalledTheme(themeLocation, callback) {
    logger.info(`loading theme ${themeLocation}`);
    const model = new ThemeInfo();
    try {
      let info = await model.readTheme(themeLocation);
      if (!info && themeLocation[0] !== '@') {
        info = await model.readTheme(`@${themeLocation}`);
      }
      if (!info) {
        logger.error('Theme info not found');
        callback(-6);
        return;
      }
      const file = path.join(process.env.ARC_THEMES, info.mainFile);
      logger.silly(`Theme found. Reading theme file: ${file}`);
      const data = await fs.readFile(file, 'utf8');
      if (data) {
        logger.silly('Sending theme file to renderer.');
        callback({
          data,
          mimeType: 'text/css',
          charset: 'utf8'
        });
      } else {
        logger.error('Theme file is empty');
        callback(-6);
      }
    } catch (e) {
      logger.error('Unable to load theme');
      logger.error(e.message);
      logger.error(e.stack);
      callback(-6);
    }
  }

  findThemeInfo(id, themes) {
    if (!themes || !themes.length) {
      return null;
    }
    return themes.find((item) => item._id === id || item.name === id);
  }
}
