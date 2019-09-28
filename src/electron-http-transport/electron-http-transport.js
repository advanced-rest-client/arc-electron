/**
 * `electron-http-transport`
 *
 * A web comonent to work with @advanced-rest-client/electron-request
 * node package in web components environment
 *
 * @customElement
 * @memberof LogicElements
 */
class ElectronHttpTransport extends HTMLElement {
  /* global SocketRequest, ElectronRequest */
  get requestTimeout() {
    const rt = this.getAttribute('requesttimeout');
    if (!rt || isNaN(rt)) {
      return null;
    }
    return Number(rt);
  }

  set requestTimeout(value) {
    if (!value) {
      this.removeAttribute('requesttimeout');
    } else {
      this.setAttribute('requesttimeout', value);
    }
  }

  get nativeTransport() {
    return this.hasAttribute('nativetransport');
  }

  set nativeTransport(value) {
    if (!value) {
      this.removeAttribute('native-transport');
    } else {
      this.setAttribute('native-transport', '');
    }
  }

  get validateCertificates() {
    return this.hasAttribute('validatecertificates');
  }
  /**
   * When set it validates certificates during request.
   * @param {Boolean} value
   */
  set validateCertificates(value) {
    if (!value) {
      this.removeAttribute('validatecertificates');
    } else {
      this.setAttribute('validatecertificates', '');
    }
  }
  /**
   * When not set the request object won't follow redirects.
   * @param {Boolean} value
   */
  set followRedirects(value) {
    if (!value) {
      this.removeAttribute('followredirects');
    } else {
      this.setAttribute('followredirects', '');
    }
  }

  get followRedirects() {
    return this.hasAttribute('followredirects');
  }
  /**
   * When set the HTTP client adds default headers, like cURL does
   * @param {Boolean} value
   */
  set defaultHeaders(value) {
    if (!value) {
      this.removeAttribute('defaultheaders');
    } else {
      this.setAttribute('defaultheaders', '');
    }
  }

  get defaultHeaders() {
    return this.hasAttribute('defaultheaders');
  }
  /**
   * A limit of characters to include into the `sentHttpMessage` property
   * of the request object. 0 to disable limit. Default to 2048.
   * @param {Number} value
   */
  set sentMessageLimit(value) {
    if (!value) {
      this.removeAttribute('sentmessagelimit');
    } else {
      this.setAttribute('sentmessagelimit', value);
    }
  }

  get sentMessageLimit() {
    const v = this.getAttribute('sentmessagelimit');
    if (!v || isNaN(v)) {
      return undefined;
    }
    return Number(v);
  }

  constructor() {
    super();
    // Socket handlers
    this._loadStartHandler = this._loadStartHandler.bind(this);
    this._firstByteHandler = this._firstByteHandler.bind(this);
    this._loadEndHandler = this._loadEndHandler.bind(this);
    this._beforeRedirectHandler = this._beforeRedirectHandler.bind(this);
    this._headersReceivedHandler = this._headersReceivedHandler.bind(this);
    this._loadHandler = this._loadHandler.bind(this);
    this._errorHandler = this._errorHandler.bind(this);
    // Host data handlers
    this._ruleUpdated = this._ruleUpdated.bind(this);
    this._ruleDeleted = this._ruleDeleted.bind(this);
    // Transport control
    this._onTransportRequested = this._onTransportRequested.bind(this);
    this._abortHandler = this._abortHandler.bind(this);
    // Local properties
    this._connections = {};
  }

  connectedCallback() {
    document.body.addEventListener('transport-request', this._onTransportRequested);
    document.body.addEventListener('abort-api-request', this._abortHandler);
    window.addEventListener('host-rules-changed', this._ruleUpdated);
    window.addEventListener('host-rules-deleted', this._ruleDeleted);
  }

  disconnectedCallback() {
    document.body.removeEventListener('transport-request', this._onTransportRequested);
    document.body.removeEventListener('abort-api-request', this._abortHandler);
    window.addEventListener('host-rules-changed', this._ruleUpdated);
    window.addEventListener('host-rules-deleted', this._ruleDeleted);
  }

  _abortHandler(e) {
    const id = e.detail.id;
    const info = this._connections[id];
    if (!info) {
      return;
    }
    e.preventDefault();
    info.connection.abort();
    info.aborted = true;
  }

  _onTransportRequested(e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    this.run(e.detail);
  }
  /**
   * Runs the request with Electron's `SocketRequest` class.
   * @param {Object} request ARC request object
   * @param {?Object} opts Additional request options:
   * - timeout {Number} - Timeout in milliseconds
   * - followRedirects {Boolean} Note, as of ARC 13 this object is part of
   * the request object under `config` property.
   * @return {Promise} A promise when the request is started with the socket
   * library
   */
  async run(request, opts) {
    opts = opts ? Object.assign({}, opts) : {};
    request = Object.assign({}, request);
    if (request.config) {
      request.config = Object.assign({}, request.config);
    }
    opts = this._prepareRequestOptions(request, opts);
    try {
      const hosts = await this._readHosts();
      /* eslint-disable-next-line require-atomic-updates */
      opts.hosts = hosts;
      const connection = await this._prepareRequest(request, opts);
      return await this._makeConnection(connection);
    } catch (cause) {
      this._errorHandler(cause, request.id);
    }
  }

  _prepareRequestOptions(request, opts) {
    let rConfig;
    if (request.config && request.config.enabled !== false) {
      rConfig = Object.assign(request.config);
      delete rConfig.enabled;
    } else {
      rConfig = {};
    }
    opts = Object.assign({}, opts || {});
    opts = Object.assign(rConfig, opts);
    if (typeof opts.timeout === 'undefined') {
      const time = this.requestTimeout;
      if (time) {
        opts.timeout = time;
      }
    }
    if (opts.timeout) {
      opts.timeout = Number(opts.timeout) * 1000;
    } else {
      opts.timeout = 0;
    }
    if (!opts.validateCertificates) {
      opts.validateCertificates = this.validateCertificates;
    }
    if (typeof opts.followRedirects === 'undefined') {
      opts.followRedirects = this.followRedirects;
    }
    if (typeof opts.defaultHeaders === 'undefined') {
      opts.defaultHeaders = this.defaultHeaders;
    }
    if (typeof opts.sentMessageLimit === 'undefined') {
      opts.sentMessageLimit = this.sentMessageLimit;
    }
    if (opts.sentMessageLimit) {
      opts.sentMessageLimit = Number(opts.sentMessageLimit);
    }
    return opts;
  }
  /**
   * Reads application hosts configuration and returns it.
   * It returns empty array of hosts couldn't be read.
   * @return {Promise<Array>}
   */
  async _readHosts() {
    if (this.hosts !== undefined) {
      return this.hosts;
    }
    const e = new CustomEvent('host-rules-list', {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: {}
    });
    this.dispatchEvent(e);
    if (!e.defaultPrevented) {
      this.hosts = [];
      return this.hosts;
    }
    const rules = await e.detail.result;
    this.hosts = rules || [];
    return rules;
  }

  _isNative(opts) {
    if (opts && typeof opts.nativeTransport === 'boolean') {
      return opts.nativeTransport;
    }
    return this.nativeTransport;
  }

  _prepareRequest(request, opts) {
    return this._isNative(opts) ?
      this._prepareNativeRequest(request, opts) :
      this._prepareArcRequest(request, opts);
  }

  _prepareArcRequest(request, opts) {
    let conn;
    // In ARC electron the browser window is created without node integration
    // and therefore require is disabled. In tests node is enabled.
    if (typeof SocketRequest === 'undefined') {
      const { SocketRequest } = require('@advanced-rest-client/electron-request');
      conn = new SocketRequest(request, opts);
    } else {
      conn = new SocketRequest(request, opts);
    }
    this._connections[request.id] = {
      connection: conn,
      aborted: false
    };
    conn.on('loadstart', this._loadStartHandler);
    conn.on('firstbyte', this._firstByteHandler);
    conn.on('loadend', this._loadEndHandler);
    conn.on('beforeredirect', this._beforeRedirectHandler);
    conn.on('headersreceived', this._headersReceivedHandler);
    conn.on('load', this._loadHandler);
    conn.on('error', this._errorHandler);
    return conn;
  }

  _prepareNativeRequest(request, opts) {
    let conn;
    // In ARC electron the browser window is created without node integration
    // and therefore require is disabled. In tests node is enabled.
    if (typeof ElectronRequest === 'undefined') {
      const { ElectronRequest } = require('@advanced-rest-client/electron-request');
      conn = new ElectronRequest(request, opts);
    } else {
      conn = new ElectronRequest(request, opts);
    }
    this._connections[request.id] = {
      connection: conn,
      aborted: false
    };
    conn.on('loadstart', this._loadStartHandler);
    conn.on('firstbyte', this._firstByteHandler);
    conn.on('loadend', this._loadEndHandler);
    conn.on('beforeredirect', this._beforeRedirectHandler);
    conn.on('headersreceived', this._headersReceivedHandler);
    conn.on('load', this._loadHandler);
    conn.on('error', this._errorHandler);
    return conn;
  }

  async _makeConnection(connection) {
    try {
      return await connection.send();
    } catch (cause) {
      this._errorHandler(cause, connection.id);
    }
  }

  _removeConnectionHandlers(connection) {
    connection.removeListener('loadstart', this._loadStartHandler);
    connection.removeListener('firstbyte', this._firstByteHandler);
    connection.removeListener('loadend', this._loadEndHandler);
    connection.removeListener('beforeredirect', this._beforeRedirectHandler);
    connection.removeListener('headersreceived', this._headersReceivedHandler);
    connection.removeListener('load', this._loadHandler);
    connection.removeListener('error', this._errorHandler);
  }

  _informStatus(type, id) {
    const info = this._connections[id];
    if (!info || info.aborted) {
      return;
    }
    this.dispatchEvent(new CustomEvent(type, {
      composed: true,
      bubbles: true,
      detail: {
        id
      }
    }));
  }

  _loadStartHandler(id) {
    this._informStatus('request-load-start', id);
  }

  _firstByteHandler(id) {
    this._informStatus('request-first-byte-received', id);
  }

  _loadEndHandler(id) {
    this._informStatus('request-load-end', id);
  }

  _beforeRedirectHandler(id, detail) {
    const info = this._connections[id];
    if (!info || info.aborted) {
      return;
    }
    const e = new CustomEvent('before-redirect', {
      composed: true,
      bubbles: true,
      cancelable: true,
      detail: {
        id,
        url: detail.location
      }
    });
    this.dispatchEvent(e);
    if (e.defaultPrevented) {
      detail.returnValue = false;
    }
  }

  _headersReceivedHandler(id, detail) {
    const info = this._connections[id];
    if (!info || info.aborted) {
      return;
    }
    const e = new CustomEvent('headers-received', {
      composed: true,
      bubbles: true,
      cancelable: true,
      detail: {
        id,
        value: detail.value
      }
    });
    this.dispatchEvent(e);
    if (e.defaultPrevented) {
      detail.returnValue = false;
    }
  }

  _loadHandler(id, response, request) {
    const info = this._connections[id];
    if (!info || info.aborted) {
      return;
    }
    this._removeConnectionHandlers(info.connection);
    delete this._connections[id];
    this._processResponse(id, response, request);
  }

  _errorHandler(cause, id, request, response) {
    const info = this._connections[id];
    if (info) {
      this._removeConnectionHandlers(info.connection);
      delete this._connections[id];
    }
    if (info && info.aborted) {
      return;
    }
    if (!response) {
      response = {};
    }
    const data = Object.assign({}, response, {
      isError: true,
      error: cause
    });
    this._processResponse(id, data, request);
  }
  /**
   * Processes response data and creates ARC response object.
   * @param {String} id Request ID
   * @param {Object} data Response data
   * @param {Object} requestInfo Request data
   */
  _processResponse(id, data, requestInfo) {
    const detail = {
      isXhr: false,
      request: requestInfo
    };
    const redirects = this._processRedirects(data.redirects);
    if (redirects.timings.length) {
      detail.redirectsTiming = redirects.timings;
      detail.redirects = redirects.redirects;
    }
    if (data.error && typeof data.error !== 'function') {
      detail.isError = true;
      detail.error = data.error;
    } else {
      const stats = this._cleanTimings(data.stats);
      detail.isError = false;
      detail.response = data;
      detail.sentHttpMessage = data.sentHttpMessage;
      detail.loadingTime = this._computeLoadingTime(stats);
      detail.timing = stats;
      detail.auth = data.auth;
      delete detail.response.sentHttpMessage;
      delete detail.request.sentHttpMessage;
    }
    detail.id = id;
    this._beforeResponse(detail);
  }
  /**
   * Processes redirects data from the socket library.
   * @param {Set} set A set of redirects
   * @return {Object} Map of arrays of timings and redirects information.
   */
  _processRedirects(set) {
    const result = {
      timings: [],
      redirects: []
    };
    if (!set) {
      return result;
    }
    set.forEach((item) => {
      result.redirects.push(item);
      result.timings.push(item.stats);
      delete item.stats;
    });
    return result;
  }
  /**
   * Computes a request / response loading time from the stats object
   * @param {Objject} stats A stats property of the socket client response.
   * @return {Number} A time to full response in miliseconds. 0 if stats unavailable.
   */
  _computeLoadingTime(stats) {
    if (!stats) {
      return 0;
    }
    let value = 0;
    if (stats.dns && stats.dns > 0) {
      value += stats.dns;
    }
    if (stats.connect && stats.connect > 0) {
      value += stats.connect;
    }
    if (stats.receive && stats.receive > 0) {
      value += stats.receive;
    }
    if (stats.send && stats.send > 0) {
      value += stats.send;
    }
    if (stats.ssl && stats.ssl > 0) {
      value += stats.ssl;
    }
    if (stats.wait && stats.wait > 0) {
      value += stats.wait;
    }
    return value;
  }
  /**
   * Creates HAR 1.2 object from timing data
   * @param {Object} stats
   * @return {Object}
   */
  _cleanTimings(stats) {
    const result = {
      dns: stats.dns || -1,
      connect: stats.connect || -1,
      receive: stats.receive || -1,
      send: stats.send || -1,
      ssl: stats.ssl || -1,
      wait: stats.wait || -1
    };
    return result;
  }
  /**
   * Dispatches `response-ready` event with request data.
   * If the event is not caneled then it dispatches `report-response`
   * event.
   *
   * @param {Object} detail The request detail
   */
  _beforeResponse(detail) {
    const e = new CustomEvent('response-ready', {
      composed: true,
      bubbles: true,
      cancelable: true,
      detail
    });
    this.dispatchEvent(e);
    if (e.defaultPrevented) {
      return;
    }
    this._reportResponse(e.detail);
  }
  /**
   * Fires the `report-response` custom event with immutable response data.
   * @param {Object} detail The event detail object.
   */
  _reportResponse(detail) {
    detail = this._prepareTransportObject(detail);
    const e = new CustomEvent('report-response', {
      composed: true,
      bubbles: true,
      cancelable: false,
      detail
    });
    this.dispatchEvent(e);
  }
  /**
   * Creates an immutable `detail` object for the `report-response` custom
   * event.
   * @param {Object} detail
   * @return {Object} Immutable object.
   */
  _prepareTransportObject(detail) {
    const configuration = {};
    Object.keys(detail).forEach((key) => {
      configuration[key] = {
        value: detail[key],
        writable: false,
        enumerable: true
      };
    });
    return Object.create(Object.prototype, configuration);
  }
  /**
   * Updates a rule from the `host-rules-changed` custom event.
   * The event should contain `rule` property on the event's detail object
   * containing the rule object.
   * @param {CustomEvent} e
   */
  _ruleUpdated(e) {
    if (e.cancelable || !this.hosts) {
      // Don't update rules if there's no local hosts array. Let the component
      // ask for all rules first.
      return;
    }
    const updatedValue = e.detail.rule;
    const index = this.hosts.findIndex((item) => item._id === updatedValue._id);
    if (index === -1) {
      this.hosts.push(updatedValue);
    } else {
      this.hosts[index] = updatedValue;
    }
  }
  /**
   * Deletes the rule from the `host-rules-deleted` custom event.
   * The event should contain `rule` property on the event's detail object
   * containing the rule object.
   *
   * @param {CustomEvent} e
   */
  _ruleDeleted(e) {
    if (e.cancelable) {
      return;
    }
    if (!this.hosts || !this.hosts.length) {
      return;
    }
    const id = e.detail.id;
    const index = this.hosts.findIndex((item) => item._id === id);
    if (index === -1) {
      return;
    }
    this.hosts.splice(index, 1);
  }
}
window.customElements.define('electron-http-transport', ElectronHttpTransport);
