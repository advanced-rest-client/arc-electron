import fetch from 'node-fetch';
import { ArcMeta } from './ArcMeta.js';
import { logger } from './Logger.js';
/**
 * This is first part analytics. This records the app start ONLY.
 * The generated client id is random string generated per app instance and stored locally.
 * There's no possibility to connect the id with a particular instance.
 * 
 * The reason to have this is to keep project alive by proving that someone is using it..
 */
export class ArcSessionRecorder {
  /**
   * @constructor
   */
  constructor() {
    this.meta = new ArcMeta();
    this.endpoint = 'https://api.advancedrestclient.com/v1/analytics/record';
  }

  /**
   * Pings the server to record the session.
   * @return {Promise<void>}
   */
  async record() {
    try {
      const id = await this.meta.getAnonymizedId();
      await this._postSession(id);
    } catch (cause) {
      logger.error('Unable to record the session', cause.message);
    }
  }

  /**
   * Posts session data to the analytics server.
   *
   * @param {string} aid Anonymous app id.
   * @return {Promise<void>}
   */
  async _postSession(aid) {
    const d = new Date();
    const data = {
      aid,
      tz: d.getTimezoneOffset()
    };
    await fetch(this.endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}
