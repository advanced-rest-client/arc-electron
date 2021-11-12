const { assert } = require('chai');
const path = require('path');
const fs = require('fs-extra');
const sinon = require('sinon');
const { Menu } = require('electron');
const _require = require('esm')(module);
const testPaths = require('../setup-paths.js');

const { ApplicationMenu, clearWorkspaceHistory, appendHistoryEntry, createWorkspaceHistory, workspaceHistoryAction } = _require('../../src/io/ApplicationMenu');
const { ApplicationUpdater } = _require('../../src/io/ApplicationUpdater');
const { setLevel } = _require('../../src/io/Logger');

/** @typedef {import('../../src/io/ApplicationMenu').ApplicationMenu} ApplicationMenu */
/** @typedef {import('../../src/io/ApplicationUpdater').ApplicationUpdater} ApplicationUpdater */

setLevel('error');

describe('ApplicationMenu class', () => {
  const historyPath = path.join('workspace', 'workspace-history.json');
  let updater = /** @type ApplicationUpdater */ (null);
  before(() => {
    testPaths.getBasePath();
    updater = new ApplicationUpdater();
  });

  after(() => {
    updater.removeAllListeners('status-changed');
  });

  describe('Constructor', () => {
    afterEach(() => {
      updater.removeAllListeners('status-changed');
    });
    
    it('Sets topMenu', () => {
      const instance = new ApplicationMenu(updater);
      assert.ok(instance.topMenu);
    });

    it('Sets history', () => {
      const instance = new ApplicationMenu(updater);
      assert.typeOf(instance.history, 'object');
    });
  });

  describe('build()', () => {
    let instance = /** @type ApplicationMenu */ (null);
    beforeEach(() => {
      instance = new ApplicationMenu(updater);
    });

    afterEach(() => {
      updater.removeAllListeners('status-changed');
    });

    it('calls getTemplate()', async () => {
      const spy = sinon.spy(instance, 'getTemplate');
      await instance.build();
      assert.isTrue(spy.called);
    });

    it('calls createFromTemplate()', async () => {
      const spy = sinon.spy(instance, 'createFromTemplate');
      await instance.build();
      assert.isTrue(spy.called);
    });

    it('sets menuLoaded', async () => {
      await instance.build();
      assert.isTrue(instance.menuLoaded);
    });

    it('sets application menu', async () => {
      await instance.build()
      const menu = Menu.getApplicationMenu();
      assert.ok(menu);
      assert.isAbove(menu.items.length, 5);
    });
  });

  describe('appendWorkspaceHistory()', () => {
    let instance = /** @type ApplicationMenu */ (null);
    beforeEach(() => {
      instance = new ApplicationMenu(updater);
      return instance.build();
    });

    afterEach(() => {
      updater.removeAllListeners('status-changed');
      const file = path.join(process.env.ARC_HOME, historyPath);
      return fs.remove(file);
    });

    it('calls WorkspaceHistory::addEntry', async () => {
      const spy = sinon.spy(instance.history, 'addEntry');
      await instance.appendWorkspaceHistory('/test');
      assert.isTrue(spy.called);
    });

    it('calls [appendHistoryEntry]', async () => {
      const spy = sinon.spy(instance, appendHistoryEntry);
      await instance.appendWorkspaceHistory('/test');
      assert.isTrue(spy.called);
    });
  });

  describe('clearWorkspaceHistory()', () => {
    let instance = /** @type ApplicationMenu */ (null);
    beforeEach(() => {
      instance = new ApplicationMenu(updater);
      return instance.build();
    });

    afterEach(() => {
      updater.removeAllListeners('status-changed');
      const file = path.join(process.env.ARC_HOME, historyPath);
      return fs.remove(file);
    });

    it('calls WorkspaceHistory::clearHistory', async () => {
      const spy = sinon.spy(instance.history, 'clearHistory');
      await instance.clearWorkspaceHistory()
      assert.isTrue(spy.called);
    });

    it('calls [clearWorkspaceHistory]', async () => {
      const spy = sinon.spy(instance, clearWorkspaceHistory);
      await instance.clearWorkspaceHistory();
      assert.isTrue(spy.called);
    });
  });

  describe('loadWorkspaceHistory()', () => {
    let instance = /** @type ApplicationMenu */ (null);
    beforeEach(() => {
      instance = new ApplicationMenu(updater);
      return instance.build();
    });

    afterEach(() => {
      updater.removeAllListeners('status-changed');
      const file = path.join(process.env.ARC_HOME, historyPath);
      return fs.remove(file);
    });

    it('calls WorkspaceHistory::loadEntries', async () => {
      const spy = sinon.spy(instance.history, 'loadEntries');
      await instance.loadWorkspaceHistory();
      assert.isTrue(spy.called);
    });

    it('does not call [createWorkspaceHistory] when no entires', async () => {
      const spy = sinon.spy(instance, createWorkspaceHistory);
      await instance.loadWorkspaceHistory();
      assert.isFalse(spy.called);
    });

    it('calls [createWorkspaceHistory] when has entires', async () => {
      const file = path.join(process.env.ARC_HOME, historyPath);
      const spy = sinon.spy(instance, createWorkspaceHistory);
      await fs.outputJson(file, {
        entries: [{
          file: '/1',
          used: 1
        }, {
          file: '/2',
          used: 2
        }]
      });
      await instance.loadWorkspaceHistory();
      assert.isTrue(spy.called);
    });
  });

  describe('[createWorkspaceHistory]()', () => {
    let instance = /** @type ApplicationMenu */ (null);
    beforeEach(() => {
      instance = new ApplicationMenu(updater);
      return instance.build();
    });

    afterEach(() => {
      updater.removeAllListeners('status-changed');
    });

    it('calls [appendHistoryEntry] for each entry', () => {
      const entries = [{
        file: '/1',
        used: 1
      }, {
        file: '/2',
        used: 2
      }];
      const spy = sinon.spy(instance, appendHistoryEntry);
      instance[createWorkspaceHistory](entries);
      assert.equal(spy.callCount, 2);
    });

    it('ignores invalid entires', () => {
      const entries = [{
        file: 1,
        used: 1
      }, {
        file: '/2',
        used: 2
      }];
      const spy = sinon.spy(instance, appendHistoryEntry);
      instance[createWorkspaceHistory](entries);
      assert.equal(spy.callCount, 1);
    });
  });

  describe('getWorkspaceHistoryMenu()', () => {
    let instance = /** @type ApplicationMenu */ (null);
    beforeEach(() => {
      instance = new ApplicationMenu(updater);
      return instance.build();
    });

    afterEach(() => {
      updater.removeAllListeners('status-changed');
    });

    it('Returns the menu', () => {
      const result = instance.getWorkspaceHistoryMenu();
      assert.isTrue(result instanceof Menu);
    });
  });

  describe('[appendHistoryEntry]()', () => {
    let instance = /** @type ApplicationMenu */ (null);
    beforeEach(() => {
      instance = new ApplicationMenu(updater);
      return instance.build();
    });

    afterEach(() => {
      updater.removeAllListeners('status-changed');
    });

    it('Adds menu item', () => {
      instance[appendHistoryEntry]('/1');
      const menu = instance.getWorkspaceHistoryMenu();
      assert.equal(menu.items[3].label, '/1');
    });

    it('Hides 3rd menu item', () => {
      instance[appendHistoryEntry]('/1');
      const menu = instance.getWorkspaceHistoryMenu();
      assert.isFalse(menu.items[2].visible);
    });
  });

  describe('[workspaceHistoryAction]()', () => {
    let instance = /** @type ApplicationMenu */ (null);
    beforeEach(() => {
      instance = new ApplicationMenu(updater);
      return instance.build();
    });

    afterEach(() => {
      updater.removeAllListeners('status-changed');
      const file = path.join(process.env.ARC_HOME, historyPath);
      return fs.remove(file);
    });

    it('Calls WorkspaceHistory::addEntry', () => {
      const spy = sinon.spy(instance.history, 'addEntry');
      instance[workspaceHistoryAction]({ label: '/test' });
      assert.equal(spy.args[0][0], '/test');
    });

    it('Emits open-workspace event', () => {
      let called = false;
      instance.on('open-workspace', () => {
        called = true;
      });
      instance[workspaceHistoryAction]({ label: '/test' });
      instance.removeAllListeners('open-workspace');
      assert.isTrue(called);
    });
  });
});
