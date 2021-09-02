import http from 'http';
import https from 'https';
import { URL } from 'url'
import { TransportEventTypes } from '@advanced-rest-client/arc-events';
import { ArcHeaders } from '@advanced-rest-client/arc-headers/src/ArcHeaders.js'

/** @typedef {import('@advanced-rest-client/arc-events').HttpTransportEvent} HttpTransportEvent */
/** @typedef {import('@advanced-rest-client/arc-types').ArcRequest.ArcBaseRequest} ArcBaseRequest */
/** @typedef {import('@advanced-rest-client/arc-types').ArcResponse.HTTPResponse} HTTPResponse */

export class HttpProxy {
  #boundHandler;

  constructor() {
    this.#boundHandler = this.#requestHandler.bind(this);
  }

  /**
   * Listens for web events to make an HTTP/HTTPS requests.
   */
  listen() {
    window.addEventListener(TransportEventTypes.httpTransport, this.#boundHandler);
  }

  /**
   * Stops listening to the web events.
   */
  unlisten() {
    window.removeEventListener(TransportEventTypes.httpTransport, this.#boundHandler);
  }

  /** 
   * @param {HttpTransportEvent} e
   */
  #requestHandler(e) {
    const { request } = e.detail;
    e.detail.result = this.fetch(request);
  }

  /**
   * @param {ArcBaseRequest} request
   * @returns {Promise<HTTPResponse>}
   */
  async fetch(request) {
    const { method, url, headers, payload } = request;
    const lib = url.startsWith('https:') ? https : http;
    const params = new URL(url);

    const options = /** @type https.RequestOptions */ ({
      hostname: params.hostname,
      port: params.port,
      path: params.pathname,
      method,
    });

    if (headers) {
      const info = new ArcHeaders(headers);
      const list = /** @type http.OutgoingHttpHeaders */ ({});
      info.forEach(([value, name]) => {
        list[name] = value;
      });
      options.headers = list;
    }
    return new Promise((resolve, reject) => {
      const req = lib.request(options, (res) => {
        let value = '';
        res.on('data', (d) => {
          value += d;
        });
        res.on('end', () => {
          resolve(JSON.parse(value));
        });
      });
      req.on('error', (error) => {
        reject(error);
      });
      if (payload) {
        req.end(payload);
      } else {
        req.end();
      }
    });
  }
}
