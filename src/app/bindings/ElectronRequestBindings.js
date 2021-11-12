import { HttpRequestBindings, Jexl, Events } from '../../../web_modules/index.js';

/** @typedef {import('@advanced-rest-client/events').ArcRequest.ArcBaseRequest} ArcBaseRequest */
/** @typedef {import('@advanced-rest-client/events').ArcRequest.RequestConfig} RequestConfig */
/** @typedef {import('@advanced-rest-client/events').ArcResponse.ErrorResponse} ErrorResponse */
/** @typedef {import('@advanced-rest-client/events').TransportRequestSource} TransportRequestSource */
/** @typedef {import('@advanced-rest-client/events').ArcRequest.ArcEditorRequest} ArcEditorRequest */
/** @typedef {import('@advanced-rest-client/events').HostRule.HostRule} HostRule */
/** @typedef {import('@api-components/amf-components').ApiConsoleRequest} ApiConsoleRequest */
/** @typedef {import('@api-components/amf-components').ApiConsoleResponse} ApiConsoleResponse */
/** @typedef {import('@advanced-rest-client/electron/request/RequestOptions').Options} RequestOptions */
/** @typedef {import('@advanced-rest-client/electron/renderer').ElectronRequest} ElectronRequest */
/** @typedef {import('@advanced-rest-client/electron/renderer').SocketRequest} SocketRequest */

export class ElectronRequestBindings extends HttpRequestBindings {
  constructor() {
    super(Jexl);
    this.loadStartHandler = this.loadStartHandler.bind(this);
    this.firstByteHandler = this.firstByteHandler.bind(this);
    this.loadEndHandler = this.loadEndHandler.bind(this);
    this.beforeRedirectHandler = this.beforeRedirectHandler.bind(this);
    this.headersReceivedHandler = this.headersReceivedHandler.bind(this);
  }

  /**
   * @param {ArcBaseRequest} request
   * @param {string} id
   * @param {RequestConfig=} config
   * @param {TransportRequestSource=} source
   */
  async transport(request, id, config = { enabled: false }, source='arc') {
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
    ArcEnvironment.logger.info(`The config passed to the request factory:`, { ...finalConfig, logger: {}});
    try {
      const connection = this.prepareRequest(id, request, finalConfig, source);
      await this.makeConnection(connection);
    } catch (e) {
      ArcEnvironment.logger.error(e);
      this.errorHandler(e, id);
    }
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
      logger: ArcEnvironment.logger,
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
   * Reads the hosts table definition.
   */
  async readHosts() {
    /** @type HostRule[] */
    let hosts = [];
    // the request can proceed without hosts
    try {
      const result = await Events.Model.HostRules.list(document.body);
      if (result.items && result.items.length) {
        hosts = result.items;
      }
    } catch (e) {
      ArcEnvironment.logger.error(e);
    }
    if (this.readOsHosts) {
      try {
        const os = await ArcEnvironment.ipc.invoke('os-hosts', 'list');
        hosts = hosts.concat(os);
      } catch (e) {
        ArcEnvironment.logger.error(e);
      }
    }
    return hosts;
  }

  /**
   * @param {string} id
   * @param {ArcBaseRequest} request
   * @param {RequestOptions} opts
   * @param {TransportRequestSource} source
   * @returns {SocketRequest|ElectronRequest}
   */
  prepareRequest(id, request, opts, source) {
    return this.isNative(opts) ? this.prepareNativeRequest(id, request, opts, source) : this.prepareArcRequest(id, request, opts, source);
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
   * @param {string} id
   * @param {ArcBaseRequest} request
   * @param {RequestOptions} opts
   * @param {TransportRequestSource} source
   * @returns {ElectronRequest}
   */
  prepareNativeRequest(id, request, opts, source) {
    const conn = new ElectronRequest(request, id, opts);
    this.connections.set(id, {
      connection: conn,
      aborted: false,
      request,
      source,
    });
    conn.on('loadstart', this.loadStartHandler);
    conn.on('firstbyte', this.firstByteHandler);
    conn.on('loadend', this.loadEndHandler);
    conn.on('beforeredirect', this.beforeRedirectHandler);
    conn.on('headersreceived', this.headersReceivedHandler);
    conn.on('load', this.loadHandler.bind(this));
    conn.on('error', this.errorHandler.bind(this));
    return conn;
  }

  /**
   * @param {string} id
   * @param {ArcBaseRequest} request
   * @param {RequestOptions} opts
   * @param {TransportRequestSource} source
   * @returns {SocketRequest}
   */
  prepareArcRequest(id, request, opts, source) {
    const conn = new SocketRequest(request, id, opts);
    this.connections.set(id, {
      connection: conn,
      aborted: false,
      request,
      source,
    });
    conn.on('loadstart', this.loadStartHandler);
    conn.on('firstbyte', this.firstByteHandler);
    conn.on('loadend', this.loadEndHandler);
    conn.on('beforeredirect', this.beforeRedirectHandler);
    conn.on('headersreceived', this.headersReceivedHandler);
    conn.on('load', this.loadHandler.bind(this));
    conn.on('error', this.errorHandler.bind(this));
    return conn;
  }

  /**
   * @param {string} id
   */
  loadStartHandler(id) {
    this.informStatus('requestloadstart', id);
  }

  /**
   * @param {string} id
   */
  firstByteHandler(id) {
    this.informStatus('requestfirstbytereceived', id);
  }

  /**
   * @param {string} id
   */
  loadEndHandler(id) {
    this.informStatus('requestloadend', id);
  }

  /**
   * @param {string} id
   * @param {any} detail
   */
  beforeRedirectHandler(id, detail) {
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
      // eslint-disable-next-line no-param-reassign
      detail.returnValue = false;
    }
  }

  /**
   * @param {string} id
   * @param {any} detail
   */
  headersReceivedHandler(id, detail) {
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
      // eslint-disable-next-line no-param-reassign
      detail.returnValue = false;
    }
  }

  /**
   * @param {SocketRequest|ElectronRequest} connection
   */
  async makeConnection(connection) {
    try {
      await connection.send();
    } catch (cause) {
      this.errorHandler(cause, connection.id);
    }
  }
}
