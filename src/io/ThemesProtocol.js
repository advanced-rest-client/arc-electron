/* eslint-disable no-bitwise */
import { session } from 'electron';
import path from 'path';
import fs from 'fs-extra';
import mime from 'mime-types';
import { logger } from './Logger.js';
import { MainWindowPersist, AppHostname } from '../common/Constants.js';
import { ThemeInfo } from './models/ThemeInfo.js';

export const requestHandler = Symbol('requestHandler');

// https://source.chromium.org/chromium/chromium/src/+/master:net/base/net_error_list.h;l=1?q=net_error_list.h&sq=&ss=chromium

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
    .registerBufferProtocol('themes', this[requestHandler]);
    // session.fromPartition(TaskManagerWindowPersist)
    // .protocol
    // .registerBufferProtocol('themes', this[requestHandler]);
  }

  /**
   * @param {Electron.ProtocolRequest} request
   * @param {(response: string | Electron.ProtocolResponse) => void} callback
   * @returns
   */
  async [requestHandler](request, callback) {
    let url = request.url.substr(9).replace(`${AppHostname}/`, '');
    logger.silly(`[ThemesProtocol] requesting theme ${url}`);
    const assetUrl = this.assetUrl(url);
    // first, check if the request is about theme asset.
    try {
      await fs.access(assetUrl, fs.constants.R_OK);
      const stats = await fs.stat(assetUrl);
      if (stats.isFile()) {
        await this.loadThemeAsset(assetUrl, callback);
        return;
      }
    } catch (err) {
      if (err.errno === -13) {
        callback({
          error: -10,
          statusCode: 500,
        });
        return;
      }
    }

    // then check installed user theme files
    try {
      fs.accessSync(url, fs.constants.R_OK | fs.constants.X_OK);
      await this.loadFileTheme(url, callback);
      return;
    } catch (_) {
      // ..
    }
    if (url === 'dd1b715f-af00-4ee8-8b0c-2a262b3cf0c8') {
      url = '@advanced-rest-client/arc-electron-default-theme';
    }

    // finally load the theme by id
    await this.loadInstalledTheme(url, callback);
  }

  /**
   * @param {string} themeLocation
   * @param {(response: string | Electron.ProtocolResponse) => void} callback
   */
  async loadFileTheme(themeLocation, callback) {
    logger.silly(`[ThemesProtocol] loading theme from ${themeLocation}`);
    try {
      const data = await fs.readFile(themeLocation);
      callback({
        data,
        mimeType: 'text/css',
        charset: 'utf8'
      });
    } catch (cause) {
      logger.error('Unable to load theme');
      logger.error(cause);
      callback({ error: -6, statusCode: 404 });
    }
  }

  /**
   * @param {string} themeLocation
   * @param {(response: string | Electron.ProtocolResponse) => void} callback
   */
  async loadInstalledTheme(themeLocation, callback) {
    logger.silly(`[ThemesProtocol] loading theme ${themeLocation}`);
    const model = new ThemeInfo();
    try {
      let info = await model.readTheme(themeLocation);
      if (!info && themeLocation[0] !== '@') {
        info = await model.readTheme(`@${themeLocation}`);
      }
      if (!info) {
        logger.error('Theme info not found');
        callback({ error: -6, statusCode: 404 });
        return;
      }
      const mainExists = await fs.pathExists(info.mainFile);
      const file = mainExists ? info.mainFile : path.join(process.env.ARC_THEMES, info.mainFile);
      logger.silly(`Theme found. Reading theme file: ${file}`);
      const data = await fs.readFile(file);
      if (data) {
        logger.silly('Sending theme file to renderer.');
        callback({
          data,
          mimeType: 'text/css',
          charset: 'utf8'
        });
      } else {
        logger.error('Theme file is empty');
        // @ts-ignore
        callback(-6);
      }
    } catch (e) {
      logger.error('Unable to load theme');
      logger.error(e.message);
      logger.error(e.stack);
      callback({ error: -6, statusCode: 404 });
    }
  }

  findThemeInfo(id, themes) {
    if (!themes || !themes.length) {
      return null;
    }
    return themes.find((item) => item._id === id || item.name === id);
  }

  /**
   * @param {string} url
   * @returns {string}
   */
  assetUrl(url) {
    let fileLocation = url;
    if (url.startsWith('advanced-rest-client/')) {
      fileLocation = fileLocation.substr(21);
    }
    const parts = fileLocation.split('/');
    const finalUrl = path.join(process.env.ARC_THEMES, ...parts);
    return finalUrl;
  }

  /**
   * @param {string} assetLocation
   * @param {(response: string | Electron.ProtocolResponse) => void} callback
   */
  async loadThemeAsset(assetLocation, callback) {
    logger.silly(`[ThemesProtocol] loading theme asset from ${assetLocation}`);
    try {
      const data = await fs.readFile(assetLocation);
      // const data = fs.createReadStream(assetLocation);
      const mt = mime.lookup(assetLocation) || 'application/octet-stream';
      const result = /** @type Electron.ProtocolResponse */ ({
        data,
        mimeType: mt,
      });
      const charset = mime.charset(mt);
      if (charset) {
        result.charset = charset;
      }
      callback(result);
    } catch (e) {
      logger.error('Unable to load theme asset');
      logger.error(e.message);
      logger.error(e.stack);
      callback({ error: -9, statusCode: 500 });
    }
  }
}
