import fetch from 'node-fetch';
import { ArcMeta } from './ArcMeta.js';
import { logger } from './Logger.js';
/**
 * Session recorder.
 *
 * @deprecated
 * This class is useless. No one reads the data. There's no enough
 * will to do something useful for the app or users with it.
 * The ARC analytics service will be closed eventually.
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
   * @return {Promise}
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
   * @param {String} aid Anonymous app id.
   * @return {Promise}
   */
  async _postSession(aid) {
    const d = new Date();
    const data = {
      aid,
      tz: d.getTimezoneOffset()
    };
    return await fetch(this.endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
}
