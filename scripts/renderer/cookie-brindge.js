/**
 * Class responsible for cookie exchange between web app and the main process.
 */
class CookieBridge {
  constructor(ipc) {
    this.ipc = ipc;
    this._requestId = 0;
    this._promises = [];
    this._onRequestAllCookies = this._onRequestAllCookies.bind(this);
    this._onRequestDomainCookies = this._onRequestDomainCookies.bind(this);
    this._onUpdateCookie = this._onUpdateCookie.bind(this);
    this._onCookieSessionResponse = this._onCookieSessionResponse.bind(this);
    this._onCookieChanged = this._onCookieChanged.bind(this);
    this._onRemoveCookies = this._onRemoveCookies.bind(this);
    this._beforeRequestHandler = this._beforeRequestHandler.bind(this);
  }

  listen() {
    window.addEventListener('session-cookie-list-all', this._onRequestAllCookies);
    window.addEventListener('session-cookie-list-domain', this._onRequestDomainCookies);
    window.addEventListener('session-cookie-remove', this._onRemoveCookies);
    window.addEventListener('session-cookie-udpate', this._onUpdateCookie);
    window.addEventListener('before-request', this._beforeRequestHandler);
    this.ipc.on('cookie-session-response', this._onCookieSessionResponse);
    this.ipc.on('cookie-changed', this._onCookieChanged);
  }

  unlisten() {
    window.removeEventListener('session-cookie-list-all', this._onRequestAllCookies);
    window.removeEventListener('session-cookie-list-domain', this._onRequestDomainCookies);
    window.removeEventListener('session-cookie-remove', this._onRemoveCookies);
    window.removeEventListener('session-cookie-udpate', this._onUpdateCookie);
    window.removeEventListener('before-request', this._beforeRequestHandler);
    this.ipc.removeListener('cookie-session-response', this._onCookieSessionResponse);
    this.ipc.removeListener('cookie-changed', this._onCookieChanged);
  }

  _appendPromise(id) {
    var p = new Promise((resolve, reject) => {
      let obj = {
        id: id,
        resolve: resolve,
        reject: reject
      };
      this._promises.push(obj);
    });
    return p;
  }

  _onCookieSessionResponse(event, id, data, isError) {
    var index = this._promises.findIndex(p => p.id === id);
    if (index === -1) {
      console.warn('Promise not found');
      return;
    }
    var promise = this._promises[index];
    this._promises.splice(index, 1);
    if (isError) {
      promise.reject(data);
    } else {
      promise.resolve(data);
    }
  }
  /**
   * Web cookies model have `expires` property which is a timestamp
   * in miliseconds intead of seconds as `expirationDate`. This has to be
   * computed before returning cookies to the client.
   *
   * @param {Array} cookies List of cookies to translate
   * @return {Array} Updated list of cookies.
   */
  _translateCookiesForWeb(cookies) {
    if (!cookies) {
      return;
    }
    return cookies.map(cookie => this._translateCookieForWeb(cookie));
  }

  _translateCookieForWeb(cookie) {
    cookie.expires = cookie.expirationDate * 1000;
    delete cookie.expirationDate;
    return cookie;
  }

  _translateCookieForElectron(cookie) {
    if (cookie.expires) {
      cookie.expirationDate = Math.round(cookie.expires / 1000);
      delete cookie.expires;
    }
    return cookie;
  }

  _onRequestAllCookies(e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    var id = ++this._requestId;
    this.ipc.send('cookies-session', {
      action: 'get',
      type: 'all',
      id: id
    });
    const p = this._appendPromise(id);
    p.then(cookies => this._translateCookiesForWeb(cookies));
    e.detail.result = p;
  }

  _onRequestDomainCookies(e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    var id = ++this._requestId;
    var domain = e.detail.domain;
    this.ipc.send('cookies-session', {
      action: 'get',
      type: 'domain',
      domain: domain,
      id: id
    });
    const p = this._appendPromise(id);
    p.then(cookies => this._translateCookiesForWeb(cookies));
    e.detail.result = p;
  }

  _onRemoveCookies(e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    var id = ++this._requestId;
    var cookies = e.detail.cookies;
    this.ipc.send('cookies-session', {
      action: 'remove',
      type: 'multiple',
      cookies: cookies,
      id: id
    });
    e.detail.result = this._appendPromise(id);
  }

  _onUpdateCookie(e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    var id = ++this._requestId;
    var cookie = this._translateCookieForElectron(e.detail.cookie);
    this.ipc.send('cookies-session', {
      action: 'set',
      cookie: cookie,
      id: id
    });
    e.detail.result = this._appendPromise(id);
  }

  _onCookieChanged(event, data) {
    const cookie = this._translateCookieForWeb(data.cookie);
    if (data.removed) {
      this.fire('session-cookie-removed', cookie);
    } else {
      this.fire('session-cookie-changed', cookie);
    }
  }

  fire(type, detail) {
    var event = new CustomEvent(type, {
      detail: detail,
      bubbles: true
    });
    document.body.dispatchEvent(event);
  }
  /**
   * Handler for the ARC's event `before-request`.
   * The event is handled asynchronously.
   */
  _beforeRequestHandler(e) {
    var promise = new Promise(function(request, resolve, reject) {
      this._processBeforeRequest(request, resolve, reject);
    }.bind(this, e.detail));
    e.detail.promises.push(promise);
  }

  /**
   * Processes request before it's send to the transport library.
   * It sets cookie header string for current URL.
   */
  _processBeforeRequest(request, resolve, reject) {
    this.getCookiesHeaderValue(request.url)
    .then(cookie => {
      this._applyCookieHeader(cookie, request);
      resolve(request);
    })
    .catch(reject);
  }

  /**
   * Get cookies header value for given URL.
   *
   * @param {String} url An URL for cookies.
   * @return {Promise<String>} Promise that resolves to header value string.
   */
  getCookiesHeaderValue(url) {
    return this.getCookies(url)
    .then(function(cookies) {
      if (!cookies) {
        cookies = [];
      }
      var strs = cookies.map(function(c) {
        return c.name + '=' + c.value;
      }).join('; ');
      return strs;
    });
  }
  /**
   * Gets a list of cookies for given URL (matching domain and path as defined
   * in Cookie spec) from  the datastore.
   *
   * @param {String} url An URL to match cookies.
   * @return {Promise<Array>} List of database objects that matches cookies.
   */
  getCookies(url) {
    var id = ++this._requestId;
    this.ipc.send('cookies-session', {
      action: 'get',
      type: 'url',
      url: url,
      id: id
    });
    return this._appendPromise(id);
  }

  /**
   * Applies cookie header value to current request headers.
   * If header to be applied is computed then it will alter headers string.
   *
   * Note, this element do not sends `request-headers-changed` event.
   *
   * @param {String} header Computed headers string
   * @param {Object} request The request object from the event.
   */
  _applyCookieHeader(header, request) {
    header = header.trim();
    if (!header) {
      return;
    }
    this.fire('app-log', {
      'message': ['Cookies to send with the request:', header],
      'level': 'info'
    });
    var behavior = ArcBehaviors.HeadersParserBehavior;
    var headers = behavior.headersToJSON.apply(behavior, [request.headers]);
    var found = false;
    for (var i = 0, len = headers.length; i < len; i++) {
      if (headers[i].name.toLowerCase() === 'cookie') {
        found = true;
        // TODO: should it check for duplicates?
        headers[i].value = headers[i].value + '; ' + header;
        break;
      }
    }
    if (!found) {
      headers.push({
        name: 'cookie',
        value: header
      });
    }
    request.headers = behavior.headersToString.apply(behavior, [headers]);
  }
}
exports.CookieBridge = CookieBridge;
