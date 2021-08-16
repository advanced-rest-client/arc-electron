const { assert } = require('chai');
const { BrowserWindow } = require('electron');
const _require = require('esm')(module);
const testPaths = require('../setup-paths');

const { WindowsManager } = _require('../../src/io/WindowsManager');
const { ContextActions } = _require('../../src/io/ContextActions');
const { WindowsPersistance } = _require('../../src/io/WindowsPersistance');
const { setLevel } = _require('../../src/io/Logger');

/** @typedef {import('../../src/io/WindowsManager').WindowsManager} WindowsManager */
/** @typedef {import('../../src/io/ContextActions').ContextActions} ContextActions */
/** @typedef {import('../../src/io/WindowsPersistance').WindowsPersistance} WindowsPersistance */

setLevel('error');

describe('WindowsManager', () => {
  before(() => {
    testPaths.getBasePath();
    testPaths.setupEnvironment();
  });

  describe('constructor()', () => {
    it('sets the default startup options', () => {
      const instance = new WindowsManager();
      assert.typeOf(instance.startupOptions, 'object');
      assert.lengthOf(Object.keys(instance.startupOptions), 0);
    });

    it('sets passed startup options', () => {
      const opts = { startPath: 'test' };
      const instance = new WindowsManager(opts);
      assert.deepEqual(instance.startupOptions, opts);
    });

    it('sets the windows array property', () => {
      const instance = new WindowsManager();
      assert.lengthOf(instance.windows, 0);
    });

    it('Sets ContextActions', () => {
      const instance = new WindowsManager();
      assert.isTrue(instance.contextActions instanceof ContextActions);
    });

    it('sets the workspace property', () => {
      const instance = new WindowsManager();
      assert.isTrue(instance.workspace instanceof WindowsPersistance);
    });
  });

  describe('get hasWindow()', () => {
    let instance = /** @type WindowsManager */ (null);
    before(() => {
      instance = new WindowsManager();
    });

    it('Returns false when no windows', () => {
      assert.isFalse(instance.hasWindow);
    });

    it('Returns true when has a window', () => {
      // @ts-ignore
      instance.windows = [{}];
      assert.isTrue(instance.hasWindow);
    });
  });

  describe('get lastFocused()', () => {
    let instance = /** @type WindowsManager */ (null);
    before(() => {
      instance = new WindowsManager();
    });

    it('returns null when no focused window', () => {
      assert.equal(instance.lastFocused, null);
    });
  });

  describe('get lastActive()', () => {
    let instance = /** @type WindowsManager */ (null);
    before(() => {
      instance = new WindowsManager();
    });

    it('returns null when no windows', () => {
      assert.equal(instance.lastActive, null);
    });

    it('returns null when no active windows', () => {
      instance.windows = [
        // @ts-ignore
        {
          isDestroyed: () => true
        }, 
        // @ts-ignore
        {
          isDestroyed: () => true
        }
      ];
      assert.equal(instance.lastActive, null);
    });

    it('Returns window instance', () => {
      instance.windows = [
        // @ts-ignore
        {
          isDestroyed: () => true
        }, 
        // @ts-ignore
        {
          isDestroyed: () => false
        }
      ];
      assert.deepEqual(instance.lastActive, instance.windows[1]);
    });
  });

  describe('open()', () => {
    let instance = /** @type WindowsManager */ (null);
    before(() => {
      instance = new WindowsManager();
    });

    it('returns the window instance', async () => {
      const win = await instance.open();
      assert.isTrue(win instanceof BrowserWindow);
      win.destroy();
    });

    it('adds window to the list of windows', async () => {
      const win = await instance.open();
      assert.isTrue(instance.windows.includes(win));
      win.destroy();
    });

    it('removes window from the list when destroyed', async () => {
      const win = await instance.open();
      win.destroy();
      assert.isFalse(instance.windows.includes(win));
    });
  });
});
