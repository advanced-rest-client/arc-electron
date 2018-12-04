const {ArcPreferences} = require('../lib/preferences');
const uuidv4 = require('uuid/v4');
const uuidv5 = require('uuid/v5');
/**
 * ARC metadata
 *
 * Type: `Object`
 * Properties:
 * - `appId` {String} Generated application ID that can be used to
 * link user data
 * - `aid` {String} Aninimized Id that can be used to link this app
 * with analytics
 * account like Google Analytics. **This property is never stored outside local
 * filesystem or analytics server which doesn't allow connect this information
 * with specific app instance**
 */
class ArcMeta extends ArcPreferences {
  /**
   * @constructor
   */
  constructor() {
    super({
      fileName: 'app-meta.json'
    });
  }
  /**
   * Returns generated application ID.
   *
   * @return {Promse} Promise resolved to the application ID.
   */
  getAppId() {
    return this.load()
    .then((meta) => meta.appId);
  }
  /**
   * To ensure anynomous app usage reporting the app is using generated UUID
   * from the instance ID. Both are not stored together anywhere outside user's
   * local filesystem.
   *
   * @return {Promse} Promise resolved to the application anonymized ID.
   */
  getAninimizedId() {
    return this.load()
    .then((meta) => meta.aid);
  }
  /**
   * Creates default metadata for ARC.
   *
   *
   * @return {Promise} Generated metadata object
   */
  defaultSettings() {
    const appId = uuidv4();
    const aid = uuidv5('arc-electron', appId);
    const result = {
      appId: appId,
      aid: aid
    };
    return Promise.resolve(result);
  }
}
exports.ArcMeta = ArcMeta;
