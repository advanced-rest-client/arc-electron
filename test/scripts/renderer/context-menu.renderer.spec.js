const {assert} = require('chai');
const {ArcContextMenu} = require('../../../scripts/renderer/context-menu.js');
const sinon = require('sinon');

describe.only('ArcContextMenu', function() {
  before(function() {
    const app = document.createElement('div');
    app.id = 'app';
    app.closeWorkspaceTabCalledCount = 0;
    app.closeWorkspaceTab = function() {
      app.closeWorkspaceTabCalledCount++;
    };
    app.closeAllWorkspaceTabsCalledCount = 0;
    app.closeAllWorkspaceTabs = function() {
      app.closeAllWorkspaceTabsCalledCount++;
    };
    app.closeOtherWorkspaceTabsCalledCount = 0;
    app.closeOtherWorkspaceTabs = function() {
      app.closeOtherWorkspaceTabsCalledCount++;
    };
    app.duplicateWorkspaceTabCalledCount = 0;
    app.duplicateWorkspaceTab = function() {
      app.duplicateWorkspaceTabCalledCount++;
    };
    document.body.appendChild(app);
  });

  describe('listenMainEvents()', () => {
    let instance;
    before(function() {
      instance = new ArcContextMenu();
    });

    it('Registers contextmenu listener', () => {
      const stub = sinon.stub(instance, '_contextMenuHandler');
      instance.listenMainEvents();
      const e = new MouseEvent('contextmenu', {
        bubbles: true,
        clientX: 100,
        clientY: 100
      });
      document.body.dispatchEvent(e);
      assert.isTrue(stub.called);
    });

    it('Registers click listener', () => {
      const stub = sinon.stub(instance, '_clickHandler');
      instance.listenMainEvents();
      const e = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true,
        clientX: 100,
        clientY: 100
      });
      document.body.dispatchEvent(e);
      assert.isTrue(stub.called);
    });
  });

  describe('app()', () => {
    let instance;
    before(function() {
      instance = new ArcContextMenu();
    });

    it('Returns an element', () => {
      const result = instance.app;
      assert.ok(result);
    });
  });

  describe('_valid()', function() {
    let instance;
    before(function() {
      instance = new ArcContextMenu();
    });

    it('Returns false if no argument', () => {
      const result = instance._valid();
      assert.isFalse(result);
    });

    it('Returns false if no label', () => {
      const result = instance._valid({
        selector: 'a',
        action: 'test'
      });
      assert.isFalse(result);
    });

    it('Returns false if no selector', () => {
      const result = instance._valid({
        label: 'a',
        action: 'test'
      });
      assert.isFalse(result);
    });

    it('Returns false if no action', () => {
      const result = instance._valid({
        label: 'a',
        selector: 'a',
      });
      assert.isFalse(result);
    });

    it('Returns true when valid', () => {
      const result = instance._valid({
        label: 'a',
        selector: 'a',
        action: 'test'
      });
      assert.isTrue(result);
    });
  });
});
