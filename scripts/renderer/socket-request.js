/**
 * @license
 * Copyright 2017 The Advanced REST client authors <arc@mulesoft.com>
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
const net = require('net');
const tls = require('tls');
const url = require('url');
const zlib = require('zlib');
const EventEmitter = require('events');

const nlBuffer = Buffer.from([13, 10]);
const nlNlBuffer = Buffer.from([13, 10, 13, 10]);

class SocketRequest extends EventEmitter {
  /**
   * Constructs the request from ARC's request object
   *
   * @param {Object} request ARC's request object
   * @param {Object} opts Optional. Request configuration options
   * - `timeout` {Number} Request timeout. Default to 0 (no timeout)
   * - `followRedirects` {Boolean} Fllow request redirects. Default `true`.
   * - `hosts` {Array} List of host rules to apply to the connection. Each
   * rule must contain `from` and `to` properties to be applied.
   */
  constructor(request, opts) {
    super();
    opts = opts || {};
    this.arcRequest = Object.assign({}, request);
    this.aborted = false;
    this.stats = {};
    this.state = 0;
    this.socket = undefined;
    this._timeout = opts.timeout || 0;
    this.followRedirects = opts.followRedirects === undefined ? true : opts.followRedirects;
    this.hosts = opts.hosts;
    this.uri = request.url;
    /**
     * Host header can be different than registered URL because of `hosts` rules.
     * If a rule changes host value of the URL the original URL's host value
     * is used when generating the request and not overriden one.
     * This way virual hosts can be tested using hosts.
     *
     * @type {String}
     */
    this.hostHeader = this._getHostHeader(request.url);
  }

  set uri(value) {
    value = this.applyHosts(value);
    this.__uri = url.parse(value);
  }

  get uri() {
    return this.__uri;
  }

  get timeout() {
    return this._timeout;
  }

  /**
   * Status indicating thet expecting a ststus message.
   *
   * @default 0
   */
  static get STATUS() {
    return 0;
  }
  /**
   * Status indicating thet expecting headers.
   *
   * @default 1
   */
  static get HEADERS() {
    return 1;
  }
  /**
   * Status indicating thet expecting a body message.
   *
   * @default 2
   */
  static get BODY() {
    return 2;
  }
  /**
   * Status indicating thet the message has been read and connection is closing or closed.
   *
   * @default 0
   */
  static get DONE() {
    return 3;
  }

  _cleanUp() {
    this.redirects = undefined;
    this._response = undefined;
    this.stats = {};
    this.state = SocketRequest.STATUS;
    this._rawBody = undefined;
    this._rawHeaders = undefined;
    this.abort();
    this.aborted = false;
  }

  _cleanUpRedirect() {
    this._response = undefined;
    this.stats = {};
    this.state = SocketRequest.STATUS;
    this._rawBody = undefined;
    this._rawHeaders = undefined;
  }

  send() {
    this.abort();
    this.aborted = false;
    return this.connect()
    .then(() => this.prepareMessage())
    .then(message => this.writeMessage(message))
    .catch(cause => {
      this.abort();
      throw cause;
    });
  }

  abort() {
    this.aborted = true;
    if (!this.socket) {
      return;
    }
    if (this.socket.destroyed) {
      this.socket = undefined;
      return;
    }
    this.socket.pause();
    this.socket.destroy();
  }

  /**
   * Prepares a HTTP message from ARC's request object.
   *
   * @return {Promise} Resolved promise to an `ArrayBuffer`.
   */
  prepareMessage() {
    var payload = this.arcRequest.payload;
    if (['get', 'head'].indexOf(this.arcRequest.method.toLowerCase()) !== -1) {
      payload = undefined;
    }
    return this._payloadMessage(payload)
    .then(buffer => {
      this._addContentLength(buffer);
      this._handleAuthorization(buffer);
      return this._prepareMessage(buffer);
    })
    .then(message => {
      if (this.auth) {
        if (this.auth.headers) {
          this.arcRequest.headers = this.auth.headers;
          delete this.auth.headers;
        }
      }
      return message;
    });
  }
  /**
   * Sends a data to a socket.
   *
   * @param {Buffer} message HTTP message to send
   * @return {[type]} [description]
   */
  writeMessage(buffer) {
    // const buffer = Buffer.from(message);
    this.arcRequest.messageSent = buffer;
    this.stats.messageSendStart = performance.now();
    return new Promise((resolve) => {
      this.socket.write(buffer, () => {
        this.stats.waitingStart = performance.now();
        this.stats.send = this.stats.waitingStart - this.stats.messageSendStart;
        this.emit('loadstart');
        resolve();
      });
    });
  }
  /**
   * Connects to a server and sends the message.
   *
   * @return {Promise} Promise resolved when socket is connected.
   */
  connect() {
    const port = this._getPort(this.uri.port, this.uri.protocol);
    const host = this.uri.hostname;
    var promise;
    if (port === 443 || this.uri.protocol === 'https:') {
      promise = this._connectTls(port, host);
    } else {
      promise = this._connect(port, host);
    }
    return promise
    .then(socket => {
      if (this.timeout && this.timeout > 0) {
        socket.setTimeout(this.timeout);
      }
      this.socket = socket;
      this._addSocketListeners(socket);
      socket.resume();
      return socket;
    });
  }
  /**
   * Connects to a server and writtes a message using insecured connection.
   *
   * @param {Number} port A port number to connect to.
   * @param {String} host A host name to connect to
   * @return {Promise} A promise resolved when the message was sent to a server
   */
  _connect(port, host) {
    return new Promise((resolve, reject) => {
      const connectionStart = performance.now();
      var afterLookup;
      const client = net.createConnection(port, host, {}, () => {
        this.stats.connect = performance.now() - afterLookup;
        resolve(client);
      });
      client.pause();
      client.once('lookup', () => {
        afterLookup = performance.now();
        this.stats.dns = afterLookup - connectionStart;
      });
      client.once('error', function(err) {
        reject(err);
      });
    });
  }
  /**
   * Connects to a server and writtes a message using secured connection.
   *
   * @param {Number} port A port number to connect to.
   * @param {String} host A host name to connect to
   * @return {Promise} A promise resolved when the message was sent to a server
   */
  _connectTls(port, host) {
    const options = {
      rejectUnauthorized: false,
      requestCert: false,
      requestOCSP: false,
      checkServerIdentity:  function() {},
      servername: host,
    };
    return new Promise((resolve, reject) => {
      const connectionStart = performance.now();
      var secureStart = -1;
      var afterLookup;
      const client = tls.connect(port, host, options, () => {
        secureStart = performance.now();
        this.stats.connect = performance.now() - afterLookup;
        resolve(client);
      });
      client.pause();
      client.once('error', function(e) {
        reject(e);
      });
      client.once('lookup', () => {
        afterLookup = performance.now();
        this.stats.dns = afterLookup - connectionStart;
      });
      client.once('secureConnect', () => {
        this.stats.ssl = secureStart > -1 ? performance.now() - secureStart : -1;
      });
    });
  }

  /**
   * Prepares a full HTTP message body
   *
   * @param {?Buffer} buffer Optional, body `Buffer`
   * @return {Buffer} `Buffer` of a HTTP message
   */
  _prepareMessage(buffer) {
    var headers = [];
    var path = this.uri.pathname;
    var search = this.uri.search;
    var hash = this.uri.hash;
    if (search) {
      path += search;
    }
    if (hash && path !== '#') {
      path += hash;
    }
    headers.push(this.arcRequest.method + ' ' + path + ' HTTP/1.1');
    if (this._hostRequired()) {
      headers.push('Host: ' + this.hostHeader);
    }
    var str = headers.join('\r\n');
    if (this.arcRequest.headers) {
      str += '\r\n';
      str += this._normalizeString(this.arcRequest.headers);
    }
    var startbuffer = Buffer.from(str, 'utf8');
    var endBuffer = Buffer.from(new Uint8Array([13, 10, 13, 10]));
    var body;
    var sum = startbuffer.length + endBuffer.length;
    if (buffer) {
      sum += buffer.length;
      body = Buffer.concat([startbuffer, endBuffer, buffer], sum);
    } else {
      body = Buffer.concat([startbuffer, endBuffer], sum);
    }
    return body;
  }
  /**
   * Tests if current connection is required to add `host` header.
   * It returns `false` only if `host` header has been already provided.
   *
   * @return {Boolean} True when the `host` header should be added to the
   * headers list.
   */
  _hostRequired() {
    var headers = this.arcRequest.headers;
    if (typeof headers !== 'string') {
      return true;
    }
    return headers.toLowerCase().indexOf('host:') === -1;
  }
  /**
   * Reads a port number for a connection.
   *
   * @param {?Number} port Existing information abour port.
   * @param {?String} protocol Request protocol. Only used if `port` is not set.
   * @return {Number} A port number. Default to 80.
   */
  _getPort(port, protocol) {
    if (port) {
      port = Number(port);
      if (port === port) {
        return port;
      }
    }
    if (protocol === 'https:') {
      return 443;
    }
    return 80;
  }

  /**
   * Tranforms a payload message into `Buffer`
   *
   * @param {String|Blob|ArrayBuffer|FormData} payload A payload message
   * @return {Promise} A promise resolved to a `Buffer`.
   */
  _payloadMessage(payload) {
    if (!payload) {
      return Promise.resolve();
    }
    if (typeof payload === 'string') {
      payload = this._normalizeString(payload);
      return Promise.resolve(Buffer.from(payload, 'utf8'));
    }
    if (payload instanceof ArrayBuffer) {
      return Promise.resolve(Buffer.from(payload));
    }
    if (payload instanceof Buffer) {
      return Promise.resolve(payload);
    }
    if (payload instanceof FormData) {
      let _conventer = require('./form-data');
      return _conventer(payload)
      .then(result => {
        let headers = this.arcRequest.headers;
        this.arcRequest.headers = this.replaceHeader(headers, 'Content-Type', result.type);
        return result.buffer;
      });
    }
    if (payload instanceof Blob) {
      return this._blob2buffer(payload);
    }
    return Promise.reject(new Error('Unsupported payload message'));
  }
  /**
   * Alters authorization header depending on the `auth` object
   */
  _handleAuthorization() {
    var auth = this.arcRequest.auth;
    if (!auth) {
      return;
    }
    switch (auth.method) {
      case 'ntlm': return this._authorizeNtlm(auth);
    }
  }

  _authorizeNtlm(authData) {
    var {NtlmAuth} = require('./ntlm');
    authData.url = this.arcRequest.url;
    var auth = new NtlmAuth(authData);
    if (!this.auth) {
      this.auth = {
        method: 'ntlm',
        state: 0,
        headers: this.arcRequest.headers
      };
      let msg = auth.createMessage1(this.uri.host);
      this.arcRequest.headers = this.replaceHeader(this.arcRequest.headers,
        'Authorization', 'NTLM ' + msg.toBase64());
      console.log('New auth headers: ', this.arcRequest.headers);
    } else if (this.auth && this.auth.state === 1) {
      let msg = auth.createMessage3(this.auth.challengeHeader, this.uri.host);
      this.auth.state = 2;
      this.arcRequest.headers = this.replaceHeader(this.arcRequest.headers,
        'authorization', 'NTLM ' + msg.toBase64());
    }
  }
  /**
   * Transfers blob to `ArrayBuffer`.
   *
   * @param {Blob} blob A blob object to transform
   * @return {Promise} A promise resolved to a `Buffer`
   */
  _blob2buffer(blob) {
    return new Promise((resolve, reject) => {
      var reader = new FileReader();
      reader.addEventListener('loadend', (e) => {
        resolve(Buffer.from(e.target.result));
      });
      reader.addEventListener('error', (e) => {
        reject(e.message);
      });
      reader.readAsArrayBuffer(blob);
    });
  }
  /**
   * Replaces a header in a headers string.
   *
   * @param {String} headers HTTP headers string
   * @param {String} name Header name to replace
   * @param {String} value A value to be repalced
   * @return {String} Updated HTTP headers string
   */
  replaceHeader(headers, name, value) {
    headers = headers || '';
    if (!name) {
      return headers;
    }
    headers = headers.split(/\n(?=[^ \t]+)/gim);
    var lowerName = name.toLowerCase();
    var updated = false;
    var result = [];
    for (var i = 0, len = headers.length; i < len; i++) {
      let line = headers[i].trim();
      if (!line) {
        continue;
      }
      if (updated) {
        result.push(line);
        continue;
      }
      let pos = line.toLowerCase().indexOf(lowerName);
      if (pos !== 0) {
        result.push(line);
        continue;
      }
      updated = true;
      let h = name + ': ' + value;
      result.push(h);
    }
    if (!updated) {
      result.push(name + ': ' + value);
    }
    return result.join('\n');
  }

  /**
   * NormalizeLineEndingsToCRLF
   * https://code.google.com/p/chromium/codesearch#chromium/src/third_party/WebKit/Source/
   * platform/text/LineEnding.cpp&rcl=1458041387&l=101
   *
   * TODO: Check if using Uint8Array is faster.
   */
  _normalizeString(string) {
    var result = '';
    for (var i = 0; i < string.length; i++) {
      let c = string[i];
      let p = string[i + 1];
      if (c === '\r') {
        // Safe to look ahead because of trailing '\0'.
        if (p && p !== '\n') {
          // Turn CR into CRLF.
          result += '\r';
          result += '\n';
        }
      } else if (c === '\n') {
        result += '\r';
        result += '\n';
      } else {
        // Leave other characters alone.
        result += c;
      }
    }
    return result;
  }

  /**
   * Adds the `content-length` header to current request headers list if
   * it's required.
   * This function will do nothing if the request do not carry a payload or
   * when the content length header is already set.
   *
   * @param {ArrayBuffer} buffer Generated message buffer.
   */
  _addContentLength(buffer) {
    if (this.arcRequest.method === 'GET') {
      return;
    }
    var size = buffer ? buffer.length : 0;
    var headers = this.arcRequest.headers;
    // HEAD must set content length header even if it's not carrying payload.
    if (headers) {
      if (headers.toLowerCase().indexOf('content-length') === -1) {
        let header = 'Content-Length';
        headers = this.replaceHeader(headers, header, size);
      } else {
        // The app should not replace provided value (???)
        // headers = this.replaceHeader(headers, 'content-length', size);
      }
    } else {
      headers = 'content-length: ' + size;
    }
    this.arcRequest.headers = headers;
  }

  /**
   * Convert ArrayBuffer to readable form
   * @param {ArrayBuffer} buff
   * @returns {String} Converted string
   */
  arrayBufferToString(buff) {
    if (this.aborted) {
      return '';
    }
    if (buff instanceof Buffer) {
      return buff.toString();
    }
    if (!!buff.buffer) {
      // Not a ArrayBuffer, need and instance of AB
      // It can't just get buff.buffer because it will use original buffer if
      // the buff is a slice of it.
      let b = buff.slice(0);
      buff = b.buffer;
    }
    buff = Buffer.from(buff);
    return buff.toString();
  }
  /**
   * Convert a string to an ArrayBuffer.
   * @param {string} string The string to convert.
   * @return {Buffer} An array buffer whose bytes correspond to the string.
   * @returns {Buffer}
   */
  stringToArrayBuffer(string) {
    if (this.aborted) {
      return new ArrayBuffer();
    }
    return Buffer.from(string, 'utf8');
  }
  /**
   * Add event listeners to existing socket.
   * @param {net.Socket} socket An instance of the socket.
   */
  _addSocketListeners(socket) {
    var received = false;
    socket.on('data', (data) => {
      if (!received) {
        let now = performance.now();
        this.stats.firstReceived = now;
        this.stats.wait = now - this.stats.waitingStart;
        this.emit('firstbyte');
        received = true;
      }
      data = Buffer.from(data);
      try {
        this._processSocketMessage(data);
      } catch (e) {
        this._errorRequest({
          message: e.message || 'Unknown error occurred'
        });
        return;
      }
    });
    socket.on('timeout', () => {
      this.state = SocketRequest.DONE;
      this._errorRequest(new Error('Connection timeout.'));
    });
    socket.on('end', () => {
      this.stats.lastReceived = performance.now();
      this.stats.receive = this.stats.lastReceived - this.stats.firstReceived;
      if (this.state !== SocketRequest.DONE) {
        if (!this._response) {
          // The parser havn't found the end of message so there was no message!
          this._errorRequest(new Error('Connection closed without sending a data'));
        } else {
          // There is an issue with the response. Size missmatch? Anyway,
          // it tries to create a response from current data.
          this.emit('loadend');
          this._publishResponse({
            includeRedirects: true
          });
        }
      }
    });
    socket.on('error', (err) => {
      this._errorRequest(err);
    });
    return socket;
  }

  _processResponse(buffer) {
    this._processSocketMessage(buffer);
    this._reportResponse();
  }

  _reportResponse() {
    if (this.aborted) {
      return;
    }
    this.stats.lastReceived = performance.now();
    this.stats.receive = this.stats.lastReceived - this.stats.firstReceived;
    var status = this._response.status;
    if (status >= 300 && status < 400) {
      if (this.followRedirects && this._reportRedirect(status)) {
        return;
      }
    } else if (status === 401 && this.auth) {
      switch (this.auth.method) {
        case 'ntlm':
          this.handleNtlmResponse();
          return;
      }
    }
    this.emit('loadend');
    this._publishResponse({
      includeRedirects: true
    });
  }

  handleNtlmResponse() {
    if (this.auth.state === 0) {
      if (this._response.headers.has('www-authenticate')) {
        this.auth.state = 1;
        this.auth.challengeHeader = this._response.headers.get('www-authenticate');
        this._cleanUpRedirect();
        return this.prepareMessage()
        .then(message => this.writeMessage(message));
      }
    }
    delete this.auth;
    this.emit('loadend');
    this._publishResponse({
      includeRedirects: true
    });
  }

  _reportRedirect(status) {
    // https://github.com/jarrodek/socket-fetch/issues/13
    var redirect = false;
    var redirectOptions = {};
    switch (status) {
      case 300:
      case 304:
      case 305:
        // do nothing;
        break;
      case 301:
      case 302:
      case 307:
        if (['GET','HEAD'].indexOf(this.arcRequest.method) !== -1) {
          redirect = true;
        }
        break;
      case 303:
        redirect = true;
        redirectOptions.forceGet = true;
        break;
    }
    if (!redirect) {
      return false;
    }
    var locationHeader = 'location';
    if (!this._response.headers.has(locationHeader)) {
      return false;
    }
    redirectOptions.location = this._response.headers.get(locationHeader);
    process.nextTick(() => {
      this._redirectRequest(redirectOptions);
    });
    return true;
  }

  /**
   * Creates a response and adds it to the redirects list and redirects the request to the
   * new location.
   *
   * @param {Object} options A redirection options:
   * forceGet {Boolean} - If true the redirected request will be GET request
   * location {String} - location of the resource (redirect uri)
   */
  _redirectRequest(options) {
    var location = options.location;
    // https://github.com/jarrodek/socket-fetch/issues/5
    try {
      let u = new URL(location);
      let protocol = u.protocol;
      if (protocol === '') {
        let path = u.pathname;
        if (path && path[0] !== '/') {
          path = '/' + path;
        }
      }
    } catch (e) {
      // It must be relative location
      let origin = this.uri.protocol + '//';
      origin += this.uri.host;
      if (origin[origin.length - 1] === '/') {
        origin = origin.substr(0, origin.length - 1);
      }
      if (location[0] !== '/') {
        location = origin + this.uri.pathname + location;
      } else {
        location = origin + location;
      }
    }

    // check if this is infinite loop
    if (this.redirects) {
      let index = -1;
      let i = 0;
      for (let item of this.redirects) {
        if (item.requestUrl === location) {
          index = i;
          break;
        }
        i++;
      }
      if (index !== -1) {
        this._errorRequest({
          code: 310
        });
        return;
      }
    }
    var detail = {
      location: location,
      returnValue: true
    };
    this.emit('beforeredirect', detail);
    if (!detail.returnValue) {
      this._publishResponse({
        includeRedirects: true
      });
      return;
    }
    if (!this.redirects) {
      this.redirects = new Set();
    }
    var responseCookies;
    if (this._response.headers.has('set-cookie')) {
      responseCookies = this._response.headers.get('set-cookie');
    }
    this._createResponse({
      includeRedirects: false
    })
    .then(response => {
      response.requestUrl = this.arcRequest.url;
      response.messageSent = this.arcRequest.messageSent;
      this.redirects.add(response);
      return this._cleanUpRedirect({
        keepConnection: false
      });
    })
    .then(() => {
      if (!responseCookies) {
        return;
      }
      this._processRedirectCookies(responseCookies, location);
    })
    .then(() => {
      this.arcRequest.url = location;
      if (options.forceGet) {
        this.arcRequest.method = 'GET';
      }
      this.uri = location;
      // No idea why but without setTimeout the program loses it's scope after calling
      // the function.
      window.setTimeout(() => {
        this.send();
      }, 0);
    })
    .catch((e) => {
      this._errorRequest({
        'message': e && e.message || 'Unknown error occurred'
      });
    });
  }

  /**
   * Process received message.
   *
   * @param {ArrayBuffer} data Received message.
   */
  _processSocketMessage(data) {
    if (this.aborted) {
      return;
    }
    if (this.state === SocketRequest.DONE) {
      return;
    }
    if (this.state === SocketRequest.STATUS) {
      data = this._processStatus(data);
      if (!data) {
        return;
      }
    }
    if (this.state === SocketRequest.HEADERS) {
      data = this._processHeaders(data);
      if (!data) {
        return;
      }
    }
    if (this.state === SocketRequest.BODY) {
      this._processBody(data);
      return;
    }
  }

  /**
   * Read status line from the response.
   * This function will set `status` and `statusMessage` fields
   * and then will set `state` to HEADERS.
   *
   * @param {Buffer} data Received data
   */
  _processStatus(data) {
    if (this.aborted) {
      return;
    }
    this._response = {
      status: 0,
      statusMessage: ''
    };

    if (!data) {
      return;
    }

    console.log('Processing status');
    var index = data.indexOf(nlBuffer);
    var statusLine = data.slice(0, index).toString();
    data = data.slice(index + 2);
    statusLine = statusLine.replace(/HTTP\/\d(\.\d)?\s/, '');
    var delimPos = statusLine.indexOf(' ');
    var status;
    var msg = '';
    if (delimPos === -1) {
      status = statusLine;
    } else {
      status = statusLine.substr(0, delimPos);
      msg = statusLine.substr(delimPos + 1);
    }
    status = Number(status);
    if (status !== status) {
      status = 0;
    }
    if (msg && msg.indexOf('\n') !== -1) {
      msg = msg.split('\n')[0];
    }
    this._response.status = status;
    this._response.statusMessage = msg;
    console.log('Received status', this._response.status, this._response.statusMessage);
    this.state = SocketRequest.HEADERS;
    return data;
  }

  /**
   * Read headers from the received data.
   *
   * @param {Buffer} data Received data
   */
  _processHeaders(data) {
    if (this.aborted) {
      return;
    }
    if (!data) {
      this._parseHeaders();
      return;
    }
    console.log('Processing headers');
    // Looking for end of headers section
    var index = data.indexOf(nlNlBuffer);
    var padding = 4;
    if (index === -1) {
      // It can also be 2x ASCII 10
      let _index = data.indexOf(nlBuffer);
      if (_index !== -1) {
        index = _index;
        padding = 2;
      }
    }

    // https://github.com/jarrodek/socket-fetch/issues/3
    var enterIndex = data.indexOf(nlBuffer);
    if (index === -1 && enterIndex !== 0) {
      // end in next chunk
      // this._connection.headers += this.arrayBufferToString(data);
      if (!this._rawHeaders) {
        this._rawHeaders = data;
      } else {
        let sum = this._rawHeaders.length + data.length;
        this._rawHeaders = Buffer.concat([this._rawHeaders, data], sum);
      }
      return;
    }
    if (enterIndex !== 0) {
      let headersArray = data.slice(0, index);
      if (!this._rawHeaders) {
        this._rawHeaders = headersArray;
      } else {
        let sum = this._rawHeaders.length + headersArray.length;
        this._rawHeaders = Buffer.concat([this._rawHeaders, headersArray], sum);
      }
    }
    this._parseHeaders(this._rawHeaders);
    delete this._rawHeaders;
    this.state = SocketRequest.BODY;
    var start = index === -1 ? 0 : index;
    var move = (enterIndex === 0) ? 2 : padding;
    data = data.slice(start + move);
    return this._postHeaders(data);
  }
  // Check the response headers and end the request if nescesary.
  _postHeaders(data) {
    if (this.arcRequest.method === 'HEAD') {
      this._reportResponse();
      return;
    }
    if (data.length === 0) {
      if (this._response.headers.has('Content-Length')) {
        // If the server do not close the connection and clearly indicate that
        // there are no further data to receive the app can close the connection
        // and prepare the response.
        let length = Number(this._response.headers.get('Content-Length'));
        // NaN never equals NaN. This is faster.
        if (length === length && length === 0) {
          this._reportResponse();
          return;
        }
      } else if (!this._response.headers.has('Transfer-Encoding') ||
        !this._response.headers.get('Transfer-Encoding')) {
        // Fix for https://github.com/jarrodek/socket-fetch/issues/6
        // There is no body in the response.
        this._reportResponse();
        return;
      }
      return;
    }
    return data;
  }

  /**
   * This function assumes that all the headers has been read and it's just before changing
   * the ststaus to BODY.
   */
  _parseHeaders(array) {
    var raw = '';
    if (array) {
      raw = array.toString();
    }
    this._response.headersRaw = raw;
    var list = this.headersToObject(raw);
    console.log('Received headers list', raw);
    var headers = new Headers(list);
    this._response.headers = headers;
    if (headers.has('Content-Length')) {
      this._contentLength = Number(headers.get('Content-Length'));
    }
    if (headers.has('Transfer-Encoding')) {
      let tr = headers.get('Transfer-Encoding');
      if (tr === 'chunked') {
        this._chunked = true;
      }
    }
    var detail = {
      returnValue: true,
      value: headers
    };
    this.emit('headersreceived', detail);
    if (!detail.returnValue) {
      this.abort();
      return;
    }
  }
  /**
   * Chunked body must be properly processed
   *
   * @param {Buffer} data A data to process
   */
  _processBody(data) {
    if (this.aborted) {
      return;
    }
    if (this._chunked) {
      return this._processBodyChunked(data);
    }

    if (!this._rawBody) {
      this._rawBody = data;
      if (this._rawBody.length >= this._contentLength) {
        return this._reportResponse();
      }
      return;
    }
    let sum = this._rawBody.length + data.length;
    this._rawBody = Buffer.concat([this._rawBody, data], sum);
    if (this._rawBody.length >= this._contentLength) {
      return this._reportResponse();
    }
  }

  _processBodyChunked(data) {
    if (this.__bodyChunk) {
      data = Buffer.concat([this.__bodyChunk, data], this.__bodyChunk.length + data.length);
      this.__bodyChunk = undefined;
    }
    while (true) {
      if (this._chunkSize === 0 && data.indexOf(nlNlBuffer) === 0) {
        this._reportResponse();
        return;
      }
      if (!this._chunkSize) {
        data = this.readChunkSize(data);
        if (!this._chunkSize && this._chunkSize !== 0) {
          // It may happen that node's buffer cuts the data
          // just before the chunk size.
          // It should proceed it in next portion of the data.
          return;
        }
        if (!this._chunkSize) {
          this._reportResponse();
          return;
        }
      }
      let size = Math.min(this._chunkSize, data.length);
      let sliced = data.slice(0, size);
      if (!this._rawBody) {
        this._rawBody = sliced;
      } else {
        let sum = size + this._rawBody.length;
        this._rawBody = Buffer.concat([this._rawBody, sliced], sum);
      }

      this._chunkSize -= size;
      if (data.length === 0) {
        // console.warn('Next chunk will start with CRLF!');
        return;
      }
      data = data.slice(size + 2); // + CR
      if (data.length === 0) {
        // console.log('No more data here. Waiting for new chunk');
        return;
      }
    }
  }
  /**
   * If response's Transfer-Encoding is 'chunked' read until next CR.
   * Everything before it is a chunk size.
   *
   * @param {Buffer} array
   * @returns {Buffer}
   */
  readChunkSize(array) {
    if (this.aborted) {
      return;
    }
    var index = array.indexOf(nlBuffer);
    if (index === -1) {
      // not found in this portion of data.
      return array;
    }
    if (index === 0) {
      // Node's buffer cuts CRLF after the end of chunk data, without last CLCR,
      // here's to fix it.
      // It can be either new line from the last chunk or end of the message where
      // the rest of the array is [13, 10, 48, 13, 10, 13, 10]
      if (array.indexOf(nlNlBuffer) === 0) {
        this._chunkSize = 0;
        return Buffer.alloc(0);
      } else {
        array = array.slice(index + 2);
        index = array.indexOf(nlBuffer);
      }
    }
    // console.log('Size index: ', index);
    var chunkSize = parseInt(array.slice(0, index).toString(), 16);
    if (chunkSize !== chunkSize) {
      this._chunkSize = undefined;
      return array.slice(index + 2);
    }
    this._chunkSize = chunkSize;
    return array.slice(index + 2);
  }
  /**
   * Parse headers string and receive an object.
   *
   * @param {String} str A headers string as defined in the spec
   * @return {Object} And object of key-value pairs where key is a
   */
  headersToObject(str) {
    if (this.aborted) {
      return {};
    }
    if (!str || typeof str !== 'string' || str.trim() === '') {
      return {};
    }
    const result = {};
    const headers = str.split(/\n(?=[^ \t]+)/gm);

    for (let i = 0, len = headers.length; i < len; i++) {
      let line = headers[i].trim();
      if (line === '') {
        continue;
      }
      let pos = line.indexOf(':');
      if (pos === -1) {
        result[line] = '';
        continue;
      }
      let name = line.substr(0, pos);
      let value = line.substr(pos + 1).trim();
      if (name in result) {
        result[name] += '; ' + value;
      } else {
        result[name] = value;
      }
    }
    return result;
  }

  /**
   * Create a `Response` object.
   *
   * @param {Object} opts An options to construct a response object:
   *  - {Boolean} includeRedirects If true the response will have information about redirects.
   *  - {Error} error An error object when the response is errored.
   * @return {Response} A response object.
   */
  _createResponse(opts) {
    opts = opts || {};
    if (opts.error) {
      let err = Response.error();
      err.error = new Error(opts.error.message || opts.error);
      return Promise.resolve(err);
    }
    if (this.aborted) {
      return Promise.resolve();
    }
    var status = this._response.status;
    if (status < 100 || status > 599) {
      return Promise.reject(new Error(`The response status "${status}" is not allowed.
      See HTTP spec for more details: https://tools.ietf.org/html/rfc2616#section-6.1.1`));
    } else if (status === undefined) {
      return Promise.reject(new Error(`The response status is empty.
      It means that the successful connection wasn't made. Check your request parameters.`));
    }
    return this._decompress()
    .then(body => {
      let options = {
        status: status,
        statusText: this._response.statusMessage,
        headers: this._response.headers
      };
      let response = new Response(body, options);
      response.stats = this.stats;
      if (opts.includeRedirects && this.redirects && this.redirects.size) {
        response.redirects = this.redirects;
      }
      if (status === 401) {
        response.auth = this._getAuth();
      }
      return response;
    });
  }

  _getAuth() {
    if (this.auth) {
      return this.auth;
    }
    var auth = this._response.headers.has('www-authenticate') ?
      this._response.headers.get('www-authenticate') : undefined;
    var result = {
      'method': 'unknown'
    };
    if (auth) {
      auth = auth.toLowerCase();
      if (auth.indexOf('ntlm') !== -1) {
        result.method = 'ntlm';
      } else if (auth.indexOf('basic') !== -1) {
        result.method = 'basic';
      } else if (auth.indexOf('digest') !== -1) {
        result.method = 'digest';
      }
    }
    return result;
  }
  /**
   * Decompresses received body if `content-encoding` header is set.
   *
   * @return {Promise} Promise resilved to parsed body
   */
  _decompress() {
    if (this.aborted) {
      return Promise.resolve();
    }
    var body = this._rawBody;
    if (!body) {
      return Promise.resolve();
    }
    var ceHeader = 'content-encoding';
    if (!this._response.headers.has(ceHeader)) {
      return Promise.resolve(body);
    }
    var ce = this._response.headers.get(ceHeader);
    if (ce.indexOf('deflate') !== -1) {
      return this._inflate(body);
    }
    if (ce.indexOf('gzip') !== -1) {
      return this._gunzip(body);
    }
    return Promise.resolve(body);
  }

  _inflate(body) {
    body = Buffer.from(body);
    return new Promise((resolve, reject) => {
      zlib.inflate(body, (err, buffer) => {
        if (err) {
          reject(new Error(err.message || err));
        } else {
          resolve(buffer);
        }
      });
    });
  }

  _gunzip(body) {
    body = Buffer.from(body);
    return new Promise((resolve, reject) => {
      zlib.gunzip(body, (err, buffer) => {
        if (err) {
          reject(new Error(err.message || err));
        } else {
          resolve(buffer);
        }
      });
    });
  }

  /**
   * Generate response object and publish it to the listeners.
   *
   * @param {Object} opts See #_createResponse for more info.
   */
  _publishResponse(opts) {
    this.state = SocketRequest.DONE;
    return this._createResponse(opts)
    .then(response => {
      this.emit('load', response, this.arcRequest);
      this._cleanUp();
      this.abort();
    })
    .catch((e) => {
      this._errorRequest({
        'message': e && e.message || 'Unknown error occurred'
      });
    });
  }

  _processRedirectCookies(responseCookies, location) {
    var newParser = new Cookies(responseCookies, location);
    newParser.filter();
    var expired = newParser.clearExpired();
    var requestHeaders = this.arcRequest.headers || '';
    let headersList = this.headersToObject(requestHeaders);
    let names = Object.keys(headersList);
    let index = names.findIndex(name => name.toLowerCase() === 'cookie');
    if (index !== -1) {
      var oldCookies = headersList[names[index]];
      var oldParser = new Cookies(oldCookies, location);
      oldParser.filter();
      oldParser.clearExpired();
      oldParser.merge(newParser);
      newParser = oldParser;
      // remove expired from the new response.
      newParser.cookies = newParser.cookies.filter(c => {
        for (let i = 0, len = expired.length; i < len; i++) {
          if (expired[i].name === c.name) {
            return false;
          }
        }
        return true;
      });
    }
    var str = newParser.toString(true);
    if (str) {
      this.arcRequest.headers = this.replaceHeader(requestHeaders, 'cookie', str);
    } else if (index !== -1) {
      let str = '';
      names.forEach(name => {
        if (name.toLowerCase() === 'cookie') {
          return;
        }
        if (str) {
          str += '\n';
        }
        str += name + ': ' + headersList[name];
      });
      this.arcRequest.headers = str;
    }
  }

  // Finishes the response with error message.
  _errorRequest(opts) {
    this.aborted = true;
    var message;
    if (opts.code && !opts.message) {
      message = this.getCodeMessage(opts.code);
    } else if (opts.message) {
      message = opts.message;
    }
    message = message || 'Unknown error occurred';
    var error = new Error(message);
    this.emit('error', error);
    this._cleanUp();
  }
  /**
   * Applies `hosts` rules to an URL.
   *
   * @param {String} value An URL to apply the rules to
   * @return {String} Evaluated URL with hosts rules.
   */
  applyHosts(value) {
    var rules = this.hosts;
    if (!rules || !rules.length) {
      return value;
    }
    for (let i = 0; i < rules.length; i++) {
      let rule = rules[i];
      let result = this._evaluateRule(value, rule);
      if (result) {
        return result;
      }
    }
    return value;
  }

  _evaluateRule(url, rule) {
    if (!rule.from || !rule.to) {
      return;
    }
    var re = this._createRuleRe(rule.from);
    if (!re.test(url)) {
      return;
    }
    return url.replace(re, rule.to);
  }

  _createRuleRe(input) {
    input = input.replace(/\*/g, '(.*)');
    return new RegExp(input, 'gi');
  }
  /**
   * Creates a value for host header.
   *
   * @param {String} value An url to get the information from.
   * @return {String} Value of the host header
   */
  _getHostHeader(value) {
    var uri = url.parse(value);
    var hostValue = uri.hostname;
    var defaultPorts = [80, 443];
    var port = this._getPort(uri.port, uri.protocol);
    if (defaultPorts.indexOf(port) === -1) {
      hostValue += ':' + port;
    }
    return hostValue;
  }

  getCodeMessage(code) {
    var errorCodes = {
      1: 'An asynchronous IO operation is not yet complete.',
      2: 'A generic failure occurred.',
      3: 'An operation was aborted (due to user action)',
      4: 'An argument to the function is incorrect.',
      5: 'The handle or file descriptor is invalid',
      6: 'The file or directory cannot be found',
      7: 'An operation timed out',
      8: 'The file is too large',
      9: 'An unexpected error.  This may be caused by a programming mistake or an invalid ' +
        'assumption',
      10: 'Permission to access a resource, other than the network, was denied',
      11: 'The operation failed because of unimplemented functionality',
      12: 'There were not enough resources to complete the operation',
      13: 'Memory allocation failed',
      14: 'The file upload failed because the file\'s modification time was different from the ' +
        'expectation',
      15: 'The socket is not connected',
      16: 'The file already exists',
      17: 'The path or file name is too long',
      18: 'Not enough room left on the disk',
      19: 'The file has a virus',
      20: 'The client chose to block the request',
      21: 'The network changed',
      22: 'The request was blocked by the URL blacklist configured by the domain administrator',
      23: 'The socket is already connected',
      100: 'A connection was closed (corresponding to a TCP FIN)',
      101: 'A connection was reset (corresponding to a TCP RST)',
      102: 'A connection attempt was refused',
      103: 'A connection timed out as a result of not receiving an ACK for data sent. This can ' +
        'include a FIN packet that did not get ACK\'d',
      104: 'A connection attempt failed',
      105: 'The host name could not be resolved',
      106: 'The Internet connection has been lost',
      107: 'An SSL protocol error occurred',
      108: 'The IP address or port number is invalid (e.g., cannot connect to the IP address 0 ' +
        'or the port 0)',
      109: 'The IP address is unreachable.  This usually means that there is no route to the ' +
        'specified host or network',
      110: 'The server requested a client certificate for SSL client authentication',
      111: 'A tunnel connection through the proxy could not be established',
      112: 'No SSL protocol versions are enabled',
      113: 'The client and server don\'t support a common SSL protocol version or cipher suite',
      114: 'The server requested a renegotiation (rehandshake)',
      115: 'The proxy requested authentication (for tunnel establishment) with an unsupported ' +
        'method',
      116: 'During SSL renegotiation (rehandshake), the server sent a certificate with an error',
      117: 'The SSL handshake failed because of a bad or missing client certificate',
      118: 'A connection attempt timed out',
      119: 'There are too many pending DNS resolves, so a request in the queue was aborted',
      120: 'Failed establishing a connection to the SOCKS proxy server for a target host',
      121: 'The SOCKS proxy server failed establishing connection to the target host because ' +
        'that host is unreachable',
      122: 'The request to negotiate an alternate protocol failed',
      123: 'The peer sent an SSL no_renegotiation alert message',
      124: 'Winsock sometimes reports more data written than passed.  This is probably due to a ' +
        'broken LSP',
      125: 'An SSL peer sent us a fatal decompression_failure alert.',
      126: 'An SSL peer sent us a fatal bad_record_mac alert',
      127: 'The proxy requested authentication (for tunnel establishment)',
      128: 'A known TLS strict server didn\'t offer the renegotiation extension',
      129: 'The SSL server attempted to use a weak ephemeral Diffie-Hellman key',
      130: 'Could not create a connection to the proxy server.',
      131: 'A mandatory proxy configuration could not be used.',
      133: 'We\'ve hit the max socket limit for the socket pool while preconnecting.',
      134: 'The permission to use the SSL client certificate\'s private key was denied',
      135: 'The SSL client certificate has no private key',
      136: 'The certificate presented by the HTTPS Proxy was invalid',
      137: 'An error occurred when trying to do a name resolution (DNS)',
      138: 'Permission to access the network was denied.',
      139: 'The request throttler module cancelled this request to avoid DDOS',
      140: 'A request to create an SSL tunnel connection through the HTTPS proxy received a ' +
        'non-200 (OK) and non-407 (Proxy Auth) response.',
      141: 'We were unable to sign the CertificateVerify data of an SSL client auth handshake ' +
        'with the client certificate\'s private key',
      142: 'The message was too large for the transport',
      143: 'A SPDY session already exists, and should be used instead of this connection',
      145: 'Websocket protocol error.',
      146: 'Connection was aborted for switching to another ptotocol.',
      147: 'Returned when attempting to bind an address that is already in use',
      148: 'An operation failed because the SSL handshake has not completed',
      149: 'SSL peer\'s public key is invalid',
      150: 'The certificate didn\'t match the built-in public key pins for the host name',
      151: 'Server request for client certificate did not contain any types we support',
      152: 'Server requested one type of cert, then requested a different type while the first ' +
        'was still being generated',
      153: 'An SSL peer sent us a fatal decrypt_error alert. ',
      154: 'There are too many pending WebSocketJob instances, so the new job was not pushed ' +
        'to the queue',
      155: 'There are too many active SocketStream instances, so the new connect request was ' +
        'rejected',
      156: 'The SSL server certificate changed in a renegotiation',
      157: 'The SSL server indicated that an unnecessary TLS version fallback was performed',
      158: 'Certificate Transparency: All Signed Certificate Timestamps failed to verify',
      159: 'The SSL server sent us a fatal unrecognized_name alert',
      300: 'The URL is invalid',
      301: 'The scheme of the URL is disallowed',
      302: 'The scheme of the URL is unknown',
      310: 'Attempting to load an URL resulted in too many redirects',
      311: 'Attempting to load an URL resulted in an unsafe redirect (e.g., a redirect to file: ' +
        'is considered unsafe)',
      312: 'Attempting to load an URL with an unsafe port number.',
      320: 'The server\'s response was invalid',
      321: 'Error in chunked transfer encoding',
      322: 'The server did not support the request method',
      323: 'The response was 407 (Proxy Authentication Required), yet we did not send the ' +
        'request to a proxy',
      324: 'The server closed the connection without sending any data',
      325: 'The headers section of the response is too large',
      326: 'The PAC requested by HTTP did not have a valid status code (non-200)',
      327: 'The evaluation of the PAC script failed',
      328: 'The response was 416 (Requested range not satisfiable) and the server cannot ' +
        'satisfy the range requested',
      329: 'The identity used for authentication is invalid',
      330: 'Content decoding of the response body failed',
      331: 'An operation could not be completed because all network IO is suspended',
      332: 'FLIP data received without receiving a SYN_REPLY on the stream',
      333: 'Converting the response to target encoding failed',
      334: 'The server sent an FTP directory listing in a format we do not understand',
      335: 'Attempted use of an unknown SPDY stream id',
      336: 'There are no supported proxies in the provided list',
      337: 'There is a SPDY protocol error',
      338: 'Credentials could not be established during HTTP Authentication',
      339: 'An HTTP Authentication scheme was tried which is not supported on this machine',
      340: 'Detecting the encoding of the response failed',
      341: '(GSSAPI) No Kerberos credentials were available during HTTP Authentication',
      342: 'An unexpected, but documented, SSPI or GSSAPI status code was returned',
      343: 'The environment was not set up correctly for authentication',
      344: 'An undocumented SSPI or GSSAPI status code was returned',
      345: 'The HTTP response was too big to drain',
      346: 'The HTTP response contained multiple distinct Content-Length headers',
      347: 'SPDY Headers have been received, but not all of them - status or version headers ' +
        'are missing, so we\'re expecting additional frames to complete them',
      348: 'No PAC URL configuration could be retrieved from DHCP.',
      349: 'The HTTP response contained multiple Content-Disposition headers',
      350: 'The HTTP response contained multiple Location headers',
      351: 'SPDY server refused the stream. Client should retry. This should never be a ' +
        'user-visible error',
      352: 'SPDY server didn\'t respond to the PING message',
      353: 'The request couldn\'t be completed on an HTTP pipeline. Client should retry',
      354: 'The HTTP response body transferred fewer bytes than were advertised by the ' +
        'Content-Length header when the connection is closed',
      355: 'The HTTP response body is transferred with Chunked-Encoding, but the terminating ' +
        'zero-length chunk was never sent when the connection is closed',
      356: 'There is a QUIC protocol error',
      357: 'The HTTP headers were truncated by an EOF',
      358: 'The QUIC crytpo handshake failed.',
      359: 'An https resource was requested over an insecure QUIC connection',
      501: 'The server\'s response was insecure (e.g. there was a cert error)',
      502: 'The server responded to a <keygen> with a generated client cert that we don\'t ' +
        'have the matching private key for',
      503: 'An error adding to the OS certificate database (e.g. OS X Keychain)',
      800: 'DNS resolver received a malformed response',
      801: 'DNS server requires TCP',
      802: 'DNS server failed.',
      803: 'DNS transaction timed out',
      804: 'The entry was not found in cache, for cache-only lookups',
      805: 'Suffix search list rules prevent resolution of the given host name',
      806: 'Failed to sort addresses according to RFC3484'
    };
    if (code in errorCodes) {
      return errorCodes[code];
    } else {
      return 'Unknown error';
    }
  }
}
exports.SocketRequest = SocketRequest;
