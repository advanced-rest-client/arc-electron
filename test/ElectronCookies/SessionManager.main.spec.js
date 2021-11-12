/* eslint-disable no-await-in-loop */
/* eslint-disable import/no-commonjs */
const { assert } = require('chai');
const { session } = require('electron');
const _require = require('esm')(module);

/** @typedef {import('../../src/io/SessionManager').SessionManager} SessionManager */

const { SessionManager } = _require('../../src/io/SessionManager.js');
const { WebSessionPersist } = _require('../../src/common/Constants.js');

describe('SessionManager - main process', () => {
  const url = 'https://domain.com/cookies';

  async function cleanCookies() {
    const sis = session.fromPartition(WebSessionPersist);
    const Cookies = sis.cookies;
    const cookies = await Cookies.get({});
    if (!cookies || !cookies.length) {
      return;
    }
    for (let i = 0; i < cookies.length; i++) {
      let cookieUrl;
      if (cookies[i].name === 't1') {
        cookieUrl = 'https://domain.com/path';
      } else if (cookies[i].name === 't2') {
        cookieUrl = 'https://other.com/';
      }
      await Cookies.remove((cookieUrl || url), cookies[i].name);
    }
  }

  async function createTestCookies() {
    const sis = session.fromPartition(WebSessionPersist);
    const Cookies = sis.cookies;
    await Cookies.set({
      url: 'https://domain.com/path',
      name: 't1',
      value: 'v1',
    });
    await Cookies.set({
      url: 'https://other.com/',
      name: 't2',
      value: 'v2',
    });
  }

  async function removeCookies(cookies) {
    const sis = session.fromPartition(WebSessionPersist);
    const Cookies = sis.cookies;
    for (let i = 0, len = cookies.length; i < len; i++) {
      const [curl, name] = cookies[i];
      await Cookies.remove(curl, name);
    }
    await Cookies.flushStore();
  }

  describe('getSessionCookies()', () => {
    let instance = /** @type SessionManager */ (null);
    beforeEach(() => {
      instance = new SessionManager();
      instance.listen();
    });

    afterEach(() => {
      instance.unlisten();
    });

    it('Returns Cookies class for session', () => {
      const result = instance.getSessionCookies();
      assert.equal(result.constructor.name, 'Cookies');
    });
  });

  describe('#session', () => {
    let instance = /** @type SessionManager */ (null);
    beforeEach(() => {
      instance = new SessionManager();
    });

    it('returns session cookies instance', () => {
      const result = instance.session;
      assert.equal(result.constructor.name, 'Cookies');
    });

    it('returns the same cookies instance', () => {
      const result1 = instance.session;
      const result2 = instance.session;
      assert.isTrue(result1 === result2);
    });
  });

  describe('setCookie()', () => {
    let instance = /** @type SessionManager */ (null);
    const name = 'test-cookie';
    const value = 'test-value';

    before(() => cleanCookies());

    beforeEach(() => {
      instance = new SessionManager();
      instance.listen();
    });

    afterEach(async () => {
      instance.unlisten();
      await removeCookies([
        [url, name],
        ['https://domain.com/', name],
        ['http://qax.anypoint.mulesoft.com/', '_csrf'],
      ]);
    });

    it('creates a cookie', async () => {
      await instance.setCookie({
        url,
        name,
        value,
      });
      const cookies = await instance.session.get({});
      assert.lengthOf(cookies, 1);
      assert.equal(cookies[0].name, name);
      assert.equal(cookies[0].value, value);
    });

    it('creates url for a cookie', async () => {
      const created = await instance.setCookie({
        name,
        value,
        domain: 'domain.com',
        secure: true,
        url: 'https://domain.com/',
      });
      assert.equal(created.url, 'https://domain.com/');
    });

    it.skip('creates a cookie from renderer object', async () => {
      const cookie = {
        created: Date.now(),
        domain: 'qax.anypoint.mulesoft.com',
        expirationDate: 8640000000000,
        hostOnly: true,
        // httponly: null,
        lastAccess: 1580162723841,
        name: '_csrf',
        path: '/',
        persistent: false,
        value: 'GwjXpexHYiv22J9Bd7NUF-4c',
        url: 'http://qax.anypoint.mulesoft.com',
      };
      await instance.setCookie(cookie);

      const cookies = await instance.session.get({});
      assert.lengthOf(cookies, 1, 'has single cookie');
      assert.deepEqual(cookies[0], {
        name: '_csrf',
        value: 'GwjXpexHYiv22J9Bd7NUF-4c',
        domain: '.qax.anypoint.mulesoft.com',
        hostOnly: false,
        path: '/',
        secure: false,
        httpOnly: false,
        session: false,
        expirationDate: 8640000000000,
        sameSite: 'no_restriction',
      }, 'stores the cookie in the store');
    });
  });

  describe('removeCookie()', () => {
    let instance = /** @type SessionManager */ (null);
    const curl = 'https://domain.com/cookies';
    const name = 'test-cookie';
    const value = 'test-value';

    before(() => cleanCookies());

    beforeEach(() => {
      instance = new SessionManager();
      instance.listen();
    });

    afterEach(async () => {
      instance.unlisten();
    });

    it('removes existing cookie', async () => {
      const created = await instance.setCookie({
        url: curl,
        name,
        value,
      });
      await instance.removeCookie(created);
      const cookies = await instance.session.get({});
      assert.lengthOf(cookies, 0);
    });

    it('removes renderer based cookie', async () => {
      const cookie = {
        created: Date.now(),
        domain: 'qax.anypoint.mulesoft.com',
        expirationDate: 8640000000000,
        hostOnly: true,
        // httponly: null,
        lastAccess: 1580162723841,
        name: '_csrf',
        path: '/',
        persistent: false,
        value: 'GwjXpexHYiv22J9Bd7NUF-4c',
        url: 'http://qax.anypoint.mulesoft.com',
      };
      await instance.setCookie(cookie);
      await instance.removeCookie({
        url: 'http://qax.anypoint.mulesoft.com/',
        name: '_csrf',
      });
      const cookies = await instance.session.get({});
      assert.lengthOf(cookies, 0);
    });
  });

  describe('getUrlCookies()', () => {
    let instance = /** @type SessionManager */ (null);
    before(async () => {
      await cleanCookies();
      await createTestCookies();
    });

    after(async () => {
      await cleanCookies();
    });

    beforeEach(() => {
      instance = new SessionManager();
      instance.listen();
    });

    afterEach(() => {
      instance.unlisten();
    });

    it('Reads url cookies with getUrlCookies()', async () => {
      const cookies = await instance.getUrlCookies('https://other.com');
      assert.lengthOf(cookies, 1);
    });
  });

  describe('getAllCookies()', () => {
    let instance = /** @type SessionManager */ (null);

    beforeEach(() => {
      instance = new SessionManager();
      instance.listen();
    });

    afterEach(async () => {
      instance.unlisten();
      await cleanCookies();
    });

    it('reads all cookies', async () => {
      await createTestCookies();
      const cookies = await instance.getAllCookies();
      assert.lengthOf(cookies, 2);
    });

    it('returns empty array when no cookies', async () => {
      const cookies = await instance.getAllCookies();
      assert.lengthOf(cookies, 0);
    });
  });

  describe('getDomainCookies()', () => {
    let instance = /** @type SessionManager */ (null);

    beforeEach(() => {
      instance = new SessionManager();
      instance.listen();
    });

    afterEach(async () => {
      instance.unlisten();
      await cleanCookies();
    });

    it('reads domain cookies', async () => {
      await createTestCookies();
      const cookies = await instance.getDomainCookies('other.com');
      assert.lengthOf(cookies, 1);
    });

    it('returns empty array when no cookies', async () => {
      const cookies = await instance.getDomainCookies('abc.xyz');
      assert.lengthOf(cookies, 0);
    });

    it('returns empty array when no domain cookies', async () => {
      await createTestCookies();
      const cookies = await instance.getDomainCookies('abc.xyz');
      assert.lengthOf(cookies, 0);
    });
  });

  describe('getUrlCookies()', () => {
    let instance = /** @type SessionManager */ (null);

    beforeEach(() => {
      instance = new SessionManager();
      instance.listen();
    });

    afterEach(async () => {
      instance.unlisten();
      await cleanCookies();
    });

    it('reads cookies by the URL', async () => {
      await createTestCookies();
      const cookies = await instance.getUrlCookies('https://other.com');
      assert.lengthOf(cookies, 1);
    });

    it('returns empty array when no cookies', async () => {
      const cookies = await instance.getUrlCookies('https://other.com');
      assert.lengthOf(cookies, 0);
    });

    it('returns empty array when no URL cookies', async () => {
      await createTestCookies();
      const cookies = await instance.getUrlCookies('https://others.xyz');
      assert.lengthOf(cookies, 0);
    });
  });

  describe('removeCookieMakeUrl()', () => {
    let instance = /** @type SessionManager */ (null);

    beforeEach(() => {
      instance = new SessionManager();
      instance.listen();
    });

    afterEach(async () => {
      instance.unlisten();
      await cleanCookies();
    });

    it('removes a cookie', async () => {
      await createTestCookies();
      const cookiesPre = await instance.getAllCookies();
      assert.lengthOf(cookiesPre, 2);
      await instance.removeCookieMakeUrl({
        domain: 'domain.com',
        name: 't1',
        value: 'v1',
        sameSite: 'unspecified',
      }, 't1');
      const cookies = await instance.getAllCookies();
      assert.notEqual(cookies.length, cookiesPre.length);
    });
  });

  describe('openWebBrowser()', () => {
    let instance = /** @type SessionManager */ (null);
    const loc = 'about:blank';

    beforeEach(() => {
      instance = new SessionManager();
    });

    it('returns the browser URL', async () => {
      const result = instance.openWebBrowser(loc);
      assert.equal(result.constructor.name, 'BrowserWindow');
      result.close();
    });

    it('has the user agent set', async () => {
      const result = instance.openWebBrowser(loc);
      assert.equal(result.webContents.userAgent, 'Chrome');
      result.close();
    });
  });
});
