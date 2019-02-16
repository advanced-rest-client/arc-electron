const {assert} = require('chai');
const {ArcWindowsManager} = require('../../../scripts/main/windows-manager.js');
const {ArcSessionRecorder} = require('../../../scripts/main/arc-session-recorder');
const {ContextActions} = require('../../../scripts/packages/context-actions/main');
const {BrowserWindow} = require('electron');

describe.only('ArcWindowsManager', function() {
  describe('constructor()', function() {
    it('Sets default startupOptions', function() {
      const instance = new ArcWindowsManager();
      assert.typeOf(instance.startupOptions, 'object');
      assert.lengthOf(Object.keys(instance.startupOptions), 0);
    });

    it('Sets passed startupOptions', function() {
      const opts = {startPath: 'test'};
      const instance = new ArcWindowsManager(opts);
      assert.deepEqual(instance.startupOptions, opts);
    });

    it('Sets windows array', () => {
      const instance = new ArcWindowsManager();
      assert.lengthOf(instance.windows, 0);
    });

    it('Sets ArcSessionRecorder', () => {
      const instance = new ArcWindowsManager();
      assert.isTrue(instance.recorder instanceof ArcSessionRecorder);
    });

    it('Sets ContextActions', () => {
      const instance = new ArcWindowsManager();
      assert.isTrue(instance.contextActions instanceof ContextActions);
    });
  });

  describe('get hasWindow()', () => {
    let instance;
    before(() => {
      instance = new ArcWindowsManager();
    });

    it('Returns false when no windows', () => {
      assert.isFalse(instance.hasWindow);
    });

    it('Returns true when has a window', () => {
      instance.windows = [{}];
      assert.isTrue(instance.hasWindow);
    });
  });

  describe('get lastFocused()', () => {
    let instance;
    before(() => {
      instance = new ArcWindowsManager();
    });

    it('Returns undefined when no focused window', () => {
      assert.isUndefined(instance.lastFocused);
    });

    it('Returns undefined when the window has been destroyed', () => {
      instance._lastFocused = {
        isDestroyed: () => true
      };
      assert.isUndefined(instance.lastFocused);
    });

    it('Returns window instance', () => {
      instance._lastFocused = {
        isDestroyed: () => false
      };
      assert.deepEqual(instance.lastFocused, instance._lastFocused);
    });
  });

  describe('get lastActive()', () => {
    let instance;
    before(() => {
      instance = new ArcWindowsManager();
    });

    it('Returns undefined when no windows', () => {
      assert.isUndefined(instance.lastActive);
    });

    it('Returns undefined when no active windows', () => {
      instance.windows = [{
        isDestroyed: () => true
      }, {
        isDestroyed: () => true
      }];
      assert.isUndefined(instance.lastActive);
    });

    it('Returns window instance', () => {
      instance.windows = [{
        isDestroyed: () => true
      }, {
        isDestroyed: () => false
      }];
      assert.deepEqual(instance.lastActive, instance.windows[1]);
    });
  });

  describe('open()', () => {
    let instance;
    before(() => {
      instance = new ArcWindowsManager();
    });

    it('Returns window instance', () => {
      return instance.open()
      .then((win) => {
        assert.isTrue(win instanceof BrowserWindow);
        win.destroy();
      });
    });

    it('Sets __arcSession on the window', () => {
      return instance.open()
      .then((win) => {
        win.destroy();
        assert.ok(win.__arcSession);
      });
    });

    it('Sets __arcIndex on the window', () => {
      return instance.open()
      .then((win) => {
        win.destroy();
        assert.equal(win.__arcIndex, 0);
      });
    });

    it('Adds window to the list of windows', () => {
      return instance.open()
      .then((win) => {
        assert.notEqual(instance.windows.indexOf(win), -1);
        win.destroy();
      });
    });

    it('Removes window from the list when destroyed', () => {
      return instance.open()
      .then((win) => {
        win.destroy();
        assert.equal(instance.windows.indexOf(win), -1);
      });
    });
  });

  describe.only('__getNewWindow()', () => {
    let instance;
    let session;
    before(() => {
      instance = new ArcWindowsManager();
      session = {
        size: {
          width: 100,
          height: 200
        },
        position: {
          x: 10,
          y: 20
        }
      };
    });

    it('Creates BrowserWindow instance', () => {
      const result = instance.__getNewWindow(0, session);
      assert.isTrue(result instanceof BrowserWindow);
      result.destroy();
    });
  });
});
