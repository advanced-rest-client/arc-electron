const {ArcMeta} = require('./arc-meta');
const _FormData = require('form-data');
const fetch = require('node-fetch');
const log = require('electron-log');
log.transports.file.level = 'info';

class ArcSessionRecorder {
  constructor() {
    this.meta = new ArcMeta();
    this.endpoint = 'https://advancedrestclient-1155.appspot.com/analytics/record';
  }

  record() {
    return this.meta.getAninimizedId()
    .then(id => this._postSession(id))
    .catch(cause => {
      log.error('Unable to record the session', cause.message);
    });
  }

  _postSession(id) {
    const data = new _FormData();
    const d = new Date();
    data.append('aid', id); // anonymousId
    data.append('tz', d.getTimezoneOffset()); //timezone
    return fetch(this.endpoint, {
      method: 'POST',
      body: data
    });
  }
}
exports.ArcSessionRecorder = ArcSessionRecorder;
