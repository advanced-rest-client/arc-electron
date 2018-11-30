const {ArcMeta} = require('../packages/arc-preferences/main');
const _FormData = require('form-data');
const _fetch = require('node-fetch');
const log = require('./logger');
/**
 * Session recorder.
 *
 * @deprecated
 * This class is useless. No one reads the data. There's no enough
 * will to do something useful for the app or users with it.
 * The ARC analytics service will be closed eventually.
 */
class ArcSessionRecorder {
  /**
   * @constructor
   */
  constructor() {
    this.meta = new ArcMeta();
    this.endpoint = 'https://app.advancedrestclient.com/analytics/record';
  }
  /**
   * Pings the server to record the session.
   * @return {Promise}
   */
  record() {
    return this.meta.getAninimizedId()
    .then((id) => this._postSession(id))
    .catch((cause) => {
      log.error('Unable to record the session', cause.message);
    });
  }
  /**
   * Posts session data to the analytics server.
   *
   * @param {String} id Anonymous app id.
   * @return {Promise}
   */
  _postSession(id) {
    const data = new _FormData();
    const d = new Date();
    data.append('aid', id); // anonymousId
    data.append('tz', d.getTimezoneOffset()); // timezone
    try {
      return _fetch(this.endpoint, {
        method: 'POST',
        body: data
      });
    } catch (e) {
      return Promise.rejec(e);
    }
  }
}
exports.ArcSessionRecorder = ArcSessionRecorder;
