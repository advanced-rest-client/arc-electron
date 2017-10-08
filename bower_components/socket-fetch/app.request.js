(function() {
'use strict';
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
/* global HttpParser, Request, Headers */
/**
 * {@link ArcRequest} class behaves the same way as JavaScript's Request class
 * but it won't set guqards for Headers object.
 */
class ArcRequest {
  /**
   * The ArcRequest() constructor creates a new {@link ArcRequest} object.
   *
   * @constructor
   * @param {String|ArcRequest} input Defines the resource that you wish to fetch.
   * This can either be:
   * - A USVString containing the direct URL of the resource you want to fetch.
   * - An {@link ArcRequest} object.
   * @param {Object} init (Optional) An options object containing any custom settings that you
   * want to apply to the request. The possible options are:
   * - method: The request method, e.g., GET, POST. Default to GET.
   * - headers: Any headers you want to add to your request, contained within a Headers object or
   *   an object literal with ByteString values.
   * - body: Any body that you want to add to your request: this can be a Blob, BufferSource,
   *   FormData, URLSearchParams, or USVString object. Note that a request using the GET or HEAD
   *   method cannot have a body.
   * - redirect: The redirect mode to use: follow or error. If follow is set the result will
   *   contain redairect information.
   */
  constructor(input, init) {
    /**
     * A HTTP method
     *
     * @type {String}
     */
    this._method = 'GET';
    /**
     * A Headers object.
     *
     * @type {Headers}
     */
    this._headers = undefined;
    /**
     * A body to send with the request.
     * Note that a request using the GET or HEAD method cannot have a body.
     *
     * @type {Blob|BufferSource|FormData|URLSearchParams|USVString}
     */
    this._body = undefined;
    /**
     * The redirect mode to use: follow (default) or error.
     */
    this._redirect = 'follow';
    /**
     * A number of milliseconds for connection timeout.
     * Note that the timer run at the moment when connection was established.
     *
     * @type {Number}
     */
    this._timeout = undefined;
    /**
     * Defines the resource to fetch
     *
     * @type {String}
     */
    this._url = undefined;
    /**
     * Set to true if the request may carry a payload.
     * It does not means that it is.
     * This is read only.
     *
     * @type {Boolean}
     */
    this._payloadRequest = undefined;
    /**
     * A string representation of the message sent to the server.
     *
     * @type {String}
     */
    this._messageSent = undefined;

    if (input instanceof ArcRequest ||
      input instanceof Request) {
      this._assignFromInstance(input);
    } else {
      this.url = input;
      this._assignInit(init);
    }
  }
  /**
   * Assign initial values.
   *
   * @param {Object} init an object with passed initial values.
   */
  _assignInit(init) {
    if ('method' in init) {
      this.method = init.method;
    }
    if ('headers' in init) {
      this.headers = init.headers;
    }
    if ('body' in init) {
      this.body = init.body;
    }
    if ('redirect' in init) {
      this.redirect = init.redirect;
    }
    if ('timeout' in init) {
      this.timeout = init.timeout;
    }
    if ('messageSent' in init) {
      this.messageSent = init.messageSent;
    }
    if ('auth' in init) {
      this.auth = init.auth;
    }
  }
  /**
   * Assign initial value from existing {@link ArcRequest} object
   * (without error checking)
   *
   * @param {ArcRequest} input An existing instance.
   */
  _assignFromInstance(input) {
    input = Object.assign({}, input);
    this._url = input._url;
    this._method = input._method;
    this._headers = input._headers;
    this._body = input._body;
    this._redirect = input._redirect;
    this._timeout = input._timeout;
    this._messageSent = input._messageSent;
    this._auth = input._auth;
  }
  /**
   * Sets a HTTP method to this {@link ArcRequest} object.
   *
   * @param {String} method A method to set.
   */
  set method(method) {
    if (method) {
      method = method.trim();
    }
    if (!HttpParser.isValidHTTPToken(method)) {
      throw new Error(`"${method}" is not a valid HTTP method.`);
    }
    // if (HttpParser.isForbiddenMethod(method)) {
    //   throw new Error(`"${method}" HTTP method is unsupported.`);
    // }
    this._method = method.toUpperCase();
    this._payloadRequest = ['GET', 'HEADER'].indexOf(this._method) === -1;
  }
  /**
   * @return {String} Method name.
   */
  get method() {
    return this._method;
  }
  /**
   * Readonly.
   *
   * @return {Boolean} True if the request can carry a payload. It does not means that it is.
   */
  get payloadRequest() {
    return this._payloadRequest;
  }
  /**
   * @param {Blob|BufferSource|FormData|URLSearchParams|USVString} body A body to send
   */
  set body(body) {
    // if (!body) {
    //   throw new Error('Passed body is undefined.');
    // }
    if (this._method === 'GET' || this._method === 'HEAD') {
      throw new Error('Request with GET/HEAD method cannot have body.');
    }
    this._body = body;
  }
  get body() {
    return this._body;
  }
  /**
   * A redirect value.
   * Can be follow or error.
   *
   * @type {String} redirect A redirect value to set.
   */
  set redirect(redirect) {
    if (!redirect) {
      throw new Error('Passed redirect is undefined.');
    }
    if (['follow', 'error'].indexOf(redirect) === -1) {
      throw new Error(`${redirect} is unsupported redirect.`);
    }
  }
  get redirect() { return this._redirect; }

  set url(url) {
    if (!url) {
      throw new Error('Url can not be undefined.');
    }
    this._uri = new URL(url);
    this._url = url;
  }
  get url() {
    return this._url;
  }
  /**
   * Set a headers list.
   * This function will throw an error as Headers object would.
   *
   * @param {Object|Headers} headers A list of headers to set.
   */
  set headers(headers) {
    this._headers = new Headers(headers);
  }

  get headers() {
    return this._headers;
  }
  /**
   * @return {URI} A parsed URL by URI library..
   */
  get uri() {
    return this._uri;
  }

  set timeout(timeout) {
    if (isNaN(timeout)) {
      console.warn(`Timeout of ${timeout} is not a number`);
      return;
    }
    this._timeout = timeout;
  }

  get timeout() {
    return this._timeout;
  }

  set messageSent(message) {
    this._messageSent = message;
  }

  get messageSent() {
    return this._messageSent;
  }
  /**
   * This is a setup for for auth options.
   * The library will attempt to authenticate the user with given credentials.
   *
   * @param {Object} opts An object containng:
   * {String} uid An user ID
   * {String} passwd User password
   * {String} method One of basic, ntlm, digest. Lowercase.
   * {String} domain Optional. Auth domain. Default undefined.
   * {Boolean} proxy Optional. True for proxy authentication. Default to false.
   */
  set auth(opts) {
    if (!opts.uid || !opts.passwd || !opts.method) {
      console.warn('Invalid auth options. uid, passwd and method are required');
    }
    opts.domain = opts.domain || undefined;
    opts.proxy = opts.proxy || false;
    this._auth = opts;
  }

  get auth() {
    return this._auth;
  }
}
window.ArcRequest = ArcRequest;
})();
