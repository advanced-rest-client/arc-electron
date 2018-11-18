const {session, app} = require('electron');
const path = require('path');
const log = require('electron-log');
const fs = require('fs-extra');
/**
 * A class responsible for handling `themes:` protocol.
 *
 * Theme protocol is used to load theme file from themes installation location
 * by using only theme id.
 *
 * Example usage in the renderer process:
 *
 * ```
 * <link rel="import" href="themes://dd1b715f-af00-4ee8-8b0c-2a262b3cf0c8">
 * ```
 *
 * This will load ARC's default theme.
 *
 * If the location represents a path then then file will be loaded from this
 * location.
 *
 * ```
 * <link rel="import" href="themes:///path/to/a/theme.html">
 * ```
 */
class ThemesProtocolHandler {
  constructor() {
    this._requestHandler = this._requestHandler.bind(this);
    this._registrationHandler = this._registrationHandler.bind(this);

    /**
     * Base path to the themes folder.
     * @type {String}
     */
    this.themesBasePath = path.join(app.getPath('userData'), 'themes');
    /**
     * Location of the installed themes info file.
     * @type {String}
     */
    this.infoFilePath = path.join(this.themesBasePath, 'themes-info.json');
  }
  /**
   * Registers the protocol handler.
   * This must be called after the `ready` event.
   */
  register() {
    log.info('Registering themes protocol');
    session.fromPartition('persist:arc-window')
    .protocol
    .registerStringProtocol('themes', this._requestHandler, this._registrationHandler);
  }

  _registrationHandler(err) {
    if (err) {
      log.error('Unable to register themes protocol');
      log.error(err);
    }
  }

  _requestHandler(request, callback) {
    const url = request.url.substr(9);
    log.debug('ThemesProtocolHandler::_requestHandler::' + url);
    if (url.indexOf('/') === -1) {
      return this._loadInstalledTheme(url, callback);
    }
    return this._loadFileTheme(url, callback);
  }

  _loadInstalledTheme(location, callback) {
    log.debug('ThemesProtocolHandler::loading theme from ' + location);
    return this._loadThemeInfo()
    .then((themes) => {
      log.debug('Got themes list');
      const theme = this._findThemeInfo(location, themes);
      if (theme) {
        log.debug('Theme found. Reading theme file.');
        const file = path.join(theme.path, theme.main);
        return fs.readFile(file, 'utf8');
      }
    })
    .then((data) => {
      if (data) {
        log.debug('Sending theme file to renderer.');
        callback({
          data,
          mimeType: 'text/html',
          charset: 'utf8'
        });
      } else {
        log.error('Unable to find theme');
        callback(-6);
      }
    })
    .catch((cause) => {
      log.error('Unable to load theme');
      log.error(cause);
      callback(-6);
      return;
    });
  }

  _loadFileTheme(location, callback) {
    log.debug('ThemesProtocolHandler::loading theme from ' + location);
    return fs.readFile(location, 'utf8')
    .then((data) => {
      callback({
        data,
        mimeType: 'text/html',
        charset: 'utf8'
      });
    })
    .catch((cause) => {
      log.error('Unable to load theme');
      log.error(cause);
      callback(-6);
      return;
    });
  }

  _loadThemeInfo() {
    return fs.readJson(this.infoFilePath, {throws: false})
    .catch(() => {
      log.warn('Theme file not found', this.infoFilePath);
      return [];
    });
  }

  _findThemeInfo(id, themes) {
    if (!themes || !themes.length) {
      return;
    }
    return themes.find((item) => item._id === id);
  }
}

module.exports.ThemesProtocolHandler = ThemesProtocolHandler;
