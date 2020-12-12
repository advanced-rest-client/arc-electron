import { ipcRenderer as ipc } from 'electron';
import { SessionCookieEventTypes, SessionCookieEvents } from '@advanced-rest-client/arc-events';

/** @typedef {import('@advanced-rest-client/arc-events').SessionCookiesListEvent} SessionCookiesListEvent */
/** @typedef {import('@advanced-rest-client/arc-events').SessionCookiesListDomainEvent} SessionCookiesListDomainEvent */
/** @typedef {import('@advanced-rest-client/arc-events').SessionCookiesListUrlEvent} SessionCookiesListUrlEvent */
/** @typedef {import('@advanced-rest-client/arc-events').SessionCookiesRemoveEvent} SessionCookiesRemoveEvent */
/** @typedef {import('@advanced-rest-client/arc-events').SessionCookieUpdateEvent} SessionCookieUpdateEvent */
/** @typedef {import('@advanced-rest-client/arc-events').SessionCookieUpdateBulkEvent} SessionCookieUpdateBulkEvent */
/** @typedef {import('@advanced-rest-client/arc-types').Cookies.ARCCookie} ARCCookie */

export const requestAllCookiesHandler = Symbol('requestAllCookiesHandler');
export const requestDomainCookiesHandler = Symbol('requestDomainCookiesHandler');
export const requestUrlCookiesHandler = Symbol('requestUrlCookiesHandler');
export const updateCookieHandler = Symbol('updateCookieHandler');
export const updateCookiesHandler = Symbol('updateCookiesHandler');
export const deleteCookiesHandler = Symbol('deleteCookiesHandler');
export const cookieChangeHandler = Symbol('cookieChangeHandler');

/**
 * Computes a cookie URL from the cookie definition
 *
 * @param {ARCCookie} cookie
 * @param {boolean=} secured
 * @return {string}
 */
function computeCookieUrl(cookie, secured=false) {
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
 * @param {Electron.Cookie} electronCookie
 * @return {ARCCookie}
 */
export function electronToArcCookie(electronCookie) {
  const cookie = /** @type ARCCookie */ ({
    domain: electronCookie.domain,
    httpOnly: electronCookie.httpOnly,
    hostOnly: electronCookie.hostOnly,
    name: electronCookie.name,
    path: electronCookie.path,
    secure: electronCookie.secure,
    session: electronCookie.session,
    value: electronCookie.value,
    created: Date.now(),
    expires: 0,
    lastAccess: Date.now(),
    persistent: false,
  });
  if (electronCookie.expirationDate) {
    cookie.expires = electronCookie.expirationDate * 1000;
  }
  return cookie;
}
/**
 * @param {ARCCookie} cookie
 * @return {CookiesSetDetails} A copy of the cookie that is translated into an Electron cookie
 */
export function arcCookieToElectron(cookie) {
  const electronCookie = /** @type CookiesSetDetails */ ({
    domain: cookie.domain,
    httpOnly: cookie.httpOnly,
    hostOnly: cookie.hostOnly,
    name: cookie.name,
    path: cookie.path,
    secure: cookie.secure,
    value: cookie.value,
    url: computeCookieUrl(cookie, cookie.secure),
  });
  if (cookie.expires) {
    electronCookie.expirationDate = Math.round(cookie.expires / 1000);
  }
  return electronCookie;
}


/**
 * Class responsible for cookie exchange between web app and the main process.
 */
export class CookieBridge {
  constructor() {
    this[requestAllCookiesHandler] = this[requestAllCookiesHandler].bind(this);
    this[requestDomainCookiesHandler] = this[requestDomainCookiesHandler].bind(this);
    this[requestUrlCookiesHandler] = this[requestUrlCookiesHandler].bind(this);
    this[updateCookieHandler] = this[updateCookieHandler].bind(this);
    this[updateCookiesHandler] = this[updateCookiesHandler].bind(this);
    this[cookieChangeHandler] = this[cookieChangeHandler].bind(this);
    this[deleteCookiesHandler] = this[deleteCookiesHandler].bind(this);
  }

  listen() {
    window.addEventListener(SessionCookieEventTypes.listAll, this[requestAllCookiesHandler]);
    window.addEventListener(SessionCookieEventTypes.listDomain, this[requestDomainCookiesHandler]);
    window.addEventListener(SessionCookieEventTypes.listUrl, this[requestUrlCookiesHandler]);
    window.addEventListener(SessionCookieEventTypes.delete, this[deleteCookiesHandler]);
    window.addEventListener(SessionCookieEventTypes.update, this[updateCookieHandler]);
    window.addEventListener(SessionCookieEventTypes.updateBulk, this[updateCookiesHandler]);
    ipc.on('cookie-changed', this[cookieChangeHandler]);
  }

  unlisten() {
    window.removeEventListener(SessionCookieEventTypes.listAll, this[requestAllCookiesHandler]);
    window.removeEventListener(SessionCookieEventTypes.listDomain, this[requestDomainCookiesHandler]);
    window.removeEventListener(SessionCookieEventTypes.listUrl, this[requestUrlCookiesHandler]);
    window.removeEventListener(SessionCookieEventTypes.delete, this[deleteCookiesHandler]);
    window.removeEventListener(SessionCookieEventTypes.update, this[updateCookieHandler]);
    window.removeEventListener(SessionCookieEventTypes.updateBulk, this[updateCookiesHandler]);
    ipc.removeListener('cookie-changed', this[cookieChangeHandler]);
  }

  /**
   * @return {Promise<ARCCookie[]>} List of all cookies in the cookie session partition.
   */
  async getAllCookies() {
    const result = /** @type Electron.Cookie[] */ (await ipc.invoke('cookies-session-get-all'));
    return result.map((item) => electronToArcCookie(item));
  }

  /**
   * @param {string} domain Cookies domain name
   * @return {Promise<ARCCookie[]>} List of domain cookies in the cookie session partition.
   */
  async getDomainCookies(domain) {
    const result = /** @type Electron.Cookie[] */ (await ipc.invoke('cookies-session-get-domain', domain));
    return result.map((item) => electronToArcCookie(item));
  }

  /**
   * Gets a list of cookies for given URL (matching domain and path as defined
   * in Cookie spec) from  the datastore.
   *
   * @param {string} url An URL to match cookies.
   * @return {Promise<ARCCookie[]>} List of database objects that matches cookies.
   */
  async getUrlCookies(url) {
    const result = /** @type Electron.Cookie[] */ (await ipc.invoke('cookies-session-get-url', url));
    return result.map((item) => electronToArcCookie(item));
  }

  /**
   * Removes cookie or cookies from the store.
   * @param {ARCCookie[]} cookies A cookie or a list of cookies to delete.
   * @return {Promise}
   */
  async removeCookies(cookies) {
    const electronCookies = cookies.map((item) => arcCookieToElectron(item));
    return ipc.invoke('cookies-session-remove-cookies', electronCookies);
  }

  /**
   * Creates or updates cookies in the cookies partition.
   * @param {ARCCookie} cookie ARC's cookie definition.
   * @return {Promise}
   */
  async updateCookie(cookie) {
    const electronCookie = arcCookieToElectron(cookie);
    return ipc.invoke('cookies-session-set-cookie', electronCookie);
  }

  /**
   * Stores list of cookies in the store.
   *
   * @param {ARCCookie[]} cookies List of cookies to store
   * @return {Promise} Resolved promise when all cookies are stored.
   */
  async updateCookies(cookies) {
    if (!cookies || !cookies.length) {
      return undefined;
    }
    const items = cookies.map((cookie) => {
      let item;
      // @ts-ignore
      if (cookie.toJSON) {
        // compatibility with cookie-parser of ARC
        // @ts-ignore
        item = cookie.toJSON();
      } else {
        item = cookie;
      }
      return arcCookieToElectron(item);
    });
    return ipc.invoke('cookies-session-set-cookies', items);
  }

  /**
   * @param {Electron.Cookie} cookie 
   * @returns {ARCCookie}
   */
  translateCookieForWeb(cookie) {
    const result = /** @type ARCCookie */ ({ ...cookie });
    if (cookie.expirationDate) {
      result.expires = cookie.expirationDate * 1000;
      // @ts-ignore
      delete result.expirationDate;
    }
    return result;
  }

  /**
   * Handler for the `session-cookie-list-all` DOM event.
   * Sets a result of calling `getAllCookies()` to `detail.result` property.
   * @param {SessionCookiesListEvent} e
   */
  [requestAllCookiesHandler](e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    e.detail.result = this.getAllCookies();
  }

  /**
   * Handler for the `session-cookie-list-domain` DOM event.
   * Sets a result of calling `getDomainCookies()` to `detail.result` property.
   *
   * It expects the `domain` property to be set on the `detail` object.
   *
   * @param {SessionCookiesListDomainEvent} e
   */
  [requestDomainCookiesHandler](e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    const { domain } = e;
    e.detail.result = this.getDomainCookies(domain);
  }

  /**
   * @param {SessionCookiesListUrlEvent} e
   */
  [requestUrlCookiesHandler](e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    const { url } = e;
    e.detail.result = this.getUrlCookies(url);
  }

  /**
   * Handler for the `session-cookie-remove` DOM event.
   * Sets a result of calling `removeCookies(detail.remove)` to `detail.result` property.
   *
   * It expects the `cookies` property to be set on the `detail` object.
   *
   * @param {SessionCookiesRemoveEvent} e
   */
  [deleteCookiesHandler](e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    const { cookies } = e;
    e.detail.result = this.removeCookies(cookies);
  }

  /**
   * Handler for the `session-cookie-update` DOM event.
   * Sets a result of calling `updateCookie(detail.cookie)` to `detail.result` property.
   *
   * It expects the `cookie` property to be set on the `detail` object.
   *
   * @param {SessionCookieUpdateEvent} e
   */
  [updateCookieHandler](e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    const { cookie } = e;
    e.detail.result = this.updateCookie(cookie);
  }

  /**
   * @param {SessionCookieUpdateBulkEvent} e
   */
  [updateCookiesHandler](e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    const { cookies } = e;
    e.detail.result = this.updateCookies(cookies);
  }
 
  /**
   * A handler from main thread's `cookie-changed` event.
   * It dispatches `session-cookie-removed` or `session-cookie-changed` DOM event,
   * depending on the change definition.
   *
   * @param {Event} e IPC event
   * @param {Object} data Cookie data
   * @param {Object} data.cookie The electron cookie object
   * @param {boolean=} data.removed Set when a cookie was removed. Otherwise it is changed.
   */
  [cookieChangeHandler](e, data) {
    const cookie = this.translateCookieForWeb(data.cookie);
    if (data.removed) {
      SessionCookieEvents.State.delete(document.body, cookie);
    } else {
      SessionCookieEvents.State.update(document.body, cookie);
    }
  }
}
