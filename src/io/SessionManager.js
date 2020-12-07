/* eslint-disable no-await-in-loop */
import { session, BrowserWindow, ipcMain, app } from 'electron';
import { EventEmitter } from 'events';
import { WebSessionPersist } from './Constants.js';


/**
 * A class responsible for managing chrome web session.
 */
export class SessionManager extends EventEmitter {
  /**
   * @param {string[]=} appUrls A list of application internal URLs for which certificate error should not be ignored.
   */
  constructor(appUrls=[]) {
    super();
    this.appUrls = appUrls;
    this._cookieChanged = this._cookieChanged.bind(this);
    this._handleOpenSessionWindow = this._handleOpenSessionWindow.bind(this);
    this._handleCertIssue = this._handleCertIssue.bind(this);
    this._getAllCookiesHandler = this._getAllCookiesHandler.bind(this);
    this._getDomainCookiesHandler = this._getDomainCookiesHandler.bind(this);
    this._setCookieHandler = this._setCookieHandler.bind(this);
    this._setCookiesHandler = this._setCookiesHandler.bind(this);
    this._removeCookiesHandler = this._removeCookiesHandler.bind(this);
    this._removeCookieHandler = this._removeCookieHandler.bind(this);
    this._getUrlCookiesHandler = this._getUrlCookiesHandler.bind(this);
  }

  listen() {
    this._session = this.getSessionCookies();
    this._session.on('changed', this._cookieChanged);
    ipcMain.on('open-web-url', this._handleOpenSessionWindow);
    ipcMain.handle('cookies-session-get-all', this._getAllCookiesHandler);
    ipcMain.handle('cookies-session-get-domain', this._getDomainCookiesHandler);
    ipcMain.handle('cookies-session-get-url', this._getUrlCookiesHandler);
    ipcMain.handle('cookies-session-set-cookie', this._setCookieHandler);
    ipcMain.handle('cookies-session-set-cookies', this._setCookiesHandler);
    ipcMain.handle('cookies-session-remove-cookie', this._removeCookieHandler);
    ipcMain.handle('cookies-session-remove-cookies', this._removeCookiesHandler);
    app.on('certificate-error', this._handleCertIssue);
  }

  unlisten() {
    this._session.removeListener('changed', this._cookieChanged);
    ipcMain.removeListener('open-web-url', this._handleOpenSessionWindow);
    ipcMain.removeHandler('cookies-session-get-all');
    ipcMain.removeHandler('cookies-session-get-domain');
    ipcMain.removeHandler('cookies-session-get-url');
    ipcMain.removeHandler('cookies-session-set-cookie');
    ipcMain.removeHandler('cookies-session-set-cookies');
    ipcMain.removeHandler('cookies-session-remove-cookie');
    ipcMain.removeHandler('cookies-session-remove-cookies');
  }

  _handleOpenSessionWindow(e, url, purpose) {
    switch (purpose) {
      case 'web-session': this.openWebBrowser(url); break;
      default:
    }
  }

  _cookieChanged(e, cookie, cause, removed) {
    const data = {
      cookie,
      cause,
      removed,
    };
    this.emit('cookie-changed', data);
  }

  /**
   * @return {Electron.Cookies} Electron's Cookies class instance for session window.
   */
  getSessionCookies() {
    const sis = session.fromPartition(WebSessionPersist);
    return sis.cookies;
  }

  async _getAllCookiesHandler() {
    return this.getAllCookies();
  }
  
  /**
   * Retrieves all cookies stored with the session.
   * @return {Promise<Electron.Cookie[]>} A promise resolved to a list of cookies.
   */
  async getAllCookies() {
    return this._session.get({});
  }

  /**
   * Retrieves cookies stored with the session for given domain.
   * @param {string} domain
   * @return {Promise<Electron.Cookie[]>} A promise resolved to a list of cookies.
   */
  async getDomainCookies(domain) {
    return this._session.get({ domain });
  }

  /**
   * Retrieves cookies stored with the session for given url.
   * @param {string} url
   * @return {Promise<Electron.Cookie[]>} A promise resolved to a list of cookies.
   */
  async getUrlCookies(url) {
    return this._session.get({ url });
  }

  /**
   * @param {Electron.Cookie} cookie 
   * @param {boolean=} secured 
   * @return {string}
   */
  _computeCookieUrl(cookie, secured) {
    let { domain } = cookie;
    if (domain[0] === '.') {
      domain = domain.substr(1);
    }
    let protocol = 'http';
    if (secured) {
      protocol += 's';
    }
    protocol += '://';
    return protocol + domain + (cookie.path || '/');
  }

  /**
   * @param {Electron.Cookie} cookie 
   * @returns {Promise<Electron.CookiesSetDetails>}
   */
  async setCookie(cookie) {
    const info = /** @type Electron.CookiesSetDetails */({
      ...cookie,
    });
    if (!info.url) {
      info.url = this._computeCookieUrl(cookie, cookie.secure);
    }
    // @ts-ignore
    if (cookie.expires && !info.expirationDate) {
      // @ts-ignore
      info.expirationDate = cookie.expires;
    }
    await this._session.set(info);
    await this._session.flushStore();
    return info;
  }

  async removeCookie(cookie, flush=true) {
    const { name } = cookie;
    if (cookie.url) {
      await this._session.remove(cookie.url, name);
    } else {
      await this.removeCookieMakeUrl(cookie, name);
    }
    if (flush) {
      await this._session.flushStore();
    }
  }

  async removeCookieMakeUrl(cookie, name) {
    const httpUrl = this._computeCookieUrl(cookie);
    const httpsUrl = this._computeCookieUrl(cookie, true);
    await this._session.remove(httpUrl, name);
    await this._session.remove(httpsUrl, name);
  }

  /**
   * Opens a new browser window for given URL so the user can
   * authenticate himself in the external service and the app will store
   * cookies from this session.
   * @param {string} url An URL to open
   * @return {BrowserWindow} an instance of created window.
   */
  openWebBrowser(url) {
    const bw = new BrowserWindow({
      webPreferences: {
        partition: WebSessionPersist,
        nodeIntegration: false
      }
    });
    bw.loadURL(url, { userAgent: 'Chrome' });
    return bw;
  }

  async _getDomainCookiesHandler(e, domain) {
    return this.getDomainCookies(domain);
  }

  async _getUrlCookiesHandler(e, url) {
    return this.getUrlCookies(url);
  }

  async _setCookieHandler(e, cookie) {
    return this.setCookie(cookie);
  }

  async _setCookiesHandler(e, cookies) {
    for (let i = 0, len = cookies.length; i < len; i++) {
      await this.setCookie(cookies[i]);
    }
  }

  async _removeCookiesHandler(e, cookies) {
    for (let i = 0, len = cookies.length; i < len; i++) {
      await this.removeCookie(cookies[i], false);
    }
    await this._session.flushStore();
  }

  async _removeCookieHandler(e, cookie) {
    await this.removeCookie(cookie);
  }

  /**
   * Allows to ignore certificate errors when opening session window.
   *
   * @param {Event} e
   * @param {Object} webContents
   * @param {String} url
   * @param {Object} error
   * @param {Object} certificate
   * @param {Function} callback
   */
  _handleCertIssue(e, webContents, url, error, certificate, callback) {
    if (this._isAppUsedUrl(url)) {
      callback(false);
    } else {
      e.preventDefault();
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
    if (!url || !this.appUrls || !this.appUrls.length) {
      return false;
    }
    for (let i = 0, len = this.appUrls.length; i < len; i++) {
      if (url.indexOf(this.appUrls[i]) !== -1) {
        return true;
      }
    }
    return false;
  }
}
