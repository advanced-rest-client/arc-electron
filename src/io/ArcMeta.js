import path from 'path';
import { v4, v5 } from 'uuid';
import { ArcPreferences } from '../common/ArcPreferences.js';
/**
 * ARC metadata
 *
 * Type: `Object`
 * Properties:
 * - `appId` {String} Generated application ID that can be used to
 * link user data
 * - `aid` {String} Anonymized id that can be used to link this app with the analytics account like Google Analytics. 
 * **This property is never stored outside local filesystem or analytics server which doesn't allow connect this information with specific app instance**
 */
export class ArcMeta extends ArcPreferences {
  /**
   * @constructor
   */
  constructor() {
    super(path.join(process.env.ARC_HOME, 'app-meta.json'));
  }
  /**
   * Returns generated application ID.
   *
   * @return {Promise<string>} Promise resolved to the application ID.
   */
  async getAppId() {
    const meta = await this.load();
    return meta.appId;
  }
  /**
   * To ensure anonymous app usage reporting the app is using generated UUID
   * from the instance ID. Both are not stored together anywhere outside user's
   * local filesystem.
   *
   * @return {Promise<string>} Promise resolved to the application anonymized ID.
   */
  async getAnonymizedId() {
    const meta = await this.load()
    return meta.aid;
  }
  /**
   * Creates default metadata for ARC.
   *
   *
   * @return {Promise} Generated metadata object
   */
  async defaultSettings() {
    const appId = v4();
    const aid = v5('arc-electron', appId);
    const result = {
      appId: appId,
      aid: aid
    };
    return result;
  }
}
