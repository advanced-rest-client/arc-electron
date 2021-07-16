/* eslint-disable no-param-reassign */
/* eslint-disable no-console */
import { RequestFactory } from '../../../../web_modules/@advanced-rest-client/request-engine/index.js';
import { TransportEventTypes, TransportEvents } from '../../../../web_modules/@advanced-rest-client/arc-events/index.js';
import { ArcModelEvents } from '../../../../web_modules/@advanced-rest-client/arc-models/index.js';
import jexl from '../../../../web_modules/jexl/dist/Jexl.js';

/** @typedef {import('@advanced-rest-client/arc-events').ApiTransportEvent} ApiTransportEvent */
/** @typedef {import('@advanced-rest-client/arc-types').ArcRequest.ArcBaseRequest} ArcBaseRequest */
/** @typedef {import('@advanced-rest-client/arc-types').ArcRequest.TransportRequest} TransportRequest */
/** @typedef {import('@advanced-rest-client/arc-types').ArcRequest.RequestConfig} RequestConfig */
/** @typedef {import('@advanced-rest-client/arc-types').ArcResponse.Response} Response */
/** @typedef {import('@advanced-rest-client/arc-types').ArcResponse.ErrorResponse} ErrorResponse */
/** @typedef {import('@advanced-rest-client/electron-request').RequestOptions} RequestOptions */
/** @typedef {import('@api-components/api-request/src/types').ApiConsoleRequest} ApiConsoleRequest */
/** @typedef {import('@api-components/api-request/src/types').ApiConsoleResponse} ApiConsoleResponse */

/* global ElectronRequest, SocketRequest, logger */

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

export class ConsoleRequest {
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
     * @type {Map<string, {connection: ElectronRequest|SocketRequest, request: ArcBaseRequest, aborted: boolean}>}
     */
    this.connections = new Map();
    
    this[loadHandler] = this[loadHandler].bind(this);
    this[errorHandler] = this[errorHandler].bind(this);
  }

  listen() {
    window.addEventListener('api-request', this[makeRequestHandler].bind(this));
    window.addEventListener('abort-api-request', this[abortRequestHandler].bind(this));
    window.addEventListener(TransportEventTypes.transport, this[transportRequestHandler].bind(this));
  }

  /**
   * @param {CustomEvent} e
   */
  async [makeRequestHandler](e) {
    const consoleRequest = /** @type any */ (e.detail);
    // this event is significant, even though it is handled by the same class.
    TransportEvents.transport(document.body, consoleRequest.id, consoleRequest);
  }

  /**
   * @param {ApiTransportEvent} e
   */
  async [transportRequestHandler](e) {
    const transportRequest = /** @type any */ (e.detail);
    const { id, request } = transportRequest;
    await this.run(id, request);
  }

  /**
   * @param {string} id
   * @param {ApiConsoleRequest} request
   */
  async run(id, request) {
    const config = this.prepareRequestOptions();
    const baseRequest = this.translateRequest(request);
    // the request can proceed without hosts
    try {
      const hosts = await ArcModelEvents.HostRules.list(document.body);
      if (hosts && hosts.items) {
        config.hosts = hosts.items;
      }
    } catch (e) {
      logger.error(e);
    }
    logger.info(`The config passed to the request factory:`, { ...config, logger: {}});
    try {
      const connection = await this[prepareRequest](id, baseRequest, config);
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
   * @returns {RequestOptions}
   */
  prepareRequestOptions() {
    const result = /** @type RequestOptions */ ({});
    result.logger = logger;
    if (typeof this.requestTimeout === 'number') {
      result.timeout = this.requestTimeout;
    }
    if (result.timeout) {
      result.timeout *= 1000;
    } else {
      result.timeout = 0;
    }

    if (typeof result.validateCertificates === 'undefined' && typeof this.validateCertificates === 'boolean') {
      result.validateCertificates = this.validateCertificates;
    }
    return result;
  }

  /**
   * @param {ApiConsoleRequest} init
   * @returns {ArcBaseRequest}
   */
  translateRequest(init) {
    const result = /** @type ArcBaseRequest */ ({
      url: init.url,
      method: init.method,
      headers: init.headers,
      payload: init.payload,
      auth: init.auth,
    });
    return result;
  }

  /**
   * @param {string} id
   * @param {ArcBaseRequest} request
   * @param {RequestOptions} opts
   * @returns {SocketRequest|ElectronRequest}
   */
  [prepareRequest](id, request, opts) {
    return this.nativeTransport ? this[prepareNativeRequest](id, request, opts) : this[prepareArcRequest](id, request, opts);
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
    conn.on('load', this[loadHandler]);
    conn.on('error', this[errorHandler]);
    return conn;
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
   * @param {Response} response
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
      // @ts-ignore
      await this.factory.processResponse(fr, transport, response, {
        evaluateVariables: false,
        evaluateSystemVariables: false,
      });
      TransportEvents.response(document.body, id, info.request, transport, response);
    } catch (e) {
      // ...
    }
    const resp = /** @type ApiConsoleResponse */ ({
      id,
      isError: false,
      loadingTime: response.loadingTime,
      request: transport,
      response: {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        payload: response.payload,
      }
    });
    this._notifyResponse(resp);
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
    const result = {
      id,
      request: info.request,
      isError: true,
      error,
      loadingTime: 0,
      response: response || {
        status: 0,
      },
    };
    // @ts-ignore
    this._notifyResponse(result);
  }

  /**
   * @param {SocketRequest|ElectronRequest} connection
   */
  [removeConnectionHandlers](connection) {
    connection.removeAllListeners('load');
    connection.removeAllListeners('error');
  }

  /**
   * Dispatches `api-response` custom event.
   *
   * @param {ApiConsoleResponse} detail Request and response data.
   */
  _notifyResponse(detail) {
    const e = new CustomEvent('api-response', {
      bubbles: true,
      composed: true,
      detail
    });
    document.body.dispatchEvent(e);
  }
}
