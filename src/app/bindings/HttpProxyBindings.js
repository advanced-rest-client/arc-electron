import { PlatformBindings, EventTypes } from '../../../web_modules/index.js';

/** @typedef {import('@advanced-rest-client/events').HttpTransportEvent} HttpTransportEvent */

/**
 * Enables the application to make CORS free requests.
 */
export class HttpProxyBindings extends PlatformBindings {
  async initialize() {
    window.addEventListener(EventTypes.Transport.httpTransport, this.httpTransportHandler.bind(this));
  }

  /** 
   * @param {HttpTransportEvent} e
   */
  httpTransportHandler(e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    const { request } = e.detail;
    e.detail.result = ArcEnvironment.fetch(request);
  }
}
