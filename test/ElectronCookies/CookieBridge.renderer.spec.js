/* eslint-disable prefer-destructuring */
/* eslint-disable import/no-commonjs */

const { assert } = require('chai');
const _require = require('esm')(module);

const { CookieBridge } = _require('../../src/preload/CookieBridge');
const ArcEvents = _require('@advanced-rest-client/arc-events');
const { DataGenerator } = require('./Generator.js');

/** @typedef {import('@advanced-rest-client/arc-events').SessionCookieEvents} SessionCookieEventsType */
/** @typedef {import('@advanced-rest-client/arc-types').Cookies.ARCCookie} ARCCookie */

const SessionCookieEvents = /** @type SessionCookieEventsType */ (ArcEvents.SessionCookieEvents);

describe('CookieBridge - renderer process', () => {
  const generator = new DataGenerator();

  /**
   * @param {CookieBridge} instance
   */
  async function removeAllCookies(instance) {
    const cookies = await instance.getAllCookies();
    if (cookies.length) {
      await instance.removeCookies(cookies);
    }
  }

  describe('getAllCookies()', () => {
    let instance = /** @type CookieBridge */ (null);

    beforeEach(async () => {
      instance = new CookieBridge();
    });

    afterEach(async () => {
      await removeAllCookies(instance);
    });

    it('reads all cookies', async () => {
      const cookies = generator.generateCookiesData({ size: 10 });
      await instance.updateCookies(cookies);
      const result = await instance.getAllCookies();
      assert.lengthOf(result, 10);
    });

    it('returns empty array when no cookies', async () => {
      const result = await instance.getAllCookies();
      assert.lengthOf(result, 0);
    });

    it('has no expired cookies', async () => {
      const cookie = generator.generateCookieObject();
      cookie.expires = Date.now() - 1000;
      delete cookie.maxAge;
      await instance.updateCookies([cookie]);
      const result = await instance.getAllCookies();
      assert.lengthOf(result, 0);
    });
  });

  describe('getDomainCookies()', () => {
    let instance = /** @type CookieBridge */ (null);

    beforeEach(async () => {
      instance = new CookieBridge();
    });

    afterEach(async () => {
      await removeAllCookies(instance);
    });

    it('reads cookies for the domain', async () => {
      const cookies = generator.generateCookiesData({ size: 5 });
      await instance.updateCookies(cookies);
      const result = await instance.getDomainCookies(cookies[0].domain);
      assert.lengthOf(result, 1);
    });

    it('returns empty array when no cookies', async () => {
      const result = await instance.getDomainCookies('api.com');
      assert.lengthOf(result, 0);
    });

    it('returns empty array when no domain cookies', async () => {
      const cookies = generator.generateCookiesData({ size: 5 });
      await instance.updateCookies(cookies);
      const result = await instance.getDomainCookies('api.com');
      assert.lengthOf(result, 0);
    });
  });

  describe('removeCookies()', () => {
    let instance = /** @type CookieBridge */ (null);

    beforeEach(async () => {
      instance = new CookieBridge();
    });

    afterEach(async () => {
      await removeAllCookies(instance);
    });

    it('removes a cookie', async () => {
      const cookie = generator.generateCookieObject();
      await instance.updateCookie(cookie);
      await instance.removeCookies([cookie]);
      const result = await instance.getAllCookies();
      assert.lengthOf(result, 0);
    });

    it('does nothing when cookie does not exist', async () => {
      const cookie = generator.generateCookieObject();
      await instance.removeCookies([cookie]);
    });
  });

  describe('Events based tests', () => {
    async function createTestCookies() {
      const c1 = {
        name: 'test-name',
        value: 'test-value',
        url: 'http://api.domain.com',
        domain: 'api.domain.com', 
        path: '/',
      };
      const c2 = {
        name: 'test2',
        value: 'test2',
        url: 'http://other.com',
        domain: 'other.com', 
        path: '/',
      };
      await SessionCookieEvents.update(document.body, c1);
      await SessionCookieEvents.update(document.body, c2);
    }

    async function removeTestCookies() {
      const cookies = [{
        name: 'test-name',
        url: 'http://api.domain.com',
        domain: 'api.domain.com', 
        path: '/',
      }, {
        name: 'test2',
        url: 'http://other.com',
        domain: 'other.com', 
        path: '/',
      }];
      await SessionCookieEvents.delete(document.body, cookies);
    }

    let instance = /** @type CookieBridge */ (null);
    before(() => {
      instance = new CookieBridge();
      instance.listen();
    });

    after(() => {
      instance.unlisten();
    });

    describe('session-cookie-list-all', () => {
      before(() => createTestCookies());
      after(() => removeTestCookies());

      it('returns all cookies', async () => {
        const result = await SessionCookieEvents.listAll(document.body);
        assert.typeOf(result, 'array', 'returns an array');
        assert.lengthOf(result, 2, 'has all created cookies');
      });
    });

    describe('domain cookie list', () => {
      before(() => createTestCookies());
      after(() => removeTestCookies());

      it('returns domain cookies', async () => {
        const result = await SessionCookieEvents.listDomain(document.body, 'other.com');
        assert.typeOf(result, 'array', 'returns an array');
        assert.lengthOf(result, 1, 'has single cookie');
        assert.equal(result[0].domain, '.other.com', 'has a domain cookie');
      });
    });

    describe('updating a cookie', () => {
      afterEach(() => removeAllCookies(instance));

      it('persists the cookie in the store', async () => {
        await SessionCookieEvents.update(document.body, {
          name: 'test',
          value: 'test',
          path: '/',
          domain: 'domain.com',
        });
        const cookies = await instance.getAllCookies();
        const [cookie] = cookies;
        // @ts-ignore
        delete cookie.created;
        // @ts-ignore
        delete cookie.lastAccess;
        // @ts-ignore
        delete cookie.persistent;
        assert.deepEqual(cookies[0], {
          domain: '.domain.com',
          // hostOnly: true,
          httpOnly: false,
          name: 'test',
          path: '/',
          secure: false,
          session: true,
          value: 'test',
          expires: 0,
          hostOnly: false,
        });
      });
    });

    describe('session-cookie-remove', () => {
      before(() => createTestCookies());
      after(() => removeTestCookies());

      it('removes a cookie', async () => {
        await SessionCookieEvents.delete(document.body, [{
          name: 'test-name',
          value: 'test-value',
          // url: 'http://api.domain.com',
          domain: 'api.domain.com',
          path: '/',
        }]);
        const result = await instance.getDomainCookies('api.domain.com');
        assert.lengthOf(result, 0);
      });
    });
  });

  describe('class APIs', () => {
    describe('updateCookie()', () => {
      let instance = /** @type CookieBridge */ (null);
      let cookie = /** @type ARCCookie */ (null);
      beforeEach(() => {
        instance = new CookieBridge();
        cookie = {
          name: `test-cookie`,
          value: 'test',
          // url: `http://api.domain.com`,
          domain: 'api.domain.com',
          path: '/',
          expires: Date.now() + 2000,
          httpOnly: false,
          secure: false,
          hostOnly: false,
        };
      });

      afterEach(async () => {
        await removeAllCookies(instance);
      });

      it('returns created cookie', async () => {
        const expires = Math.round(cookie.expires / 1000);
        const result = await instance.updateCookie(cookie);
        assert.deepEqual(result, {
          domain: 'api.domain.com',
          path: '/',
          expirationDate: expires,
          httpOnly: false,
          hostOnly: false,
          name: cookie.name,
          secure: false,
          url: `http://api.domain.com/`,
          value: 'test',
        });
      });

      it('stores the cookie in the data store', async () => {
        const expires = Math.round(cookie.expires / 1000);
        await instance.updateCookie(cookie);
        const cookies = await instance.getAllCookies();
        const [item] = cookies;
        // @ts-ignore
        delete item.created;
        // @ts-ignore
        delete item.lastAccess;
        // @ts-ignore
        delete item.persistent;
        assert.deepEqual(item, {
          domain: '.api.domain.com',
          expires: expires * 1000,
          hostOnly: false,
          httpOnly: false,
          name: cookie.name,
          path: '/',
          secure: false,
          session: false,
          value: 'test',
        });
      });
    });

    describe('updateCookies()', () => {
      let instance = /** @type CookieBridge */ (null);
      let cookies = /** @type ARCCookie[] */ (null);
      beforeEach(() => {
        instance = new CookieBridge();
        cookies = [
          {
            name: `test-cookie1`,
            value: 'test',
            // url: `http://api.domain.com`,
            domain: 'api.domain.com',
            path: '/',
            expires: Date.now() + 2000,
            httpOnly: false,
          },
          {
            name: `test-cookie2`,
            value: 'test',
            // url: `http://other.com`,
            domain: 'other.com',
            path: '/',
            expires: Date.now() + 2000,
            httpOnly: false,
          },
        ];
      });

      afterEach(async () => {
        await removeAllCookies(instance);
      });

      it('stores created cookies in the data store', async () => {
        await instance.updateCookies(cookies);
        const all = await instance.getAllCookies();
        assert.lengthOf(all, 2);
      });
    });

    describe('removeCookies()', () => {
      let instance = /** @type CookieBridge */ (null);
      let cookies = /** @type ARCCookie[] */ (null);
      beforeEach(async () => {
        instance = new CookieBridge();
        cookies = [
          {
            name: `test-cookie1`,
            value: 'test',
            // url: `http://api.domain.com`,
            domain: 'api.domain.com',
            path: '/',
            expires: Date.now() + 2000,
            httpOnly: false,
          },
          {
            name: `test-cookie2`,
            value: 'test',
            // url: `http://other.com`,
            domain: 'other.com',
            path: '/',
            expires: Date.now() + 2000,
            httpOnly: false,
          },
        ];
        await instance.updateCookies(cookies);
      });

      afterEach(async () => {
        await removeAllCookies(instance);
      });

      it('removes all passed cookies', async () => {
        await instance.removeCookies(cookies);
        const all = await instance.getAllCookies();
        assert.lengthOf(all, 0);
      });

      it('removes only passed cookies', async () => {
        await instance.removeCookies([cookies[0]]);
        const all = await instance.getAllCookies();
        assert.lengthOf(all, 1);
        assert.equal(all[0].name, 'test-cookie2');
      });
    });

    describe('getDomainCookies()', () => {
      let instance = /** @type CookieBridge */ (null);
      let cookies = /** @type ARCCookie[] */ (null);
      beforeEach(async () => {
        instance = new CookieBridge();
        cookies = [
          {
            name: 'test-cookie1',
            value: 'test',
            // url: 'http://api.domain.com',
            expires: Date.now() + 2000,
            httpOnly: false,
            domain: 'api.domain.com',
            path: '/',
          },
          {
            name: `test-cookie2`,
            value: 'test',
            // url: `http://other.com`,
            expires: Date.now() + 2000,
            httpOnly: false,
            domain: 'other.com',
            path: '/'
          },
        ];
        await instance.updateCookies(cookies);
      });

      afterEach(async () => {
        await removeAllCookies(instance);
      });

      it('reads all cookies', async () => {
        const result = await instance.getDomainCookies('api.domain.com');
        assert.lengthOf(result, 1);
      });
    });
  });
});
