
class CookieBridge {
  constructor(ipc) {
    this.ipc = ipc;
    this._requestId = 0;
    this._promises = [];
    this._onRequestAllCookies = this._onRequestAllCookies.bind(this);
    this._onRequestDomainCookied = this._onRequestDomainCookied.bind(this);
    this._onRemoveCookie = this._onRemoveCookie.bind(this);
    this._onAddCookie = this._onAddCookie.bind(this);
    this._onCookieSessionResponse = this._onCookieSessionResponse.bind(this);
  }

  listen() {
    window.addEventListener('list-all-cookies', this._onRequestAllCookies);
    window.addEventListener('list-domain-cookies', this._onRequestDomainCookied);
    window.addEventListener('remove-cookie', this._onRemoveCookie);
    window.addEventListener('add-cookie', this._onAddCookie);
    this.ipc.on('cookie-session-response', this._onCookieSessionResponse);
  }

  unlisten() {
    window.removeEventListener('list-all-cookies', this._onRequestAllCookies);
    window.removeEventListener('list-domain-cookies', this._onRequestDomainCookied);
    window.removeEventListener('remove-cookie', this._onRemoveCookie);
    window.removeEventListener('add-cookie', this._onAddCookie);
    this.ipc.removeListener('cookie-session-response', this._onCookieSessionResponse);
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
    this.promises.splice(index, 1);
    if (isError) {
      promise.reject(data);
    } else {
      promise.resolve(data);
    }
  }

  _onRequestAllCookies(e) {
    var id = ++this._requestId;
    this.ipc.send('cookies-session', {
      action: 'get',
      type: 'all',
      id: id
    });
    e.detail.result = this._appendPromise(id);
  }

  _onRequestDomainCookied(e) {
    var id = ++this._requestId;
    var domain = e.detail.domain;
    this.ipc.send('cookies-session', {
      action: 'get',
      type: 'domain',
      domain: domain,
      id: id
    });
    e.detail.result = this._appendPromise(id);
  }

  _onRemoveCookie(e) {
    var id = ++this._requestId;
    var cookie = e.detail.cookie;
    this.ipc.send('cookies-session', {
      action: 'remove',
      cookie: cookie,
      id: id
    });
    e.detail.result = this._appendPromise(id);
  }

  _onAddCookie(e) {
    var id = ++this._requestId;
    var cookie = e.detail.cookie;
    this.ipc.send('cookies-session', {
      action: 'set',
      cookie: cookie,
      id: id
    });
    e.detail.result = this._appendPromise(id);
  }
}
exports.CookieBridge = CookieBridge;
