(function() {
'use strict';
/*jshint unused:false*/

class WebSocketMessage {

  constructor(opts) {
    /**
     * If the message is a binnary data this will be set to true.
     *
     * @type {Boolean}
     */
    this.isBinary = undefined;
    /**
     * A message sent to / received from the server.
     *
     * @type {String|ArrayBuffer|Blob}
     */
    this._message = undefined;
    this.message = opts.message;
    /**
     * A direction of the message. Either "in" or "out".
     *
     * @type {enum:["in","out"]}
     */
    this.direction = opts.direction;
    /**
     * An event time.
     *
     * @type {Date}
     */
    this._time = undefined;
    if (opts.time) {
      this.time = opts.time;
    } else {
      this.time = new Date();
    }
  }

  set message(msg) {
    if ((msg instanceof Blob) || (msg instanceof ArrayBuffer)) {
      this.isBinary = true;
    } else {
      this.isBinary = false;
    }
    this._message = msg || '(empty message)';
  }

  get message() {
    return this._message;
  }

  set time(time) {
    if (time instanceof Date) {
      this._time = time;
    } else if (!isNaN(time)) {
      this._time = new Date(time);
    } else {
      this._time = new Date();
    }
  }

  get time() {
    return this._time;
  }

  toJSON() {
    var copy = Object.assign({}, this);
    var keys = Object.keys(copy);
    var under = keys.filter((key) => key.indexOf('_') === 0);
    under.forEach(key => {
      let realKey = key.substr(1);
      copy[realKey] = copy[key];
      delete copy[key];
    });
    copy.time = copy.time.getTime();
    return copy;
  }
}
window.WebSocketMessage = WebSocketMessage;
})();
