const {assert} = require('chai');
const path = require('path');
const fs = require('fs-extra');
const {ArcMainMenu} = require('../scripts/main/main-menu.js');
const sinon = require('sinon');
const {Menu} = require('electron');

describe('ArcMainMenu class', function() {
  const historyPath = path.join('workspace', 'workspace-history.json');

  describe('Constructor', function() {
    it('Sets topMenu', function() {
      const instance = new ArcMainMenu();
      assert.ok(instance.topMenu);
    });

    it('Sets history', function() {
      const instance = new ArcMainMenu();
      assert.typeOf(instance.history, 'object');
    });
  });

  describe('build()', () => {
    let instance;
    beforeEach(() => {
      instance = new ArcMainMenu();
    });

    it('Returns a promise', () => {
      const result = instance.build();
      assert.typeOf(result, 'promise');
      return result;
    });

    it('Calls _getTemplate()', () => {
      const spy = sinon.spy(instance, '_getTemplate');
      return instance.build()
      .then(() => {
        assert.isTrue(spy.called);
      });
    });

    it('Calls _createFromTemplate()', () => {
      const spy = sinon.spy(instance, '_createFromTemplate');
      return instance.build()
      .then(() => {
        assert.isTrue(spy.called);
      });
    });

    it('Sets _menuLoaded', () => {
      return instance.build()
      .then(() => {
        assert.isTrue(instance._menuLoaded);
      });
    });

    it('Sets application menu', () => {
      return instance.build()
      .then(() => {
        const menu = Menu.getApplicationMenu();
        assert.ok(menu);
        assert.isAbove(menu.items.length, 5);
      });
    });

    it('Executes pendingActions', () => {
      instance.pendingActions = ['disableAppMenuPopup'];
      const spy = sinon.spy(instance, 'disableAppMenuPopup');
      return instance.build()
      .then(() => {
        assert.isTrue(spy.called);
      });
    });
  });

  describe('appendWorkspaceHistory()', () => {
    let instance;
    beforeEach(() => {
      instance = new ArcMainMenu();
      return instance.build();
    });

    afterEach(() => {
      const file = path.join(process.env.ARC_HOME, historyPath);
      return fs.remove(file);
    });

    it('Calls WorkspaceHistory::addEntry', () => {
      const spy = sinon.spy(instance.history, 'addEntry');
      return instance.appendWorkspaceHistory('/test')
      .then(() => {
        assert.isTrue(spy.called);
      });
    });

    it('Calls _appendHistoryEntry', () => {
      const spy = sinon.spy(instance, '_appendHistoryEntry');
      return instance.appendWorkspaceHistory('/test')
      .then(() => {
        assert.isTrue(spy.called);
      });
    });
  });

  describe('clearWorkspaceHistory()', () => {
    let instance;
    beforeEach(() => {
      instance = new ArcMainMenu();
      return instance.build();
    });

    afterEach(() => {
      const file = path.join(process.env.ARC_HOME, historyPath);
      return fs.remove(file);
    });

    it('Calls WorkspaceHistory::clearHistory', () => {
      const spy = sinon.spy(instance.history, 'clearHistory');
      return instance.clearWorkspaceHistory()
      .then(() => {
        assert.isTrue(spy.called);
      });
    });

    it('Calls _clearWorkspaceHistory', () => {
      const spy = sinon.spy(instance, '_clearWorkspaceHistory');
      return instance.clearWorkspaceHistory()
      .then(() => {
        assert.isTrue(spy.called);
      });
    });
  });

  describe('loadWorkspaceHistory()', () => {
    let instance;
    beforeEach(() => {
      instance = new ArcMainMenu();
      return instance.build();
    });

    afterEach(() => {
      const file = path.join(process.env.ARC_HOME, historyPath);
      return fs.remove(file);
    });

    it('Calls WorkspaceHistory::clearHistory', () => {
      const spy = sinon.spy(instance.history, 'loadEntries');
      return instance.loadWorkspaceHistory()
      .then(() => {
        assert.isTrue(spy.called);
      });
    });

    it('Does not call _createWorkspaceHistory when no entires', () => {
      const spy = sinon.spy(instance, '_createWorkspaceHistory');
      return instance.loadWorkspaceHistory()
      .then(() => {
        assert.isFalse(spy.called);
      });
    });

    it('Calls _createWorkspaceHistory when has entires', () => {
      const file = path.join(process.env.ARC_HOME, historyPath);
      const spy = sinon.spy(instance, '_createWorkspaceHistory');
      return fs.outputJson(file, {
        entries: [{
          file: '/1',
          used: 1
        }, {
          file: '/2',
          used: 2
        }]
      })
      .then(() => instance.loadWorkspaceHistory())
      .then(() => {
        assert.isTrue(spy.called);
      });
    });
  });

  describe('_createWorkspaceHistory()', () => {
    let instance;
    beforeEach(() => {
      instance = new ArcMainMenu();
      return instance.build();
    });

    it('Calls _appendHistoryEntry for each entry', () => {
      const entries = [{
        file: '/1',
        used: 1
      }, {
        file: '/2',
        used: 2
      }];
      const spy = sinon.spy(instance, '_appendHistoryEntry');
      instance._createWorkspaceHistory(entries);
      assert.equal(spy.callCount, 2);
    });

    it('Ignores invalid entires', () => {
      const entries = [{
        file: 1,
        used: 1
      }, {
        file: '/2',
        used: 2
      }];
      const spy = sinon.spy(instance, '_appendHistoryEntry');
      instance._createWorkspaceHistory(entries);
      assert.equal(spy.callCount, 1);
    });
  });

  describe('getWorkspaceHistoryMenu()', () => {
    let instance;
    beforeEach(() => {
      instance = new ArcMainMenu();
      return instance.build();
    });

    it('Returns the menu', () => {
      const result = instance.getWorkspaceHistoryMenu();
      assert.isTrue(result instanceof Menu);
    });
  });

  describe('_appendHistoryEntry()', () => {
    let instance;
    beforeEach(() => {
      instance = new ArcMainMenu();
      return instance.build();
    });

    it('Adds menu item', () => {
      instance._appendHistoryEntry('/1');
      const menu = instance.getWorkspaceHistoryMenu();
      assert.equal(menu.items[3].label, '/1');
    });

    it('Hiddes 3rd menu item', () => {
      instance._appendHistoryEntry('/1');
      const menu = instance.getWorkspaceHistoryMenu();
      assert.isFalse(menu.items[2].visible);
    });
  });

  describe('_workspaceHistoryAction()', () => {
    let instance;
    beforeEach(() => {
      instance = new ArcMainMenu();
      return instance.build();
    });

    afterEach(() => {
      const file = path.join(process.env.ARC_HOME, historyPath);
      return fs.remove(file);
    });

    it('Calls WorkspaceHistory::addEntry', () => {
      const spy = sinon.spy(instance.history, 'addEntry');
      instance._workspaceHistoryAction({label: '/test'});
      assert.equal(spy.args[0][0], '/test');
    });

    it('Emitts open-workspace event', () => {
      let called = false;
      instance.on('open-workspace', () => {
        called = true;
      });
      instance._workspaceHistoryAction({label: '/test'});
      instance.removeAllListeners('open-workspace');
      assert.isTrue(called);
    });
  });
});
