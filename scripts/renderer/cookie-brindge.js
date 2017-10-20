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
  }

  listen() {
    window.addEventListener('session-cookie-list-all', this._onRequestAllCookies);
    window.addEventListener('session-cookie-list-domain', this._onRequestDomainCookies);
    window.addEventListener('session-cookie-remove', this._onRemoveCookies);
    window.addEventListener('session-cookie-udpate', this._onUpdateCookie);
    this.ipc.on('cookie-session-response', this._onCookieSessionResponse);
    this.ipc.on('cookie-changed', this._onCookieChanged);
  }

  unlisten() {
    window.removeEventListener('session-cookie-list-all', this._onRequestAllCookies);
    window.removeEventListener('session-cookie-list-domain', this._onRequestDomainCookies);
    window.removeEventListener('session-cookie-remove', this._onRemoveCookies);
    window.removeEventListener('session-cookie-udpate', this._onUpdateCookie);
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
}
exports.CookieBridge = CookieBridge;
