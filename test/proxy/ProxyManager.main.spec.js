const { assert } = require('chai');
const { session } = require('electron');
const _require = require('esm')(module);

/** @typedef {import('../../src/io/ProxyManager').ProxyManager} ProxyManager */

const { ProxyManager } = _require('../../src/io/ProxyManager.js');
const { MainWindowPersist } = _require('../../src/common/Constants.js');

describe('ProxyManager', () => {
  const proxyUrl = '192.168.1.10:8080';

  describe('constructor()', () => {
    /** @type ProxyManager */
    let instance;

    before(() => {
      instance = new ProxyManager();
    });

    it('sets the isArcConfigured property', () => {
      assert.isFalse(instance.isArcConfigured);
    });

    it('sets the isDefaultConfigured property', () => {
      assert.isFalse(instance.isDefaultConfigured);
    });
  });

  describe('#isConfigured', () => {
    /** @type ProxyManager */
    let instance;

    before(() => {
      instance = new ProxyManager();
    });

    it('is false when nothing is configured', () => {
      assert.isFalse(instance.isConfigured);
    });

    it('is true when isDefaultConfigured is set', () => {
      instance.isDefaultConfigured = true;
      assert.isTrue(instance.isConfigured);
    });

    it('is true when isArcConfigured is set', () => {
      instance.isArcConfigured = true;
      assert.isTrue(instance.isConfigured);
    });
  });

  describe('applyFromUrl()', () => {
    /** @type ProxyManager */
    let instance;

    before(() => {
      instance = new ProxyManager();
    });

    after(async () => {
      await instance.clearSettings();
    });

    it('applies proxy to the ARC main window session', async () => {
      await instance.applyFromUrl(proxyUrl);
      assert.isTrue(instance.isArcConfigured);
    });

    it('applies proxy to the default session', async () => {
      await instance.applyFromUrl(proxyUrl);
      assert.isTrue(instance.isDefaultConfigured);
    });

    it('has proxy on the ARC session', async () => {
      const ses = session.fromPartition(MainWindowPersist);
      const url = await ses.resolveProxy('https://google.com');
      assert.equal(url, `PROXY ${proxyUrl}`);
    });

    it('has proxy on the default session', async () => {
      const url = await session.defaultSession.resolveProxy('https://google.com');
      assert.equal(url, `PROXY ${proxyUrl}`);
    });

    it('sets the proxy username', async () => {
      await instance.applyFromUrl(proxyUrl, 'uname');
      const url = await session.defaultSession.resolveProxy('https://google.com');
      assert.equal(url, `PROXY ${proxyUrl}`);
      assert.equal(instance.currentUsername, 'uname');
    });

    it('sets the proxy password', async () => {
      await instance.applyFromUrl(proxyUrl, 'uname', 'passwd');
      const url = await session.defaultSession.resolveProxy('https://google.com');
      assert.equal(url, `PROXY ${proxyUrl}`);
      assert.equal(instance.currentPassword, 'passwd');
    });
  });

  describe('clearSettings()', () => {
    /** @type ProxyManager */
    let instance;

    beforeEach(async () => {
      instance = new ProxyManager();
      await instance.applyFromUrl(proxyUrl);
    });

    afterEach(async () => {
      await instance.clearSettings();
    });

    it('removes proxy from the ARC session', async () => {
      await instance.clearSettings();
      assert.isFalse(instance.isArcConfigured, 'isArcConfigured is set');
      const ses = session.fromPartition(MainWindowPersist);
      const url = await ses.resolveProxy('https://google.com');
      assert.equal(url, `DIRECT`);
    });

    it('removes proxy from the default session', async () => {
      await instance.clearSettings();
      assert.isFalse(instance.isDefaultConfigured, 'isDefaultConfigured is set');
      const url = await session.defaultSession.resolveProxy('https://google.com');
      assert.equal(url, `DIRECT`);
    });
  });

  describe('applyInitOptionsProxy()', () => {
    /** @type ProxyManager */
    let instance;

    beforeEach(async () => {
      instance = new ProxyManager();
    });

    afterEach(async () => {
      await instance.clearSettings();
    });

    it('ignores the settings when no --proxy-all', async () => {
      await instance.applyInitOptionsProxy({
        proxy: proxyUrl,
      });
      const url = await session.defaultSession.resolveProxy('https://google.com');
      assert.equal(url, `DIRECT`);
    });

    it('sets the proxy settings', async () => {
      await instance.applyInitOptionsProxy({
        proxy: proxyUrl,
        proxyAll: true,
      });
      const url = await session.defaultSession.resolveProxy('https://google.com');
      assert.equal(url, `PROXY ${proxyUrl}`);
    });

    it('sets the credentials', async () => {
      await instance.applyInitOptionsProxy({
        proxy: proxyUrl,
        proxyAll: true,
        proxyUsername: 'uname',
        proxyPassword: 'passwd',
      });
      const url = await session.defaultSession.resolveProxy('https://google.com');
      assert.equal(url, `PROXY ${proxyUrl}`);
      assert.equal(instance.currentUsername, 'uname');
      assert.equal(instance.currentPassword, 'passwd');
    });

    it('sets the credentials from the URL', async () => {
      await instance.applyInitOptionsProxy({
        proxy: `uname:passwd@${proxyUrl}`,
        proxyAll: true,
      });
      const url = await session.defaultSession.resolveProxy('https://google.com');
      assert.equal(url, `PROXY ${proxyUrl}`);
      assert.equal(instance.currentUsername, 'uname');
      assert.equal(instance.currentPassword, 'passwd');
    });
  });
});
