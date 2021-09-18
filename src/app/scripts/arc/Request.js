/* eslint-disable no-param-reassign */
/* eslint-disable no-console */
import { RequestFactory, ModulesRegistry, RequestAuthorization, ResponseAuthorization } from '../../../../web_modules/@advanced-rest-client/request-engine/index.js';
import { TransportEventTypes, TransportEvents, ArcModelEvents } from '../../../../web_modules/@advanced-rest-client/arc-events/index.js';
import jexl from '../../../../web_modules/jexl/dist/Jexl.js';

ModulesRegistry.register(ModulesRegistry.request, '@advanced-rest-client/request-engine/request/request-authorization', RequestAuthorization, ['store']);
ModulesRegistry.register(ModulesRegistry.response, '@advanced-rest-client/request-engine/response/request-authorization', ResponseAuthorization, ['store', 'events']);

/** @typedef {import('@advanced-rest-client/arc-events').ApiTransportEvent} ApiTransportEvent */
/** @typedef {import('@advanced-rest-client/arc-types').ArcRequest.ArcEditorRequest} ArcEditorRequest */
/** @typedef {import('@advanced-rest-client/arc-types').ArcRequest.ArcBaseRequest} ArcBaseRequest */
/** @typedef {import('@advanced-rest-client/arc-types').ArcRequest.TransportRequest} TransportRequest */
/** @typedef {import('@advanced-rest-client/arc-types').ArcRequest.RequestConfig} RequestConfig */
/** @typedef {import('@advanced-rest-client/arc-types').ArcResponse.Response} Response */
/** @typedef {import('@advanced-rest-client/arc-types').ArcResponse.ErrorResponse} ErrorResponse */
/** @typedef {import('@advanced-rest-client/arc-types').HostRule.HostRule} HostRule */
/** @typedef {import('@advanced-rest-client/electron-request').Options} RequestOptions */

/* global ElectronRequest, SocketRequest, logger */

const loadStartHandler = Symbol('loadStartHandler');
const firstByteHandler = Symbol('firstByteHandler');
const loadEndHandler = Symbol('loadEndHandler');
const beforeRedirectHandler = Symbol('beforeRedirectHandler');
const headersReceivedHandler = Symbol('headersReceivedHandler');
const loadHandler = Symbol('loadHandler');
const errorHandler = Symbol('errorHandler');
const prepareRequest = Symbol('prepareRequest');
const prepareNativeRequest = Symbol('prepareNativeRequest');
const prepareArcRequest = Symbol('prepareArcRequest');
const makeConnection = Symbol('makeConnection');
const transportRequestHandler = Symbol('transportRequestHandler');
const makeRequestHandler = Symbol('makeRequestHandler');
const abortRequestHandler = Symbol('abortRequestHandler');
const removeConnectionHandlers = Symbol('removeConnectionHandlers');
const informStatus = Symbol('informStatus');

export class Request {
  constructor() {
    this.factory = new RequestFactory(window, jexl);
    /** 
     * @type {number}
     */
    this.requestTimeout = undefined;
    /** 
     * @type {boolean}
     */
    this.nativeTransport = undefined;
    /** 
     * @type {boolean}
     */
    this.validateCertificates = undefined;
    /** 
     * @type {boolean}
     */
    this.followRedirects = undefined;
    /** 
     * @type {boolean}
     */
    this.defaultHeaders = undefined;
    /** 
     * @type {number}
     */
    this.sentMessageLimit = undefined;
    /** 
     * @type {boolean}
     */
    this.evaluateVariables = true;
    /** 
     * @type {boolean}
     */
    this.evaluateSystemVariables = true;
    /** 
     * @type {boolean}
     */
    this.readOsHosts = false;
    /** 
     * @type {string}
     */
    this.proxy = undefined;
    /** 
     * @type {string}
     */
    this.proxyUsername = undefined;
    /** 
     * @type {string}
     */
    this.proxyPassword = undefined;
    /** 
     * @type {boolean}
     */
    this.proxyEnabled = false;

    /** 
     * @type {Map<string, {connection: ElectronRequest|SocketRequest, request: ArcBaseRequest ,aborted: boolean}>}
     */
    this.connections = new Map();

    this[loadStartHandler] = this[loadStartHandler].bind(this);
    this[firstByteHandler] = this[firstByteHandler].bind(this);
    this[loadEndHandler] = this[loadEndHandler].bind(this);
    this[beforeRedirectHandler] = this[beforeRedirectHandler].bind(this);
    this[headersReceivedHandler] = this[headersReceivedHandler].bind(this);
    this[loadHandler] = this[loadHandler].bind(this);
    this[errorHandler] = this[errorHandler].bind(this);
  }

  listen() {
    window.addEventListener(TransportEventTypes.request, this[makeRequestHandler].bind(this));
    window.addEventListener(TransportEventTypes.abort, this[abortRequestHandler].bind(this));
    window.addEventListener(TransportEventTypes.transport, this[transportRequestHandler].bind(this));
  }

  async [makeRequestHandler](e) {
    const transportRequest = /** @type ArcEditorRequest */ (e.detail);
    try {
      const request = await this.factory.processRequest(transportRequest, {
        evaluateVariables: this.evaluateVariables,
        evaluateSystemVariables: this.evaluateSystemVariables,
      });
      // this event is significant, even though it is handled by the same class.
      TransportEvents.transport(document.body, request.id, request.request);
    } catch (err) {
      logger.error(err);
      const { id, request } = transportRequest;
      TransportEvents.response(document.body, id, request, undefined, {
        error: err,
        loadingTime: 0,
        status: 0,
      });
    }
  }

  /**
   * @param {ApiTransportEvent} e
   */
  async [transportRequestHandler](e) {
    const transportRequest = e.detail;
    const { config, id, request } = transportRequest;
    await this.run(request, id, config);
  }

  /**
   * @param {ArcBaseRequest} request
   * @param {string} id
   * @param {RequestConfig=} config
   */
  async run(request, id, config={ enabled: false }) {
    const rConf = /** @type RequestConfig */ (request.config || {});
    const configInit = rConf.enabled ? rConf : /** @type RequestConfig */ ({});
    const finalConfig = this.prepareRequestOptions(config, configInit);
    if (request.clientCertificate) {
      // @ts-ignore
      finalConfig.clientCertificate = request.clientCertificate;
    }
    const hosts = await this.readHosts();
    if (hosts.length) {
      finalConfig.hosts = hosts;
    }
    logger.info(`The config passed to the request factory:`, { ...finalConfig, logger: {}});
    try {
      const connection = this[prepareRequest](id, request, finalConfig);
      await this[makeConnection](connection);
    } catch (e) {
      logger.error(e);
      this[errorHandler](e, id);
    }
  }

  [abortRequestHandler](e) {
    const { id } = e.detail;
    this.factory.abort(id);
    const info = this.connections.get(id);
    info.connection.abort();
  }

  /**
   * @param {RequestConfig} primary
   * @param {RequestConfig} secondary
   * @returns {RequestOptions}
   */
  prepareRequestOptions(primary, secondary) {
    const result = /** @type RequestOptions */ (/** @type unknown */ ({
      ...secondary,
      ...primary,
      logger,
    }));
    // @ts-ignore
    delete result.enabled;
    // @ts-ignore
    delete result.ignoreSessionCookies;
    const timeout = Number(this.requestTimeout);
    if (typeof result.timeout !== 'number' && !Number.isNaN(timeout)) {
      result.timeout = timeout;
    }
    if (result.timeout) {
      result.timeout *= 1000;
    } else {
      result.timeout = 0;
    }

    if (typeof result.validateCertificates === 'undefined' && typeof this.validateCertificates === 'boolean') {
      result.validateCertificates = this.validateCertificates;
    }
    if (typeof result.followRedirects === 'undefined' && typeof this.followRedirects === 'boolean') {
      result.followRedirects = this.followRedirects;
    }
    if (typeof result.defaultHeaders === 'undefined' && typeof this.defaultHeaders === 'boolean') {
      result.defaultHeaders = this.defaultHeaders;
    }
    const messageLimit = Number(this.sentMessageLimit);
    if (typeof result.sentMessageLimit !== 'number' && !Number.isNaN(messageLimit)) {
      result.sentMessageLimit = messageLimit;
    }
    if (this.proxyEnabled === true) {
      if (typeof result.proxy === 'undefined' && typeof this.proxy === 'string') {
        result.proxy = this.proxy;
      }
      if (typeof result.proxyUsername === 'undefined' && typeof this.proxyUsername === 'string') {
        result.proxyUsername = this.proxyUsername;
      }
      if (typeof result.proxyPassword === 'undefined' && typeof this.proxyPassword === 'string') {
        result.proxyPassword = this.proxyPassword;
      }
    }
    return result;
  }

  /**
   * @param {string} id
   * @param {ArcBaseRequest} request
   * @param {RequestOptions} opts
   * @returns {SocketRequest|ElectronRequest}
   */
  [prepareRequest](id, request, opts) {
    return this.isNative(opts) ? this[prepareNativeRequest](id, request, opts) : this[prepareArcRequest](id, request, opts);
  }

  /**
   * @param {string} id
   * @param {ArcBaseRequest} request
   * @param {RequestOptions} opts
   * @returns {ElectronRequest}
   */
  [prepareNativeRequest](id, request, opts) {
    const conn = new ElectronRequest(request, id, opts);
    this.connections.set(id, {
      connection: conn,
      aborted: false,
      request,
    });
    conn.on('loadstart', this[loadStartHandler]);
    conn.on('firstbyte', this[firstByteHandler]);
    conn.on('loadend', this[loadEndHandler]);
    conn.on('beforeredirect', this[beforeRedirectHandler]);
    conn.on('headersreceived', this[headersReceivedHandler]);
    conn.on('load', this[loadHandler]);
    conn.on('error', this[errorHandler]);
    return conn;
  }

  /**
   * @param {string} id
   * @param {ArcBaseRequest} request
   * @param {RequestOptions} opts
   * @returns {SocketRequest}
   */
  [prepareArcRequest](id, request, opts) {
    const conn = new SocketRequest(request, id, opts);
    this.connections.set(id, {
      connection: conn,
      aborted: false,
      request,
    });
    conn.on('loadstart', this[loadStartHandler]);
    conn.on('firstbyte', this[firstByteHandler]);
    conn.on('loadend', this[loadEndHandler]);
    conn.on('beforeredirect', this[beforeRedirectHandler]);
    conn.on('headersreceived', this[headersReceivedHandler]);
    conn.on('load', this[loadHandler]);
    conn.on('error', this[errorHandler]);
    return conn;
  }

  /**
   * @param {RequestOptions} opts
   * @returns {boolean}
   */
  isNative(opts) {
    if (typeof opts.nativeTransport === 'boolean') {
      return opts.nativeTransport;
    }
    return !!this.nativeTransport;
  }

  /**
   * Reads the hosts table definition.
   */
  async readHosts() {
    /** @type HostRule[] */
    let hosts = [];
    // the request can proceed without hosts
    try {
      const result = await ArcModelEvents.HostRules.list(document.body);
      if (result.items && result.items.length) {
        hosts = result.items;
      }
    } catch (e) {
      logger.error(e);
    }
    if (this.readOsHosts) {
      /* global ipc */
      try {
        const os = await ipc.invoke('os-hosts', 'list');
        hosts = hosts.concat(os);
      } catch (e) {
        logger.error(e);
      }
    }
    return hosts;
  }

  /**
   * @param {SocketRequest|ElectronRequest} connection
   */
  async [makeConnection](connection) {
    try {
      await connection.send();
    } catch (cause) {
      this[errorHandler](cause, connection.id);
    }
  }

  /**
   * @param {string} id
   */
  [loadStartHandler](id) {
    this[informStatus]('requestloadstart', id);
  }

  /**
   * @param {string} id
   */
  [firstByteHandler](id) {
    this[informStatus]('requestfirstbytereceived', id);
  }

  /**
   * @param {string} id
   */
  [loadEndHandler](id) {
    this[informStatus]('requestloadend', id);
  }

  /**
   * @param {string} id
   * @param {any} detail
   */
  [beforeRedirectHandler](id, detail) {
    const info = this.connections.get(id);
    if (!info || info.aborted) {
      return;
    }
    const e = new CustomEvent('beforeredirect', {
      composed: true,
      bubbles: true,
      cancelable: true,
      detail: {
        id,
        url: detail.location,
      }
    });
    document.body.dispatchEvent(e);
    if (e.defaultPrevented) {
      detail.returnValue = false;
    }
  }

  /**
   * @param {string} id
   * @param {any} detail
   */
  [headersReceivedHandler](id, detail) {
    const info = this.connections.get(id);
    if (!info || info.aborted) {
      return;
    }
    const e = new CustomEvent('headersreceived', {
      composed: true,
      bubbles: true,
      cancelable: true,
      detail: {
        id,
        url: detail.location,
      }
    });
    document.body.dispatchEvent(e);
    if (e.defaultPrevented) {
      detail.returnValue = false;
    }
  }

  /**
   * @param {string} id
   * @param {Response | ErrorResponse} response
   * @param {TransportRequest} transport
   */
  async [loadHandler](id, response, transport) {
    const info = this.connections.get(id);
    this.connections.delete(id);
    if (!info || info.aborted) {
      return;
    }
    this[removeConnectionHandlers](info.connection);
    const fr = {
      id,
      request: info.request,
    }
    try {
      await this.factory.processResponse(fr, transport, response, {
        evaluateVariables: this.evaluateVariables,
        evaluateSystemVariables: this.evaluateSystemVariables,
      });
      TransportEvents.response(document.body, id, info.request, transport, response);
    } catch (e) {
      const errorResponse = /** @type ErrorResponse */ ({
        error: e,
        status: response.status,
        headers: response.headers,
        payload: response.payload,
        statusText: response.statusText,
        id: response.id,
      });
      TransportEvents.response(document.body, id, info.request, transport, errorResponse);
    }
  }

  /**
   * @param {Error} error
   * @param {string} id
   * @param {TransportRequest=} transport
   * @param {ErrorResponse=} response
   */
  [errorHandler](error, id, transport, response) {
    const info = this.connections.get(id);
    this.connections.delete(id);
    if (!info || info.aborted) {
      return;
    }
    this[removeConnectionHandlers](info.connection);
    const errorResponse = response || {
      error,
      status: 0,
    };

    TransportEvents.response(document.body, id, info.request, transport, errorResponse);
  }

  /**
   * @param {SocketRequest|ElectronRequest} connection
   */
  [removeConnectionHandlers](connection) {
    connection.removeAllListeners('loadstart');
    connection.removeAllListeners('firstbyte');
    connection.removeAllListeners('loadend');
    connection.removeAllListeners('beforeredirect');
    connection.removeAllListeners('headersreceived');
    connection.removeAllListeners('load');
    connection.removeAllListeners('error');
  }

  /**
   * @param {string} type
   * @param {string} id
   */
  [informStatus](type, id) {
    const info = this.connections.get(id);
    if (!info || info.aborted) {
      return;
    }
    document.body.dispatchEvent(new CustomEvent(type, {
      composed: true,
      bubbles: true,
      detail: {
        id,
      }
    }));
  }
}
