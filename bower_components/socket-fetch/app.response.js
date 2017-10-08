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
/* global Response */
/**
 * The {@link ArcResponse} class behaves the same way as JavaScript's Response class
 * but it have additional methods.
 *
 */
class ArcResponse {
  /**
   * The ArcResponse() constructor creates a new {@link ArcResponse} object.
   *
   * @constructor
   * @param {Blob|BufferSource|FormData|URLSearchParams|USVString} body A response body.
   * @param {Object} init (Optional) The same init options as Response object.
   * See https://developer.mozilla.org/en-US/docs/Web/API/Response/Response for more information.
   */
  constructor(body, init) {
    this._status = init.status;

    if (init.error) {
      // Expecting a init.error to be an Error object.
      this.error = init.error;
    } else {
      if (init.status >= 100 && init.status < 200 || init.status === 0) {
        init.status = 200;
      } else if (init.status === undefined) {
        init.status = 200;
        init.statusText = 'Request error';
      }
      if (body === null) {
        body = '';
      }

      if (init.statusText) {
        // see: https://github.com/jarrodek/ChromeRestClient/issues/419#issuecomment-271532029
        let encoder = new TextEncoder();
        let bytes = encoder.encode(init.statusText);
        init.statusText = String.fromCharCode.apply(null, bytes);
      }
      this._response = new Response(body, init);
      this.rawResponse = body;
    }
    if (!(init.redirects instanceof Set)) {
      init.redirects = new Set(init.redirects);
    }
    this.redirects = init.redirects;
    this.stats = init.stats;
    this._headers = init.headers;
    // To be set only if this response is a redirect. It contains the URL of the request for
    // this response.
    this.requestUrl = undefined;
    // To be set only if this response is a redirect. Original message sent to server.
    this.messageSent = undefined;
    // Object filled in with auth method data when reporting 401 or 407.
    // It will contain a `method` property with (lowercase) auth method name
    this.auth = init.auth || undefined;
  }
  get type() {
    return this._response ? this._response.type : null;
  }
  get status() {
    return this._status;
  }
  get statusText() {
    return this._response ? this._response.statusText : null;
  }
  get ok() {
    return this._response ? this._response.ok : false;
  }
  get headers() {
    return this._headers;
  }
  get bodyUsed() {
    return this._response ? this._response.bodyUsed : null;
  }

  clone() {
    if (!this._response) {
      throw new Error('Cannot clone response because it\'s errored response');
    }
    return this._response.clone();
  }
  error() {
    if (!this._response) {
      return () => {
        return this.error;
      };
    }
    return this._response.error();
  }
  redirect() {
    if (!this._response) {
      throw new Error('Cannot redirect response because it\'s errored response');
    }
    return this._response.redirect();
  }
  arrayBuffer() {
    if (!this._response) {
      throw new Error('Cannot read response because it\'s errored response');
    }
    return this._response.arrayBuffer();
  }
  blob() {
    if (!this._response) {
      throw new Error('Cannot read response because it\'s errored response');
    }
    return this._response.blob();
  }
  formData() {
    if (!this._response) {
      throw new Error('Cannot read response because it\'s errored response');
    }
    return this._response.formData();
  }
  json() {
    if (!this._response) {
      throw new Error('Cannot read response because it\'s errored response');
    }
    return this._response.json();
  }
  text() {
    if (!this._response) {
      throw new Error('Cannot read response because it\'s errored response');
    }
    return this._response.text();
  }
}
window.ArcResponse = ArcResponse;
})();
