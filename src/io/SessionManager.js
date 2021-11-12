/* eslint-disable no-await-in-loop */
import { session, BrowserWindow, ipcMain, app } from 'electron';
import { EventEmitter } from 'events';
import { WebSessionPersist } from '../common/Constants.js';
import { logger } from './Logger.js';

/** @typedef {import('../types').SessionManagerConfig} SessionManagerConfig */
/** @typedef {import('electron').Cookie} Cookie */
/** @typedef {import('electron').Cookies} Cookies */
/** @typedef {import('electron').CookiesSetDetails} CookiesSetDetails */

const cookieChangedHandler = Symbol('cookieChangedHandler');
const getAllCookiesHandler = Symbol('getAllCookiesHandler');
const openSessionWindowHandler = Symbol('openSessionWindowHandler');
const computeCookieUrl = Symbol('computeCookieUrl');
const getDomainCookiesHandler = Symbol('getDomainCookiesHandler');
const getUrlCookiesHandler = Symbol('getUrlCookiesHandler');
const setCookieHandler = Symbol('setCookieHandler');
const setCookiesHandler = Symbol('setCookiesHandler');
const removeCookieHandler = Symbol('removeCookieHandler');
const removeCookiesHandler = Symbol('removeCookiesHandler');
const handleCertIssue = Symbol('handleCertIssue');
const isAppUsedUrl = Symbol('isAppUsedUrl');
const sessionValue = Symbol('sessionValue');

/**
 * A class responsible for managing chrome web session.
 */
export class SessionManager extends EventEmitter {
  /**
   * @return {Cookies} Instance of the session cookies object
   */
  get session() {
    let existing = this[sessionValue];
    if (!existing) {
      this[sessionValue] = this.getSessionCookies();
      existing = this[sessionValue];
    }
    return existing;
  }

  /**
   * @param {SessionManagerConfig=} opts Configuration options
   */
  constructor(opts={}) {
    super();
    this.appUrls = opts.appUrls;
    
    [
      cookieChangedHandler,
      getAllCookiesHandler,
      openSessionWindowHandler,
      getDomainCookiesHandler,
      getUrlCookiesHandler,
      setCookieHandler,
      setCookiesHandler,
      removeCookieHandler,
      removeCookiesHandler,
      handleCertIssue,
    ].forEach((symbol) => {
      this[symbol] = this[symbol].bind(this);
    });
  }

  /**
   * Listens on the IPC events from the renderer
   */
  listen() {
    this.session.on('changed', this[cookieChangedHandler]);
    ipcMain.on('open-web-url', this[openSessionWindowHandler]);
    ipcMain.handle('cookies-session-get-all', this[getAllCookiesHandler]);
    ipcMain.handle('cookies-session-get-domain', this[getDomainCookiesHandler]);
    ipcMain.handle('cookies-session-get-url', this[getUrlCookiesHandler]);
    ipcMain.handle('cookies-session-set-cookie', this[setCookieHandler]);
    ipcMain.handle('cookies-session-set-cookies', this[setCookiesHandler]);
    ipcMain.handle('cookies-session-remove-cookie', this[removeCookieHandler]);
    ipcMain.handle('cookies-session-remove-cookies', this[removeCookiesHandler]);
    app.on('certificate-error', this[handleCertIssue]);
  }

  /**
   * Un-listens previously registered listeners
   */
  unlisten() {
    this.session.removeListener('changed', this[cookieChangedHandler]);
    ipcMain.removeListener('open-web-url', this[openSessionWindowHandler]);
    ipcMain.removeHandler('cookies-session-get-all');
    ipcMain.removeHandler('cookies-session-get-domain');
    ipcMain.removeHandler('cookies-session-get-url');
    ipcMain.removeHandler('cookies-session-set-cookie');
    ipcMain.removeHandler('cookies-session-set-cookies');
    ipcMain.removeHandler('cookies-session-remove-cookie');
    ipcMain.removeHandler('cookies-session-remove-cookies');
    app.removeListener('certificate-error', this[handleCertIssue]);
    this[sessionValue] = null;
  }

  /**
   * @param {Event} e
   * @param {string} url
   * @param {string} purpose
   */
  [openSessionWindowHandler](e, url, purpose) {
    switch (purpose) {
      case 'web-session': this.openWebBrowser(url); break;
      default:
    }
  }

  /**
   * @param {Event} e
   * @param {Cookie} cookie
   * @param {string} cause
   * @param {boolean} removed
   */
  [cookieChangedHandler](e, cookie, cause, removed) {
    const data = {
      cookie,
      cause,
      removed,
    };
    this.emit('cookie-changed', data);
  }

  /**
   * @return {Cookies} Electron's Cookies class instance for session window.
   */
  getSessionCookies() {
    const sis = session.fromPartition(WebSessionPersist);
    return sis.cookies;
  }

  /**
   * Retrieves all cookies stored with the session.
   * @return {Promise<Cookie[]>} A promise resolved to a list of cookies.
   */
  async [getAllCookiesHandler]() {
    return this.getAllCookies();
  }

  /**
   * Retrieves all cookies stored with the session.
   * @return {Promise<Cookie[]>} A promise resolved to a list of cookies.
   */
  async getAllCookies() {
    return this.session.get({});
  }

  /**
   * Retrieves cookies stored with the session for given domain.
   * @param {String} domain
   * @return {Promise<Cookie[]>} A promise resolved to a list of cookies.
   */
  async getDomainCookies(domain) {
    return this.session.get({ domain });
  }

  /**
   * Retrieves cookies stored with the session for given url.
   * @param {string} url
   * @return {Promise<Cookie[]>} A promise resolved to a list of cookies.
   */
  async getUrlCookies(url) {
    return this.session.get({ url });
  }

  /**
   * Computes a cookie URL from the cookie definition
   *
   * @param {Cookie} cookie
   * @param {boolean=} secured
   * @return {string}
   */
  [computeCookieUrl](cookie, secured=false) {
    let { domain='' } = cookie;
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
   * Sets a cookie in the cookie store
   *
   * @param {CookiesSetDetails|Cookie} cookie
   * @return {Promise<CookiesSetDetails>}
   */
  async setCookie(cookie) {
    const typedSet = /** @type CookiesSetDetails */ (cookie);
    const typed = /** @type Cookie */ (cookie);
    if (!typedSet.url) {
      typedSet.url = this[computeCookieUrl](typed, cookie.secure);
    }
    try {
      await this.session.remove(typedSet.url, typedSet.name);
      await this.session.set(typedSet);
      await this.session.flushStore();
    } catch (e) {
      logger.error(e.message);
      logger.error(e.stack);
    }
    return typedSet;
  }

  /**
   * Removes a cookie from the store
   *
   * @param {Cookie | CookiesSetDetails} cookie
   * @param {boolean} flush
   * @return {Promise<void>}
   */
  async removeCookie(cookie, flush=true) {
    const typed = /** @type CookiesSetDetails */ (cookie);
    const { name, url } = typed;
    if (url) {
      await this.session.remove(url, name);
    } else {
      const typedCookie = /** @type Cookie */ (cookie);
      await this.removeCookieMakeUrl(typedCookie, name);
    }
    if (flush) {
      await this.session.flushStore();
    }
  }

  /**
   * Removes a cookie from the store using cookie details to construct the URL.
   *
   * @param {Cookie} cookie
   * @param {string} name
   * @return {Promise<void>}
   */
  async removeCookieMakeUrl(cookie, name) {
    const typed = /** @type Cookie */ (cookie);
    const httpUrl = this[computeCookieUrl](typed);
    const httpsUrl = this[computeCookieUrl](typed, true);
    await this.session.remove(httpUrl, name);
    await this.session.remove(httpsUrl, name);
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
        nodeIntegration: false,
      },
    });
    bw.loadURL(url, { userAgent: 'Chrome' });
    return bw;
  }

  /**
   * Handler for the read cookies for a domain event
   * @param {Event} e
   * @param {string} domain
   * @return {Promise<Cookie[]>}
   */
  async [getDomainCookiesHandler](e, domain) {
    return this.getDomainCookies(domain);
  }

  /**
   * Handler for the list all cookies event
   * @param {Event} e
   * @param {string} url
   * @return {Promise<Cookie[]>}
   */
  async [getUrlCookiesHandler](e, url) {
    return this.getUrlCookies(url);
  }

  /**
   * @param {Event} e
   * @param {Cookie | CookiesSetDetails} cookie
   * @return {Promise<CookiesSetDetails>}
   */
  async [setCookieHandler](e, cookie) {
    return this.setCookie(cookie);
  }

  /**
   * @param {Event} e
   * @param {(Cookie | CookiesSetDetails)[]} cookies
   * @return {Promise<void>}
   */
  async [setCookiesHandler](e, cookies) {
    for (let i = 0, len = cookies.length; i < len; i++) {
      await this.setCookie(cookies[i]);
    }
  }

  /**
   * @param {Event} e
   * @param {(Cookie | CookiesSetDetails)[]} cookies
   * @return {Promise<void>}
   */
  async [removeCookiesHandler](e, cookies) {
    for (let i = 0, len = cookies.length; i < len; i++) {
      await this.removeCookie(cookies[i], false);
    }
    await this.session.flushStore();
  }

  /**
   * @param {Event} e
   * @param {Cookie | CookiesSetDetails} cookie
   * @return {Promise<void>}
   */
  async [removeCookieHandler](e, cookie) {
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
  [handleCertIssue](e, webContents, url, error, certificate, callback) {
    if (this[isAppUsedUrl](url)) {
      callback(false);
    } else {
      e.preventDefault();
      callback(true);
    }
  }

  /**
   * Checks if given URL is used by the application to request an external resource.
   * It is used by the `[handleCertIssue]()` function to determine if allow
   * bypass certificate error.
   * Each application registered URL should be evaluated by Chromium default
   * certificate test engine. Otherwise it's a user entered URL in
   * web session and certificate test should be bypassed.
   *
   * @param {string} url An url
   * @return {boolean} True if certificate validation should be applied.
   */
  [isAppUsedUrl](url) {
    const { appUrls } = this;
    if (!url || !appUrls || !appUrls.length) {
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
