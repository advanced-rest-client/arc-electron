const {ArcPreferences} = require('./arc-preferences');
const path = require('path');
const uuidv4 = require('uuid/v4');
const uuidv5 = require('uuid/v5');
/**
 * ARC metadata
 *
 * Type: `Object`
 * Properties:
 * - `appId` {String} Generated application ID that can be used to link user data
 * - `aid` {String} Aninimized Id that can be used to link this app with analytics
 * account like Google Analytics. **This property is never stored outside local
 * filesystem or analytics server which doesn't allow connect this information
 * with specific app instance**
 */
class ArcMeta extends ArcPreferences {
  /**
   * @constructor
   */
  constructor() {
    super();
    this.metaFile = path.join(this.userSettingsDir, 'app-meta.json');
    // Loaded metadata
    this._meta = undefined;
  }
  /**
   * Returns application meta data stored in meta file or defaults for the app
   * if file does not exists.
   * @return {Promse} Promise resolved to a meta data.
   */
  getMeta() {
    if (this._meta) {
      return Promise.resolve(this._meta);
    }
    return this.restoreFile(this.metaFile)
    .then((data) => this._processMeta(data))
    .catch(() => this._processMeta());
  }
  /**
   * Updates meta files contents with current meta data.
   * @return {Promise} Promise resolved when file is saved.
   */
  updateMeta() {
    return this.storeFile(this.metaFile, this._meta);
  }
  /**
   * Returns generated application ID.
   *
   * @return {Promse} Promise resolved to the application ID.
   */
  getAppId() {
    return this.getMeta()
    .data((meta) => {
      return meta.appId;
    });
  }
  /**
   * To ensure anynomous app usage reporting the app is using generated UUID
   * from the instance ID. Both are not stored together anywhere outside user's
   * local filesystem.
   *
   * @return {Promse} Promise resolved to the application anonymized ID.
   */
  getAninimizedId() {
    return this.getMeta()
    .then((meta) => {
      return meta.aid;
    });
  }
  /**
   * Processes read meta data from the file. If meta data is not set then it
   * creates defaults.
   * Note: This function creates meta file if it doesn't exists.
   *
   * @param {?Object} data Data read from the meta file.
   * @return {Promse} Promise resolved to a meta data.
   */
  _processMeta(data) {
    if (!data || !data.aid || !data.appId) {
      return this._defaultMeta()
      .then((meta) => {
        this._meta = meta;
        return this.updateMeta();
      })
      .then(() => {
        return this._meta;
      });
    }
    this._meta = data;
    return Promise.resolve(data);
  }
  /**
   * Creates default metadata for ARC.
   *
   *
   * @return {Promise} Generated metadata object
   */
  _defaultMeta() {
    var appId = uuidv4();
    var aid = uuidv5('arc-electron', appId);
    var result = {
      appId: appId,
      aid: aid
    };
    return Promise.resolve(result);
  }
}
exports.ArcMeta = ArcMeta;
