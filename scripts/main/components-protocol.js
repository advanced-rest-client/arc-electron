const {session, app} = require('electron');
const path = require('path');
const log = require('./logger');
const fs = require('fs-extra');
const mime = require('mime-types');
/**
 * A class responsible for handling `arc-components:` protocol.
 *
 * Components protocol is used to load components from bower_components directory.
 *
 * Example usage in the renderer process:
 *
 * ```
 * <link rel="import" href="arc-components://polymer/polymer.html">
 * ```
 *
 * This checks for existing component in following order:
 * - ./bower_components/{url} (application main components)
 * - {applicationUserDataDir}/{url} (application modules installation root)
 * - {url} (filesyste)
 *
 * If the component does not exists then it throws an error.
 */
class ComponentsProtocolHandler {
  constructor() {
    this._requestHandler = this._requestHandler.bind(this);
    this._registrationHandler = this._registrationHandler.bind(this);
    /**
     * Base path to the themes folder.
     * @type {String}
     */
    this.modulesBasePath = path.join(app.getPath('userData'), 'modules');
    /**
     * Base path to the themes folder.
     * @type {String}
     */
    this.basePath = path.join(__dirname, '..', '..', 'bower_components');
  }
  /**
   * Registers the protocol handler.
   * This must be called after the `ready` event.
   */
  register() {
    log.debug('Registering components protocol');
    session.fromPartition('persist:arc-window')
    .protocol
    .registerStringProtocol('arc-components', this._requestHandler, this._registrationHandler);
  }

  _registrationHandler(err) {
    if (err) {
      log.error('Unable to register arc-components protocol');
      log.error(err);
    }
  }

  _requestHandler(request, callback) {
    let url = request.url.substr(17);
    if (url.indexOf('src/bower_components/') === 0) {
      url = url.substr(21);
    }
    log.debug('Handling component url: ' + url);
    const paths = [
      path.join(this.basePath, url),
      path.join(this.modulesBasePath, url),
      url
    ];
    let file;
    for (let i = 0, len = paths.length; i < len; i++) {
      try {
        fs.accessSync(paths[i], fs.constants.R_OK | fs.constants.X_OK);
        file = paths[i];
        break;
      } catch (_) {}
    }
    if (!file) {
      callback(-6);
      return;
    }
    this._loadComponent(file, callback);
  }

  _loadComponent(location, callback) {
    log.debug('Loading component from ' + location);
    const mimeType = mime.lookup(location) || 'application/octet-stream';
    return fs.readFile(location, 'utf8')
    .then((data) => {
      console.log('SENDING DATA');
      console.log(mimeType);
      console.log(location);
      callback({
        data,
        mimeType,
        charset: 'utf8'
      });
    })
    .catch((cause) => {
      log.error('Unable to load component');
      log.error(cause);
      callback(-6);
      return;
    });
  }
}

module.exports.ComponentsProtocolHandler = ComponentsProtocolHandler;
