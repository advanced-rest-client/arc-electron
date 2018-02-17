const {session, BrowserWindow, app, ipcMain} = require('electron');
const PERSISTNAME = 'persist:web-session';
/**
 * A class responsible for managing chrome web session.
 */
class SessionManager {

  constructor(windowManager) {
    this.wm = windowManager;
  }

  start() {
    this._session = this.getSessionCookies();
    this._session.on('changed', this._cookieChanged.bind(this));
    app.on('certificate-error', this._handleCertIssue.bind(this));
    ipcMain.on('open-web-url', this._handleOpenSessionWindow.bind(this));
    ipcMain.on('cookies-session', this._handleCookiesSessionRequest.bind(this));
  }

  _handleOpenSessionWindow(event, url, purpose) {
    switch (purpose) {
      case 'web-session': this.openWebBrowser(url); break;
    }
  }

  _handleCookiesSessionRequest(event, data) {
    this.handleRequest(event.sender, data);
  }

  _cookieChanged(event, cookie, cause, removed) {
    var data = {
      cookie: cookie,
      cause: cause,
      removed: removed
    };
    this.wm.notifyAll('cookie-changed', data);
  }

  getSessionCookies() {
    var sis = session.fromPartition(PERSISTNAME);
    return sis.cookies;
  }

  getAllCookies() {
    return new Promise((resolve, reject) => {
      this._session.get({}, (error, cookies) => {
        if (error) {
          reject(error);
        } else {
          resolve(cookies);
        }
      });
    });
  }

  getDomainCookies(url) {
    return new Promise((resolve, reject) => {
      this._session.get({domain: url}, (error, cookies) => {
        if (error) {
          reject(error);
        } else {
          resolve(cookies);
        }
      });
    });
  }

  getUrlCookies(url) {
    return new Promise((resolve, reject) => {
      this._session.get({url: url}, (error, cookies) => {
        if (error) {
          reject(error);
        } else {
          resolve(cookies);
        }
      });
    });
  }

  _computeCookieUrl(cookie) {
    let domain = cookie.domain;
    if (domain[0] === '.') {
      domain = domain.substr(1);
    }
    let protocol = 'http';
    if (cookie.secure) {
      protocol += 's';
    }
    protocol += '://';
    return protocol + domain + (cookie.path || '/');
  }

  setCookie(cookie) {
    return new Promise((resolve, reject) => {
      if (!cookie.url) {
        cookie.url = this._computeCookieUrl(cookie);
      }
      if (cookie.expires) {
        cookie.expirationDate = cookie.expires;
      }
      this._session.set(cookie, (error) => {
        if (error) {
          reject(error);
        } else {
          this._session.flushStore(() => {});
          resolve();
        }
      });
    });
  }

  removeCookie(cookie) {
    return new Promise(resolve => {
      let name = cookie.name;
      let url = cookie.url || this._computeCookieUrl(cookie);
      this._session.remove(url, name, () => {
        this._session.flushStore(() => {});
        resolve();
      });
    });
  }

  /**
   * Opens a new browser window for given URL so the user can
   * authenticate himself in the external service and the app will store
   * cookies from this session.
   * @param {String} url An URL to open
   */
  openWebBrowser(url) {
    const bw = new BrowserWindow({
      webPreferences: {
        partition: PERSISTNAME
      }
    });
    bw.loadURL(url);
  }

  handleRequest(win, data) {
    switch (data.action) {
      case 'get':
        if (data.type === 'all') {
          this._handleAllCookies(win, data.id);
        } else if (data.type === 'url') {
          this._handleUrlCookies(win, data.id, data.url);
        } else {
          this._handleDomainCookies(win, data.id, data.domain);
        }
      break;
      case 'set':
        if (data.type === 'multiple') {
          this._handleSetCookies(win, data.id, data.cookies);
        } else {
          this._handleSetCookie(win, data.id, data.cookie);
        }
      break;
      case 'remove':
        if (data.type === 'single') {
          this._handleRemoveCookie(win, data.id, data.cookie);
        } else {
          this._handleRemoveCookies(win, data.id, data.cookies);
        }
      break;
    }
  }

  _sendResponse(win, id, response) {
    win.send('cookie-session-response', id, response);
  }

  _sendResponseError(win, id, cause) {
    var response = {
      message: cause.message
    };
    win.send('cookie-session-response', id, response);
  }

  _handleAllCookies(win, id) {
    this.getAllCookies()
    .then(cookies => this._sendResponse(win, id, cookies))
    .catch(cause => this._sendResponseError(win, id, cause));
  }

  _handleDomainCookies(win, id, domain) {
    this.getDomainCookies(domain)
    .then(cookies => this._sendResponse(win, id, cookies))
    .catch(cause => this._sendResponseError(win, id, cause));
  }

  _handleUrlCookies(win, id, url) {
    this.getUrlCookies(url)
    .then(cookies => this._sendResponse(win, id, cookies))
    .catch(cause => this._sendResponseError(win, id, cause));
  }

  _handleSetCookie(win, id, cookie) {
    this.setCookie(cookie)
    .then(() => this._sendResponse(win, id))
    .catch(cause => this._sendResponseError(win, id, cause));
  }

  _handleSetCookies(win, id, cookies) {
    const p = cookies.map((cookie) => this.setCookie(cookie));
    Promise.all(p)
    .then(() => this._sendResponse(win, id))
    .catch(cause => this._sendResponseError(win, id, cause));
  }

  _handleRemoveCookie(win, id, cookie) {
    this.removeCookie(cookie)
    .then(() => this._sendResponse(win, id))
    .catch(cause => this._sendResponseError(win, id, cause));
  }

  _handleRemoveCookies(win, id, cookies) {
    var promises = cookies.map(cookie => this.removeCookie(cookie));
    Promise.all(promises)
    .then(() => this._sendResponse(win, id))
    .catch(cause => this._sendResponseError(win, id, cause));
  }

  _handleCertIssue(event, webContents, url, error, certificate, callback) {
    if (this._isAppUsedUrl(url)) {
      callback(false);
    } else {
      event.preventDefault();
      callback(true);
    }
  }
  /**
   * Checks if given URL is used by the application to request an external resource.
   * It is used by the `_handleCertIssue()` function to determine if allow
   * bypass certificate error.
   * Each application registered URL should be evaluated by Chromium default
   * certificate test engine. Otherwise it's a user entered URL in
   * web session and certificate test should be bypassed.
   *
   * @param {String} url An url
   * @return {Boolean} True if certificate validation should be applied.
   */
  _isAppUsedUrl(url) {
    if (!url) {
      return false;
    }
    if (url.indexOf('https://advancedrestclient-1155.appspot.com') !== -1) {
      return true;
    }
    if (url.indexOf('advancedrestclient.com') !== -1) {
      return true;
    }
    return false;
  }
}

exports.SessionManager = SessionManager;
