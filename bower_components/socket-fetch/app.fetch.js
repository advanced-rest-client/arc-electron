(function() {
  'use strict';
  /**
   * This object represents default options for SocketFetch class.
   * This can be set before class initialize.
   */
  const SocketFetchOptions = {
    /**
     * Use this property to set up script import URL.
     * This library uses web workders. Sometimes it is necessary to change import path of the
     * library.
     * By default the script will look in / path for web workers. However bower or combined scripts
     * me have been placed in different location so this should be set to locate a file.
     *
     * Example:
     * /path/to/file/%s
     *
     * Keep the %s. The script will replace it with corresponding file name.
     */
    importUrl: null
  };
  /*******************************************************************************
   * Copyright 2016 Pawel Psztyc, The ARC team
   *
   * Licensed under the Apache License, Version 2.0 (the "License"); you may not
   * use this file except in compliance with the License. You may obtain a copy of
   * the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
   * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
   * License for the specific language governing permissions and limitations under
   * the License.
   ******************************************************************************/

  var URLSearchParams = URLSearchParams || {};
  /**
   * A SocketFetch class is similar to fetch API but it uses chrome.socket as a transport.
   *
   * This library require Zlib to run.
   *
   * ```
   * let request = SocketFetch('http://domain.com').fetch().then((response) => {
   *   if (response.ok) {
   *     return response.json();
   *   }
   * });
   * ```
   */
  class SocketFetch extends ArcEventSource {
    /**
     * Partially based on
     * https://github.com/ahmadnassri/chrome.sockets.tcp.xhr/
     *
     *
     *
     * @constructor
     * @property {String} url Defines the resource that you wish to fetch. This can either be:
     * A USVString containing the direct URL of the resource you want to fetch.
     *
     * @param {String|ArcRequest|Request} url An URL, {@link Request} or {@link ArcRequest} object.
     * @property {Object} opts (Optional) An options object containing any custom settings that you
     * want to apply to the request. The possible options are:
     * - method: The request method, e.g., GET, POST.
     * - headers: Any headers you want to add to your request, contained within a Headers object or
     *   an object literal with ByteString values.
     * - body: Any body that you want to add to your request: this can be a Blob, BufferSource,
     *   FormData, URLSearchParams, or USVString object. Note that a request using the GET or HEAD
     *   method cannot have a body.
     * - redirect: The redirect mode to use: follow or error. If follow is set the result will
     *   contain redairect information.
     * - requestId: Application innternall requests indetification system. It is set on each event
     *   detail object
     */
    constructor(url, opts) {
      super();
      opts = opts || {};
      this._logs = [];
      /**
       * A original request object.
       * This will contain data passed to the constructor.
       *
       * @type {Request}
       */
      this._request = this._createRequest(url, opts);
      this.requestId = opts.requestId;
      /**
       * The Response interface of the Fetch API represents the response to a request.
       *
       * @type {Response}
       */
      this._response = undefined;

      if (typeof opts.debug !== 'undefined') {
        this.debug = opts.debug;
      } else {
        this.debug = false;
      }
      /**
       * True if the request has been aborted.
       */
      this.aborted = false;
      /**
       * A boolean property state represents the socket read status. It can be either:
       * STATUS (0) - expecting the message is contain a status line
       * HEADERS (1) - expecting the message is containing headers part of the message (headers are
       * optional)
       * BODY (2) - expecting to read a message body
       * DONE (3) - message has been fully read. This status can be set by readSocketError function
       * when server closes the connection.
       */
      this.state = 0;
      /**
       * A set of redirects.
       *
       * @type {Set}
       */
      this.redirects = undefined;
      /**
       * A reference to main promise.
       */
      this._mainPromise = {
        resolve: undefined,
        reject: undefined
      };
      /**
       * Set of informations relevant to current socket connection.
       */
      this._connection = {
        /**
         * Set to true when the secured connection should be made.
         */
        useSSL: false,
        /**
         * Socket ID the instance is operating on.
         *
         * @type {Number}
         */
        socketId: undefined,
        /**
         * A connection can be made only once in one instance. It fthe flag state is true then
         * the implementation will throw an error.
         *
         * @type {Boolean}
         */
        started: false,
        /**
         * A host the socket is connecting to.
         *
         * @type {String}
         */
        host: undefined,
        /**
         * A port the socket is connecting on.
         *
         * @type {Number}
         * @default 80
         */
        port: 80,
        /**
         * A integer representing status code of the response.
         *
         * @type {Number}
         */
        status: undefined,
        /**
         * An optional string representing response status message
         *
         * @type {String}
         */
        statusMessage: undefined,
        /**
         * A read headers string. It may be incomplete if state equals HEADERS or STATUS.
         *
         * @type {String}
         */
        headers: undefined,
        /**
         * A read response body. It may be incomplete if readyState does not equals DONE.
         *
         * @type {Uint8Array}
         */
        body: undefined,
        /**
         * As a shortcut for finding Content-Length header in a headers list. It can be either a
         * getter function that is looking for a Content-Length header or a value set after headers
         * are parsed.
         *
         * @type {Number}
         */
        contentLength: undefined,
        /**
         * A shortcut for finding Content-Length header in a headers list. It can be either a getter
         * function that is looking for a Content-Length header or a value set after headers are
         * parsed
         *
         * @type {Boolean}
         */
        chunked: undefined,
        /**
         * A flag determining that the response is chunked Transfer-Encoding. When Transfer-Encoding
         * header is set to "chunked" then the response will be split in chunks. Every chunk starts
         * with hex number of length in chunk followed by new line character (\r\n or CR or 13|10).
         * Because message received by the socket most probably will have different buffer size, the
         * `readSocketData()` function may contain more than one part of chunk or incomplete part of
         * chunk.
         *
         * @type {Number}
         */
        chunkSize: undefined,
        /**
         * Message sent to the remote machine as a string of source message.
         * If the request consisted of binnary data it will be presented as a string.
         *
         * @type {String}
         */
        messageSent: undefined,
        /**
         * Some stats about the connection
         */
        stats: {
          /**
           * Timestamp of start.
           * Set just before connection attempt.
           */
          startTime: undefined,
          /**
           * Time required to create TCP connection.
           */
          connect: undefined,
          /**
           * Time required to send HTTP request to the server.
           */
          send: undefined,
          /**
           * Waiting for a response from the server.
           */
          wait: undefined,
          /**
           * Time required to read entire response from the server.
           */
          receive: undefined,
          /**
           * Time required for SSL/TLS negotiation.
           */
          ssl: undefined,
          _firstReceived: undefined,
          _lastReceived: undefined,
          _messageSending: undefined,
          _waitingStart: undefined
        }
      };
      /**
       * Request timeout settings.
       */
      this._timeout = {
        /**
         * True when connection is timed out.
         *
         * @type {Boolean}
         */
        timedout: false,
        /**
         * User set timeout (in miliseconds).
         *
         * @type {Number}
         */
        timeout: this._request.timeout,
        /**
         * An id of timer function.
         *
         * @type {Number}
         */
        timeoutId: undefined
      };
      /**
       * True if the request has FormData object as payload.
       * In this case `socket-fetch` must extract generated boudary and update content type
       * header to `multipart/form-data;boundary=[extracted boundary]`
       */
      this._isMultipartRequest = false;

      this._setupUrlData();
    }
    /**
     * Timeout set to the request.
     */
    get timeout() {
      return this._timeout.timedout;
    }
    /**
     * Get a Request object.
     *
     * @type {Request}
     */
    get request() {
      return this._request;
    }
    /**
     * Get a Response object.
     *
     * @type {Response}
     */
    get response() {
      return this._response;
    }
    /**
     * Replace popular shemas with port number
     *
     */
    get protocol2port() {
      return {
        'http': 80,
        'https': 443,
        'ftp': 21
      };
    }
    /**
     * Status indicating thet expecting a ststus message.
     *
     * @type {Number}
     * @default 0
     */
    static get STATUS() {
      return 0;
    }
    /**
     * Status indicating thet expecting headers.
     *
     * @type {Number}
     * @default 1
     */
    static get HEADERS() {
      return 1;
    }
    /**
     * Status indicating thet expecting a body message.
     *
     * @type {Number}
     * @default 2
     */
    static get BODY() {
      return 2;
    }
    /**
     * Status indicating thet the message has been read and connection is closing or closed.
     *
     * @type {Number}
     * @default 0
     */
    static get DONE() {
      return 3;
    }
    /**
     * Returns new promise and perform a request.
     *
     * @return {Promise} Fulfilled promise will result with Resposne object.
     */
    fetch() {
      return new Promise((resolve, reject) => {
        if (this.aborted) {
          this._createResponse({
            includeRedirects: true
          })
          .then(() => {
            resolve(this._response);
          })
          .catch((e) => {
            this._cancelTimer();
            reject({
              'message': e.message
            });
            this._cleanUp();
          });
          return;
        }

        if (this._connection.started) {
          reject(new Error('This connection has been made. Create a new class and use it instead.'));
          return;
        }

        this._connection.started = true;
        this._connection._readFn = this.readSocketData.bind(this);
        this._connection._errorFn = this.readSocketError.bind(this);
        this._mainPromise.reject = reject;
        this._mainPromise.resolve = resolve;
        chrome.sockets.tcp.onReceive.addListener(this._connection._readFn);
        chrome.sockets.tcp.onReceiveError.addListener(this._connection._errorFn);

        this._authRequest().then(() => this._createConnection());
      });
    }
    // set auth methods.
    _authRequest() {
      if (!this._request.auth) {
        return Promise.resolve();
      }
      let auth = this._request.auth;
      let obj = null;
      switch (auth.method) {
        case 'ntlm':
          obj = new FetchNtlmAuth(auth);
          obj.url = this.request.url;
          obj.state = 0;
          break;
        case 'basic':
          obj = new FetchBasicAuth(auth);
          break;
        case 'digest':
          obj = new FetchDigestAuth(auth);
          obj.url = this.request.url;
          obj.httpMethod = this.request.method;
          break;
      }
      if (!obj) {
        return Promise.resolve();
      }
      this.auth = obj;
      return Promise.resolve();
    }

    /** Called after socket has been created and connection yet to be made. */
    _createConnection() {
      var socketProperties = {
        name: 'arc'
      };
      if (this._connection.socketId) {
        this.log('Reusing last socket and connection: ');
        this._onConnected();
        return;
      }
      chrome.sockets.tcp.create(socketProperties, (createInfo) => {
        this.log('Created socket', createInfo.socketId);
        this._connection.socketId = createInfo.socketId;
        this.log('Connecting to %s:%d', this._connection.host, this._connection.port);
        this._connection.stats.startTime = Date.now();
        let promise;
        if (this._connection.useSSL) {
          promise = this._connectSecure(createInfo.socketId, this._connection.host,
            this._connection.port);
        } else {
          promise = this._connect(createInfo.socketId, this._connection.host, this._connection.port);
        }
        promise.then(() => {
            this._runTimer();
            this.log('Connected to socked for host: ', this._connection.host, ' and port ',
              this._connection.port);
            this._readyState = 1;
            this._onConnected();
          })
          .catch((cause) => {
            if (this.redirects) {
              // There were a redirects so it has something to display.
              // Don't just throw an error, construct a response that is errored.
              this._publishResponse({
                includeRedirects: true,
                error: cause
              });
              return;
            }
            this._readyState = 0;
            this._mainPromise.reject(cause);
            this._cleanUp();
          });
      });
    }
    /**
     * Connect to a socket using secure connection.
     * Note that ths function will result with paused socket.
     * It must be unpaused after sending a data to remote host to receive a response.
     *
     * This method will throw an error when connection can't be made or was unable to secure the
     * conection.
     *
     * @param {Number} socketId ID of the socket that the instance is operating on.
     * @param {String} host A host name to connect to
     * @param {Number} port A port number to connect to.
     *
     * @return {Promise} Fulfilled promise when connection has been made. Rejected promise will
     * contain an Error object with description message.
     */
    _connectSecure(socketId, host, port) {
      return new Promise((resolve, reject) => {
        chrome.sockets.tcp.setPaused(socketId, true, () => {
          let connectionStart = performance.now();
          chrome.sockets.tcp.connect(socketId, host, port, (connectResult) => {
            this._connection.stats.connect = performance.now() - connectionStart;
            if (chrome.runtime.lastError) {
              this.log(chrome.runtime.lastError);
              reject(chrome.runtime.lastError);
              return;
            }
            if (connectResult !== 0) {
              reject('Connection to host ' + host + ' on port ' + port + ' unsuccessful');
              return;
            }
            let secureStart = performance.now();
            chrome.sockets.tcp.secure(socketId, (secureResult) => {
              if (chrome.runtime.lastError) {
                this.log(chrome.runtime.lastError);
                reject(chrome.runtime.lastError);
                return;
              }
              this._connection.stats.ssl = performance.now() - secureStart;
              if (secureResult !== 0) {
                reject('Unable to secure a connection to host ' + host + ' on port ' + port);
                return;
              }
              resolve();
            });
          });
        });
      });
    }
    /**
     * Connect to a socket. To use a secure connection call `_connectSecure` method.
     * Note that ths function will result with paused socket.
     * It must be unpaused after sending a data to remote host to receive a response.
     *
     * @param {Number} socketId ID of the socket that the instance is operating on.
     * @param {String} host A host name to connect to
     * @param {Number} port A port number to connect to.
     *
     * @return {Promise} Fulfilled promise when connection has been made. Rejected promise will
     * contain an Error object with description message.
     */
    _connect(socketId, host, port) {
      return new Promise((resolve, reject) => {
        chrome.sockets.tcp.setPaused(socketId, true, () => {
          let connectionStart = performance.now();
          chrome.sockets.tcp.connect(socketId, host, port, (connectResult) => {
            this._connection.stats.connect = performance.now() - connectionStart;
            if (chrome.runtime.lastError) {
              this.log(chrome.runtime.lastError);
              reject(chrome.runtime.lastError);
              return;
            }
            if (connectResult !== 0) {
              reject('Connection to host ' + host + ' on port ' + port + ' unsuccessful');
              return;
            }
            resolve();
          });
        });
      });
    }
    /**
     * Shortcut for dispatching a custom event on this.
     *
     * @param {String} name Name of the event
     * @param {?Object} details Optional detail object.
     * @param {?}
     */
    _dispatchCustomEvent(name, details, cancelable) {
      cancelable = cancelable || false;
      var opts = {
        bubbles: true,
        cancelable: cancelable
      };
      if (details) {
        opts.detail = details;
      }
      return this.dispatchEvent(new CustomEvent(name, opts));
    }
    /** Disconnect from the socket and release resources. */
    disconnect() {
      this.log('Disconnect');
      if (!this._connection.socketId) {
        return Promise.resolve();
      }
      return new Promise((resolve) => {
        chrome.sockets.tcp.disconnect(this._connection.socketId, () => {
          if (chrome.runtime.lastError) {
            this.log(chrome.runtime.lastError, 'warn');
          }
          this._readyState = 0;
          chrome.sockets.tcp.close(this._connection.socketId, () => {
            if (chrome.runtime.lastError) {
              this.log(chrome.runtime.lastError, 'warn');
            }
            this._connection.socketId = undefined;
            resolve();
          });
        });
      });
    }
    /** Set `debug: true` flag in init object to see debug messages */
    log(...entry) {
      if (this.debug) {
        console.log.apply(console, entry);
      }
      this._logs.push(entry);
    }
    /**
     * Calling abort function will immidietly result with Promise rejection.
     * It will close the connection and clean up the resources.
     */
    abort() {
      this.aborted = true;
      this._dispatchCustomEvent('abort');
      this.state = SocketFetch.DONE;
      this._mainPromise.reject(new Error('Request aborted'));
      this._cleanUp();
    }
    /**
     * Create a request object.
     */
    _createRequest(url, opts) {
      opts = opts || {};
      if (url instanceof Request ||
        url instanceof ArcRequest) {
        return new ArcRequest(url);
      }
      if (opts.headers) {
        opts.headers = new Headers(opts.headers);
      } else {
        opts.headers = new Headers();
      }
      var defaults = {
        'method': 'GET',
        'redirect': 'follow'
      };
      opts = Object.assign(defaults, opts);
      if (['GET', 'HEADER'].indexOf(opts.method.toUpperCase()) !== -1) {
        delete opts.body;
      }
      return new ArcRequest(url, opts);
    }
    /**
     * Create a response object.
     *
     * @param {Object} opts An options to construct a response object:
     *  - {Boolean} includeRedirects If true the response will have information about redirects.
     *  - {Error} error An error object when the response is errored.
     * @return {ArcResponse} A response object.
     */
    _createResponse(opts) {
      if (opts.error) {
        return Promise.resolve();
      }

      if (this.aborted) {
        return Promise.resolve();
      }

      var status = this._connection.status;
      if (status < 100 || status > 599) {
        return Promise.reject(new Error(`The response status "${status}" is not allowed.
        See HTTP spec for more details: https://tools.ietf.org/html/rfc2616#section-6.1.1`));
      } else if (status === undefined) {
        return Promise.reject(new Error(`The response status is empty.
        It means that the successful connection wasn't made. Check your request parameters.`));
      }

      var promise;
      if (this._connection.body) {
        promise = this.decompressData(this._connection.body);
      } else {
        promise = Promise.resolve(this._connection.body);
      }

      return promise.then((body) => {
        let stats = Object.assign({}, this._connection.stats);
        delete stats._firstReceived;
        delete stats._messageSending;
        delete stats._waitingStart;
        let options = {
          status: this._connection.status,
          statusText: this._connection.statusMessage,
          headers: this._connection.headers,
          stats: stats
        };
        if (opts.error) {
          options.error = opts.error;
        }
        if (opts.includeRedirects && this.redirects && this.redirects.size) {
          options.redirects = this.redirects;
        }
        if (this._connection.status === 401) {
          if (this.auth) {
            options.auth = this.auth;
          } else {
            let auth = (this._connection.headers && this._connection.headers.has &&
                this._connection.headers.has('www-authenticate')) ?
              this._connection.headers.get('www-authenticate') : undefined;
            let aObj = {
              'method': 'unknown'
            };
            if (auth) {
              auth = auth.toLowerCase();
              if (auth.indexOf('ntlm') !== -1) {
                aObj.method = 'ntlm';
              } else if (auth.indexOf('basic') !== -1) {
                aObj.method = 'basic';
              } else if (auth.indexOf('digest') !== -1) {
                aObj.method = 'digest';
              }
            }
            options.auth = aObj;
          }
        }
        const resp = new ArcResponse(body, options);
        this._response = resp;
        this._response.logs = this._logs;
        this._logs = [];
        return resp;
      });
    }
    /**
     * If timeout init option is set then when connection is established the
     * program will start counter after when it fire the connection will be aborted
     * (with abort flag and abort event) and `timeout` flag set to true.
     *
     * Note that timer function in JavaScript environment can't guarantee execution
     * after exactly set amount of time. Instead it will fire event in next empty slot
     * in event queue.
     *
     * Note that the timer run at the moment when connection was established.
     */
    _runTimer() {
      if (!this._timeout.timeout) {
        return;
      }
      this._cancelTimer();
      this._timeout.timeoutId = window.setTimeout(() => {
        if (this.state !== SocketFetch.DONE && !this._timeout.timedout) {
          this._timeout.timedout = true;
          this.abort();
        }
      }, this._timeout.timeout);
    }
    /**
     * Cancel any active timeout timer.
     */
    _cancelTimer() {
      if (!this._timeout.timeoutId) {
        return;
      }
      window.clearTimeout(this._timeout.timeoutId);
      this._timeout.timeoutId = undefined;
    }
    /** Called when the connection has been established. */
    _onConnected() {
      if (this.aborted) {
        return;
      }
      var isNtlm = false;
      if (this.auth && this.auth.method) {
        switch (this.auth.method) {
          case 'ntlm':
            isNtlm = true;
            break;
          case 'basic':
            this.setupBasicAuth();
            this.auth = undefined;
            break;
          case 'digest':
            let auth = this.auth.getAuthHeader();
            if (auth) {
              if (!this._request.headers) {
                this._request.headers = new Headers();
              }
              this._request.headers.set(
                'Authorization', auth
              );
            }
            break;
        }
      }
      var promise = isNtlm ? this.generateNtlmMessage() : this.generateMessage();
      promise.then((buffer) => {
        let message = this.arrayBufferToString(buffer);
        if (this.debug) {
          this.log('Generated message to send\n' + message);
        }
        this.log('Sending message.');
        this._connection.messageSent = message;
        this._connection.stats._messageSending = performance.now();
        chrome.sockets.tcp.send(this._connection.socketId, buffer, this.onSend.bind(this));
      });
    }
    /**
     * Generate a message for socket.
     */
    generateMessage() {
      if (this._request.body) {
        return this._createFileBuffer()
          .then(buffer => this._updatePayloadRequestMeta(buffer))
          .then(buffer => this._createMessageBuffer(buffer));
      } else {
        this._addContentLength(null);
        return this._createMessageBuffer();
      }
    }
    /**
     * Updates the request headers (content-type and content-length) when the
     * request contains payload.
     *
     * @param {ArrayBuffer} buffer Message buffer.
     * @return {[type]} [description]
     */
    _updatePayloadRequestMeta(buffer) {
      if (this._isMultipartRequest) {
        let boundary = this._getBoundary(buffer);
        if (boundary) {
          this._request.headers.set('content-type', 'multipart/form-data; boundary=' +
            boundary);
        }
      }
      return this._addContentLength(buffer);
    }
    /**
     * Different implementation of generating a message for the NTLM implementation.
     * NTLM is based on a challenge and response that must be made on the same
     * socket connection.
     */
    generateNtlmMessage() {
      if (this.auth.state === 0) {
        let orygHeaders = this._request.headers;
        let msg = this.auth.createMessage1(this._connection.host);
        this._request.headers = new Headers({
          'Authorization': 'NTLM ' + msg.toBase64()
        });
        return this._createMessageBuffer()
          .then((buffer) => {
            this._request.headers = orygHeaders;
            return buffer;
          });
      }
      if (this.auth.state === 1) {
        let msg = this.auth.createMessage3(this.auth.challenge, this._connection.host);
        this.auth.state = 2;
        this._request.headers.set('Authorization', 'NTLM ' + msg.toBase64());
        return this.generateMessage();
      }
      return Promise.reject('Unknown auth state...');
    }

    setupBasicAuth() {
      if (!this._request.headers) {
        this._request.headers = new Headers();
      }
      this._request.headers.set(
        'Authorization', this.auth.getHeader()
      );
    }

    /**
     * Adds the content-length header if required.
     * This function will do nothing if the request do not carry a payload or
     * when the content length header is already set.
     *
     * @param {ArrayBuffer} buffer Generated message buffer.
     */
    _addContentLength(buffer) {
      if (this._request.method === 'GET') {
        return buffer;
      }
      //HEAD must set content length header even if it's not carreing payload.
      let cl = (this._request.headers && this._request.headers.get &&
        this._request.headers.get('Content-Length'));
      if (!cl) {
        if (!this._request.headers) {
          this._request.headers = new Headers();
        }
        if (buffer) {
          this._request.headers.set('Content-Length', buffer.byteLength);
        } else {
          this._request.headers.set('Content-Length', 0);
        }
      }
      return buffer;
    }

    /**
     * Create a HTTP message to be send to the server.
     *
     * @return {Promise} Fullfiled promise with message ArrayBuffer.
     */
    _createMessageBuffer(fileBuffer) {
      var headers = [];
      var path = this._request.uri.pathname;
      var search = this._request.uri.search;
      var hash = this._request.uri.hash;
      if (search) {
        path += search;
      }
      if (hash && path !== '#') {
        path += hash;
      }
      headers.push(this._request.method + ' ' + path + ' HTTP/1.1');
      var port = this._connection.port;
      var hostValue = this._connection.host;
      var defaultPorts = [80, 443];
      if (defaultPorts.indexOf(port) === -1) {
        hostValue += ':' + port;
      }
      headers.push('HOST: ' + hostValue);
      if (this._request.headers) {
        this._request.headers.forEach((value, key) => {
          headers.push(key + ': ' + value);
        });
      }
      var buffer = this.stringToArrayBuffer(headers.join('\r\n'));
      var endBuffer = new Uint8Array([13, 10, 13, 10]).buffer;
      var result = this._concatArrayBuffers(buffer, endBuffer, fileBuffer);
      return Promise.resolve(result);
    }
    /**
     * Concatenates `ArrayBuffer`s into new Array buffer.
     * It can also be used to make a copy of an `ArrayBuffer`.
     * @param {...ArrayBuffer} buffers Buffers to concat.
     * @return {ArrayBuffer} Concatenated ArrayBuffer.
     */
    _concatArrayBuffers(...buffers) {
      buffers = buffers.filter(item => !!item);
      var size = buffers.reduce((accumulator, currentValue) => accumulator += currentValue.byteLength, 0);
      var tmp = new Uint8Array(size);
      var pointer = 0;
      buffers.forEach(buffer => {
        tmp.set(new Uint8Array(buffer), pointer);
        pointer += buffer.byteLength;
      });
      return tmp.buffer;
    }

    /**
     * Create an ArrayBuffer from the payload data.
     * In ARC the body can be only a String, File or FormData.
     */
    _createFileBuffer() {
      var body = this._request.body;
      this._isMultipartRequest = body instanceof FormData;
      if (typeof body === 'string') {
        body = this._normalizeString(body);
      }
      let request = new Request(this._request.url, {
        method: this._request.method,
        headers: this._request.headers,
        body: body
      });
      return request.arrayBuffer();
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
     * Read a generated by Chrome boundary.
     * It will return a non empty string when FormData was passed as an `body` parameter.
     */
    _getBoundary(buffer) {
      var bufferView = new Uint8Array(buffer);
      var startIndex = this.indexOfSubarray(bufferView, [45, 45]);
      var endIndex = this.indexOfSubarray(bufferView, [13, 10]);
      var boundary = bufferView.subarray(startIndex + 2, endIndex); // it starts with 2x '--'
      var str = '';
      for (var i = 0, len = boundary.length; i < len; ++i) {
        str += String.fromCharCode(boundary[i]);
      }
      return str;
    }
    /**
     * Called when the message has been send to the remote host.
     */
    onSend(sendInfo) {
      this._connection.stats._waitingStart = performance.now();
      this._connection.stats.send = this._connection.stats._waitingStart -
        this._connection.stats._messageSending;
      if (this.aborted) {
        return;
      }
      if (sendInfo.bytesSent < 0) {
        this.log('Error writing to socket. Bytes sent: ' + sendInfo.bytesSent);
        this._mainPromise.reject(new Error('Couldn\'t find host.'));
        this._cleanUp();
        return;
      }
      chrome.sockets.tcp.setPaused(this._connection.socketId, false);
      this.log('Written message. Bytes sent: ' + sendInfo.bytesSent);
      this._dispatchCustomEvent('sendheaders', {
        bytesWritten: sendInfo.bytesSent
      });
      this._dispatchCustomEvent('loadstart');
    }
    /**
     * Handler for socket read event.
     */
    readSocketData(readInfo) {
      if (readInfo.socketId !== this._connection.socketId) {
        return;
      }
      var now = performance.now();
      if (this.state === SocketFetch.STATUS) {
        this._connection.stats._firstReceived = now;
        this._connection.stats.wait = now - this._connection.stats._waitingStart;
        this._dispatchCustomEvent('firstbyte');
      } else {
        this._connection.stats.receive = now - this._connection.stats._firstReceived;
      }
      if (this.aborted) {
        return;
      }
      if (readInfo) {
        this.log('Has socket data');
        chrome.sockets.tcp.setPaused(this._connection.socketId, true);
        try {
          this._processSocketMessage(readInfo.data);
        } catch (e) {
          if (this.state === SocketFetch.STATUS ||
            this.state === SocketFetch.HEADERS) {
            // The response is totally wrong!
            this._errorRequest({
              'message': e.message || 'Unknown error occurred'
            });
            return;
          }
          console.error('Error occured reading part of the message', e);
        }
        chrome.sockets.tcp.setPaused(this._connection.socketId, false);
      }
    }
    /**
     * Handler for socker read error event.
     */
    readSocketError(info) {
      if (this.aborted) {
        return;
      }
      if (info.socketId !== this._connection.socketId) {
        return;
      }
      var code = Math.abs(info.resultCode);
      this.log('Exit code:', code);

      if (code === 100) {
        //connection has been closed by the remote server.
        this.onResponseReady();
        return;
      }
      var message = '[chrome socket error]: ' + this.getCodeMessage(code);
      this.log('readSocketError:', message, code);
      if (this.state !== SocketFetch.DONE && this._mainPromise.reject) {
        this._errorRequest({
          'message': message || 'Unknown error occurred'
        });
      }
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
      data = new Uint8Array(data);
      //this.log('has message', data);
      if (this.state === SocketFetch.DONE) {
        return;
      }
      if (this.state === SocketFetch.STATUS) {
        data = this._processStatus(data);
        if (data === null) {
          return;
        }
      }
      if (this.state === SocketFetch.HEADERS) {
        data = this._processHeaders(data);
        if (data === null) {
          return;
        }
      }
      if (this.state === SocketFetch.BODY) {
        this._processBody(data);
        return;
      }
      throw new Error('Unknown state: ' + this.state);
    }
    /**
     * Read status line from the response.
     * This function will set `status` and `statusMessage` fields
     * and then will set `state` to HEADERS.
     */
    _processStatus(data) {
      if (this.aborted) {
        return;
      }
      this.log('Processing status');
      var index = this.indexOfSubarray(data, [13, 10]);
      var padding = 2;
      if (index === -1) {
        index = this.indexOfSubarray(data, [10]);
        if (index === -1) {
          this._errorRequest({
            'message': 'Unknown server response.'
          });
        }
        padding = 1;
      }
      var statusArray = data.subarray(0, index);
      data = data.subarray(index + padding);
      var statusLine = this.arrayBufferToString(statusArray);
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
      this._connection.status = status;
      this._connection.statusMessage = msg;
      this.log('Received status', this._connection.status, this._connection.statusMessage);
      this.state = SocketFetch.HEADERS;
      return data;
    }
    /**
     * Read headers from the received data.
     */
    _processHeaders(data) {
      if (this.aborted) {
        return;
      }
      this.log('Processing headers');
      // Looking for end of headers section
      var index = this.indexOfSubarray(data, [13, 10, 13, 10]);
      var padding = 4;
      if (index === -1) {
        // It can also be 2x ASCII 10
        var _index = this.indexOfSubarray(data, [10, 10]);
        if (_index !== -1) {
          index = _index;
          padding = 2;
        }
      }
      // https://github.com/jarrodek/socket-fetch/issues/3
      var enterIndex = this.indexOfSubarray(data, [13, 10]);
      if (index === -1 && enterIndex !== 0) {
        // end in next chunk
        // this._connection.headers += this.arrayBufferToString(data);
        if (!this._connection.headers) {
          this._connection.headers = data;
        } else {
          let sum = new Int8Array(this._connection.headers.length + data.length);
          sum.set(this._connection.headers);
          sum.set(data, this._connection.headers.length);
          this._connection.headers = sum;
        }
        return null;
      }

      if (enterIndex !== 0) {
        let headersArray = data.subarray(0, index);
        if (!this._connection.headers) {
          this._connection.headers = headersArray;
        } else {
          let sum = new Int8Array(this._connection.headers.length + headersArray.length);
          sum.set(this._connection.headers);
          sum.set(headersArray, this._connection.headers.length);
          this._connection.headers = sum;
        }
        // this._connection.headers += this.arrayBufferToString(headersArray);
      }
      this._connection.headers = this.arrayBufferToString(this._connection.headers);
      this._parseHeaders();
      if (this.aborted) {
        return;
      }
      this.state = SocketFetch.BODY;
      var start = index === -1 ? 0 : index;
      var move = (enterIndex === 0) ? 2 : padding;
      data = data.subarray(start + move);

      return this._postHeaders(data);
    }
    // Check the response headers and end the request if nescesary.
    _postHeaders(data) {
      if (this._request.method === 'HEAD') {
        // there will be no payload anyway. (spec defined)
        window.setTimeout(() => {
          this.onResponseReady();
        }, 0);
        return null;
      }

      if (data.length === 0) {
        if (this._connection.headers && this._connection.headers.has &&
          this._connection.headers.has('Content-Length')) {
          // If the server do not close connection and clearly indicate that there are no
          // further data to receive the app can close the connection and prepare the response.
          let length = Number(this._connection.headers.get('Content-Length'));
          // NaN never equals NaN. This is faster.
          if (length === length && length === 0) {
            window.setTimeout(() => {
              this.onResponseReady();
            }, 0);
          }
        } else if (!this._connection.headers.has('Transfer-Encoding') ||
          !this._connection.headers.get('Transfer-Encoding')) {
          // Fix for https://github.com/jarrodek/socket-fetch/issues/6
          // There is no body in the response.
          window.setTimeout(() => {
            this.onResponseReady();
          }, 0);
        }
        return null;
      }
      return data;
    }

    /**
     * Process data.
     *
     * @param {Uint8Array} data A data to process
     */
    _processBody(data) {
      if (this.aborted) {
        return;
      }
      this.log('Processing body');
      if (this._connection.chunked) {
        while (true) {
          if (this._connection.chunkSize === 0 &&
            this.indexOfSubarray(data, [13, 10, 13, 10]) === 0) {
            this.onResponseReady();
            return;
          }
          if (!this._connection.chunkSize) {
            data = this.readChunkSize(data);
            this.log('Chunk size: ', this._connection.chunkSize);
            if (this._connection.chunkSize === null) {
              // It may happen that chrome's buffer cuts the data
              // just before the chunk size.
              // It should proceed it in next portion of the data.
              this.log('The chunk size was null!', 'warn');
              return;
            }
            if (!this._connection.chunkSize) {
              this.onResponseReady();
              return;
            }
          }
          let size = Math.min(this._connection.chunkSize, data.length);
          this.log('Part size: ', size);
          if (!this._connection.body) {
            this.log('Creating new body');
            this._connection.body = new Uint8Array(data.subarray(0, size));
          } else {
            this.log('Appending to the body');
            let bodySize = size + this._connection.body.length;
            let body = new Uint8Array(bodySize);
            body.set(this._connection.body);
            body.set(data.subarray(0, size), this._connection.body.length);
            this._connection.body = body;
          }
          this._connection.chunkSize -= size;
          this.log('Body size is: ', this._connection.body.length, ' and chunk size is left is: ',
            this._connection.chunkSize);
          // debugger;
          if (data.length === 0) {
            this.log('Next chunk will start with CRLF!', 'warn');
          }
          data = data.subarray(size + 2); // + CR
          if (data.length === 0) {
            this.log('No more data here. Waiting for new chunk');
            return;
          }
        }
      } else {
        if (!this._connection.body) {
          this.log('Creating new body');
          this._connection.body = new Uint8Array(data.length);
          this._connection.body.set(data);
          if (this._connection.body.length >= this._connection.contentLength) {
            this.log('Response ready. Calling it.');
            this.onResponseReady();
          }
        } else {
          let len = this._connection.body.length;
          let sumLength = len + data.length;
          let newArray = new Uint8Array(sumLength);
          newArray.set(this._connection.body);
          newArray.set(data, len);
          this._connection.body = newArray;
          this.log('Appended data to body.');
          if (newArray.length >= this._connection.contentLength) {
            this.log('Response ready. Calling it.');
            this.onResponseReady();
          }
        }
      }
    }
    /**
     * This method is called when the response is ready to serve.
     * It the response contain an information about the redirection
     * it will connect again to redirect URL if initial option `redirect` is set to `follow`
     * (default) or it with throw an error if it is set to `error`.
     */
    onResponseReady() {
      if (this.aborted) {
        return;
      }
      if (this.state === SocketFetch.DONE) {
        return;
      }
      this._connection.stats._lastReceived = performance.now();
      this._connection.stats.receive = this._connection.stats._lastReceived -
        this._connection.stats._firstReceived;
      this.state = SocketFetch.DONE;

      var status = this._connection.status;
      if (status >= 300 && status < 400) { //redirect

        if (this.redirect === 'error') {
          this._mainPromise.reject({
            'message': 'Redirects are not allowed',
            'redirect': true
          });
          this._cleanUp();
          return;
        }

        // See https://github.com/jarrodek/socket-fetch/issues/13
        let redirect = false;
        let redirectOptions = {};

        switch (status) {
          case 300:
          case 304:
          case 305:
            // do nothing;
            break;
          case 301:
          case 302:
          case 307:
            if (['GET', 'HEAD'].indexOf(this._request.method) !== -1) {
              redirect = true;
            }
            break;
          case 303:
            redirect = true;
            redirectOptions.forceGet = true;
            break;
        }

        if (redirect) {
          // Redirect only when you know where to redirect the request.
          if (this._connection.headers && this._connection.headers.has &&
            this._connection.headers.has('Location')) {
            redirectOptions.location = this._connection.headers.get('Location');
            this._redirectRequest(redirectOptions);
            return;
          }
        }

      } else if (status === 401 && this.auth) {
        switch (this.auth.method) {
          case 'ntlm':
            this.handleNtlmResponse();
            return;
        }
      } else if (status === 401) {
        if (this._connection.headers && this._connection.headers.has &&
          this._connection.headers.has('www-authenticate')) {
          let authHeader = this._connection.headers.get('www-authenticate');
          if (authHeader.toLowerCase().indexOf('digest') !== -1) {
            this.handleDigestResponse(authHeader);
          }
        }
      }

      this._cancelTimer();
      this._dispatchCustomEvent('loadend');
      this._publishResponse({
        includeRedirects: true
      });
    }

    handleNtlmResponse() {
      if (this.auth.state === 0) {
        if (this._connection.headers && this._connection.headers.has &&
          this._connection.headers.has('www-authenticate')) {
          try {
            this.auth.challenge =
              this.auth.getChallenge(this._connection.headers.get('www-authenticate'));
            this.auth.state = 1;
            this._cancelTimer();
            this._cleanUpRedirect({
                keepConnection: true
              })
              .then(() => {
                this._setupUrlData();
                this._createConnection();
              })
              .catch((e) => {
                this._errorRequest({
                  'message': e && e.message || 'Unknown error occurred'
                });
              });
          } catch (e) {
            this.auth = undefined;
            this._errorRequest({
              'message': e && e.message || 'Unknown error occurred in NTLM auth.'
            });
          }
        } else {
          this.auth = {};
          this.auth.method = 'ntlm';
          this._cancelTimer();
          this._dispatchCustomEvent('loadend');
          this._publishResponse({
            includeRedirects: true
          });
        }
      } else {
        this.auth = {};
        this.auth.method = 'ntlm';
        this._cancelTimer();
        this._dispatchCustomEvent('loadend');
        this._publishResponse({
          includeRedirects: true
        });
      }
    }

    handleDigestResponse(digestHeaders) {
      digestHeaders = digestHeaders.slice(digestHeaders.indexOf(':') + 1, -1);
      digestHeaders = digestHeaders.split(',');
      this.auth = new FetchDigestAuth({});
      this.auth.httpMethod = this.request.method;
      this.auth.scheme = digestHeaders[0].split(/\s/)[1];
      for (var i = 0; i < digestHeaders.length; i++) {
        let equalIndex = digestHeaders[i].indexOf('=');
        let key = digestHeaders[i].substring(0, equalIndex);
        let val = digestHeaders[i].substring(equalIndex + 1);
        val = val.replace(/['"]+/g, '');
        // find realm
        if (key.match(/realm/i) !== null) {
          this.auth.realm = val;
        }
        // find nonce
        if (key.match(/nonce/i) !== null) {
          this.auth.nonce = val;
        }
        // find opaque
        if (key.match(/opaque/i) !== null) {
          this.auth.opaque = val;
        }
        // find QOP
        if (key.match(/qop/i) !== null) {
          this.auth.qop = val;
        }
      }
      // client generated keys
      this.auth.generateCnonce();
      if (!this.auth.nc) {
        this.auth.nc = 1;
      }
      this.auth.nc++;
    }

    /**
     * Generate response object and publish it to the listeners.
     *
     * @param {Object} opts See #_createResponse for more info.
     */
    _publishResponse(opts) {
      this._request.messageSent = this._connection.messageSent;
      delete this._request._uri;
      this._createResponse(opts)
      .then(() => {
        this._dispatchCustomEvent('load', {
          response: this._response,
          request: this._request
        });
        this._mainPromise.resolve(this._response);
        this._cleanUp();
      })
      .catch((e) => {
        this._errorRequest({
          'message': e && e.message || 'Unknown error occurred'
        });
      });
    }
    // Finishes the response with error message.
    _errorRequest(opts) {
      this.aborted = true;
      this.state = SocketFetch.DONE;
      var message;
      if (opts.code && !opts.message) {
        message = this.getCodeMessage(opts.code);
      } else if (opts.message) {
        message = opts.message;
      }
      message = message || 'Unknown error occurred';
      let error = new Error(message);
      if (this._mainPromise.reject) {
        this._mainPromise.reject(error);
      }
      this._dispatchCustomEvent('error', {
        error: error
      });
      this._cancelTimer();
      this._cleanUp();
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
        let origin = this._request.uri.origin;
        if (origin[origin.length - 1] === '/') {
          origin = origin.substr(0, origin.length - 1);
        }
        if (location[0] !== '/') {
          location = origin + this._request.uri.pathname + location;
        } else {
          location = origin + location;
        }
      }

      // check if this is infinite loop
      if (this.redirects) {
        let loop = false;
        this.redirects.forEach((item) => {
          if (item.requestUrl === location) {
            loop = true;
          }
        });
        if (loop) {
          this._errorRequest({
            code: 310
          });
          return;
        }
      }
      // this is a redirect;
      var canceled = this._dispatchCustomEvent('beforeredirect', {
        location: location
      }, true);
      if (canceled) {
        this.abort();
        return;
      }
      if (!this.redirects) {
        this.redirects = new Set();
      }
      var responseCookies = null;
      if (this._connection.headers && this._connection.headers.has &&
        this._connection.headers.has('set-cookie')) {
        responseCookies = this._connection.headers.get('set-cookie');
      }
      this._createResponse({
        includeRedirects: false
      })
      .then(() => {
        this._cancelTimer();
        this._response.requestUrl = this._request.url;
        this._response.messageSent = this._connection.messageSent;
        this.redirects.add(this._response);
        return this._cleanUpRedirect({
          keepConnection: false
        });
      })
      .then(() => {
        if (!responseCookies) {
          return;
        }
        var newParser = new Cookies(responseCookies, location);
        newParser.filter();
        let expired = newParser.clearExpired();
        if (this._request.headers.has('Cookie')) {
          var oldCookies = this._request.headers.get('Cookie');
          var oldParser = new Cookies(oldCookies, location);
          oldParser.filter();
          oldParser.clearExpired();
          oldParser.merge(newParser);
          newParser = oldParser;
          // remove expired from the new response.
          newParser.cookies = newParser.cookies.filter((c) => {
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
          this._request.headers.set('Cookie', str);
        } else {
          this._request.headers.delete('Cookie');
        }
      })
      .then(() => {
        this._request.url = location;
        if (options.forceGet) {
          this._request.method = 'GET';
        }
        this._setupUrlData();
        // No idea why but without setTimeout the program loses it's scope after calling
        // the function.
        window.setTimeout(() => {
          this._createConnection();
        }, 0);
      })
      .catch((e) => {
        this._errorRequest({
          'message': e && e.message || 'Unknown error occurred'
        });
      });
    }

    /**
     * After the connection is closed an result returned this method will release resources.
     */
    _cleanUp() {
      this._cleanUpRedirect({
        keepConnection: false
      });
      this._mainPromise.reject = undefined;
      this._mainPromise.resolve = undefined;
      chrome.sockets.tcp.onReceive.removeListener(this._connection._readFn);
      chrome.sockets.tcp.onReceiveError.removeListener(this._connection._errorFn);
      this._connection._readFn = undefined;
      this._connection._errorFn = undefined;
      this.redirects = undefined;
      this._logs = [];
      this._cancelTimer();
    }
    /** Clean up for redirect */
    _cleanUpRedirect(opts) {
      var promise;
      if (opts.keepConnection) {
        promise = Promise.resolve();
      } else {
        promise = this.disconnect();
      }
      return promise.then(() => {
        this._connection.body = undefined;
        this._connection.headers = undefined;
        this._connection.chunkSize = undefined;
        this._connection.chunked = undefined;
        this._connection.contentLength = undefined;
        this._connection.statusMessage = undefined;
        this._connection.status = undefined;
        this.state = SocketFetch.STATUS;
        this._connection.host = undefined;
        this._connection.port = undefined;
        this._response = undefined;
        this._connection.messageSent = undefined;
        this._connection.stats.startTime = undefined;
        this._connection.stats.connect = undefined;
        this._connection.stats.send = undefined;
        this._connection.stats.wait = undefined;
        this._connection.stats.receive = undefined;
        this._connection.stats.ssl = undefined;
        this._connection.stats._firstReceived = undefined;
        this._connection.stats._messageSending = undefined;
        this._connection.stats._waitingStart = undefined;
        this._connection.stats._lastReceived = undefined;
      });
    }
    /**
     * If response's Transfer-Encoding is 'chunked' read until next CR. Everything before it is a
     * chunk size.
     * This method will set {@link #chunkSize} to read value.
     *
     * @param {Uint8Array} array
     * @returns {Uint8Array} Truncated response without chunk size line
     */
    readChunkSize(array) {
      if (this.aborted) {
        return;
      }
      // this.log('Attemping to read chunk size from the array. ', array.length, array);
      var index = this.indexOfSubarray(array, [13, 10]);
      if (index === -1) {
        //not found in this portion of data.
        return array;
      }
      if (index === 0) {
        // Chrome's buffer cut CRLF after the end of chunk data, without last CLCR, here's to fix it.
        // debugger;
        // It can be either new line from the last chunk or end of the message where
        // the rest of the array is [13, 10, 48, 13, 10, 13, 10]
        if (this.indexOfSubarray(array, [13, 10, 13, 10]) === 0) {
          this._connection.chunkSize = 0;
          return new Uint8Array();
        } else {
          array = array.subarray(index + 2);
          index = this.indexOfSubarray(array, [13, 10]);
        }
      }
      // this.log('Size index: ', index);
      var sizeArray = array.subarray(0, index);
      var sizeHex = this.arrayBufferToString(sizeArray);
      if (!sizeHex || sizeHex === '') {
        this._connection.chunkSize = null;
        return array.subarray(index + 2);
      }
      this._connection.chunkSize = parseInt(sizeHex, 16);
      return array.subarray(index + 2);
    }
    /**
     * This function assumes that all the headers has been read and it's just before changing
     * the ststaus to BODY.
     */
    _parseHeaders() {
      if (this.aborted) {
        return;
      }
      var list = this.headersToObject(this._connection.headers);
      this.log('Received headers list', this._connection.headers, list);
      this._connection.headers = new Headers(list);
      if (this._connection.headers.has('Content-Length')) {
        this._connection.contentLength = this._connection.headers.get('Content-Length');
      }
      if (this._connection.headers.has('Transfer-Encoding')) {
        let tr = this._connection.headers.get('Transfer-Encoding');
        if (tr === 'chunked') {
          this._connection.chunked = true;
        }
      }
      var canceled = this._dispatchCustomEvent('headersreceived', {
        value: this._connection.headers
      }, true);
      if (canceled) {
        this.abort();
        return;
      }
    }
    /**
     * After the message is received check if the response has been compressed.
     * If so, decompress the data.
     *
     * @param {Uint8Array} data Received data
     * @return {Uint8Array} Decompressed data.
     */
    decompressData(data) {
      if (this.aborted) {
        return Promise.resolve(data);
      }
      if (!this._connection.headers || !this._connection.headers.has ||
        !this._connection.headers.has('Content-Encoding')) {
        return Promise.resolve(data);
      }
      var ce = this._connection.headers.get('Content-Encoding');
      if (ce.indexOf('gzip') !== -1 || ce.indexOf('deflate') !== -1) {
        return new Promise((resolve, reject) => {
          let workerUrl = 'decompress-worker.js';
          if (SocketFetchOptions.importUrl) {
            workerUrl = SocketFetchOptions.importUrl.replace('%s', workerUrl);
          } else if (location.pathname === '/components/tasks/demo/index.html') {
            // demo, test
            workerUrl = '../decompress-worker.js';
          }

          let worker = new Worker(workerUrl);
          worker.onmessage = (e) => {
            resolve(e.data);
          };
          worker.onerror = (e) => {
            var data = e.data;
            if (!data) {
              data = new Error('Data decompression worker not found.');
            }
            reject(e.data);
          };
          worker.postMessage({
            'buffer': this._connection.body,
            'compression': ce
          });
        });
      }
      return data;
    }
    /**
     * Parse headers string and receive an object.
     *
     * @param {String} headersString A headers string as defined in the spec
     * @return {Object} And object of key-value pairs where key is a
     */
    headersToObject(headersString) {
      if (this.aborted) {
        return [];
      }
      if (headersString === null || headersString.trim() === '') {
        return [];
      }
      if (typeof headersString !== 'string') {
        throw new Error('Headers must be a String.');
      }
      const result = {};
      const headers = headersString.split(/\n/gim);

      for (let i = 0, len = headers.length; i < len; i++) {
        let line = headers[i].trim();
        if (line === '') {
          continue;
        }
        let sepPosition = line.indexOf(':');
        if (sepPosition === -1) {
          result[line] = '';
          continue;
        }
        let name = line.substr(0, sepPosition);
        let value = line.substr(sepPosition + 1).trim();
        if (name in result) {
          result[name] += '; ' + value;
        } else {
          result[name] = value;
        }
      }
      return result;
    }
    /**
     * @return Returns an index of first occurance of subArray sequence in inputArray or -1 if not
     * found.
     */
    indexOfSubarray(inputArray, subArray) {
      if (this.aborted) {
        return -1;
      }
      var result = -1;
      var len = inputArray.length;
      var subLen = subArray.length;
      for (let i = 0; i < len; ++i) {
        if (result !== -1) {
          return result;
        }
        if (inputArray[i] !== subArray[0]) {
          continue;
        }
        result = i;
        for (let j = 1; j < subLen; j++) {
          if (inputArray[i + j] === subArray[j]) {
            result = i;
          } else {
            result = -1;
            break;
          }
        }
      }
      return result;
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
      if (!!buff.buffer) {
        // Not a ArrayBuffer, need and instance of AB
        // It can't just get buff.buffer because it will use original buffer if the buff is a slice
        // of it.
        let b = buff.slice(0);
        buff = b.buffer;
      }
      var decoder = new TextDecoder('utf-8');
      var view = new DataView(buff);
      return decoder.decode(view);
    }
    /**
     * Convert a string to an ArrayBuffer.
     * @param {string} string The string to convert.
     * @return {ArrayBuffer} An array buffer whose bytes correspond to the string.
     * @returns {ArrayBuffer}
     */
    stringToArrayBuffer(string) {
      if (this.aborted) {
        return new ArrayBuffer();
      }
      var encoder = new TextEncoder();
      var encoded = encoder.encode(string);
      return encoded.buffer;
    }
    /**
     * Set up URL data relevant during making a connection.
     */
    _setupUrlData() {
      var port = this._request.uri.port;
      var protocol = this._request.uri.protocol;
      if (protocol) {
        protocol = protocol.replace(':', '');
      }
      if (!port) {
        if (protocol in this.protocol2port) {
          port = this.protocol2port[protocol];
        } else {
          port = 80;
        }
        this._request.uri.port = port;
      }
      this._connection.port = Number(port);
      this._connection.host = this._request.uri.hostname;
      if (protocol === 'https' || this._connection.port === 443) {
        this._connection.useSSL = true;
      } else {
        this._connection.useSSL = false;
      }

      // Check if URL contains username and password for basic auth.
      var uid = this._request.uri.username;
      var passwd = this._request.uri.password;
      if (uid && passwd) {
        let auth = {
          'uid': uid,
          'passwd': passwd,
          'method': 'basic'
        };
        this.auth = new FetchBasicAuth(auth);
      }
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
  window.SocketFetch = SocketFetch;
  window.SocketFetchOptions = SocketFetchOptions;
})();
