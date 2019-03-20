const {assert} = require('chai');
const {ArcContextMenu} = require('../renderer');
const sinon = require('sinon');

describe('ArcContextMenu', function() {
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

    const target = document.createElement('p');
    target.className = 'target-class';
    document.body.appendChild(target);

    const nonTarget = document.createElement('p');
    nonTarget.className = 'non-target-class';
    document.body.appendChild(nonTarget);
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
        selector: 'a'
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

  describe('addAction()', () => {
    let instance;
    before(function() {
      instance = new ArcContextMenu();
    });

    it('Registers valid action', () => {
      const action = {
        label: 'a',
        selector: 'b',
        action: 'c'
      };
      instance.addAction(action);
      assert.lengthOf(instance.contextActions, 1);
      assert.deepEqual(instance.contextActions[0], action);
    });

    it('Throws error when no argument', () => {
      assert.throws(() => {
        instance.addAction();
      });
    });

    it('Throws error when argument is invalid', () => {
      assert.throws(() => {
        instance.addAction({
          label: 'a',
          selector: 'a'
        });
      });
    });
  });

  describe('removeAction()', () => {
    let instance;
    before(function() {
      instance = new ArcContextMenu();
    });

    const action = {
      label: 'a',
      selector: 'b',
      action: 'c'
    };

    it('Removes previously registered action - object argument', () => {
      instance.addAction(action);
      assert.lengthOf(instance.contextActions, 1);
      instance.removeAction(action);
      assert.lengthOf(instance.contextActions, 0);
    });

    it('Removes previously registered action - string argument', () => {
      instance.addAction(action);
      assert.lengthOf(instance.contextActions, 1);
      instance.removeAction(action.action);
      assert.lengthOf(instance.contextActions, 0);
    });

    it('Returns true if the action is removed', () => {
      instance.addAction(action);
      assert.lengthOf(instance.contextActions, 1);
      const result = instance.removeAction(action.action);
      assert.isTrue(result);
    });

    it('Returns false if the action is not removed', () => {
      const result = instance.removeAction(action.action);
      assert.isFalse(result);
    });

    it('Throws error when no argument', () => {
      assert.throws(() => {
        instance.removeAction();
      });
    });

    it('Throws error when argument is invalid', () => {
      assert.throws(() => {
        instance.removeAction({
          label: 'a',
          selector: 'a'
        });
      });
    });
  });

  describe('_contextMenuHandler()', () => {
    let instance;
    beforeEach(function() {
      instance = new ArcContextMenu();
      instance.addAction({
        label: 'x',
        selector: '.target-class',
        action: 'test-action'
      });
    });

    after(() => {
      const nodes = document.body.querySelectorAll('paper-listbox');
      if (nodes.length) {
        for (let i = 0; i < nodes.length; i++) {
          nodes[i].parentNode.removeChild(nodes[i]);
        }
      }
    });

    function getTargetEvent() {
      return {
        composedPath: function() {
          return [document.body.querySelector('.target-class')];
        },
        x: 1,
        y: 2
      };
    }

    function getNonTargetEvent() {
      return {
        composedPath: function() {
          return [document.body.querySelector('.non-target-class')];
        },
        x: 1,
        y: 2
      };
    }

    function getNoTargetEvent() {
      return {
        composedPath: function() {
          return [];
        },
        x: 1,
        y: 2
      };
    }

    it('Calls renderActions() when event target matches action', () => {
      const stub = sinon.stub(instance, 'renderActions');
      instance._contextMenuHandler(getTargetEvent());
      assert.isTrue(stub.called);
      stub.restore();
    });

    it('renderActions() receives list of action', () => {
      let actions;
      instance.renderActions = (arg) => actions = arg;
      instance._contextMenuHandler(getTargetEvent());
      assert.typeOf(actions, 'array');
      assert.lengthOf(actions, 1);
    });

    it('renderActions() receives click location', () => {
      let pos;
      instance.renderActions = (v, arg) => pos = arg;
      instance._contextMenuHandler(getTargetEvent());
      assert.typeOf(pos, 'object');
      assert.equal(pos.x, 1);
      assert.equal(pos.y, 2);
    });

    it('Do not calls renderActions() when event target do not match', () => {
      const stub = sinon.stub(instance, 'renderActions');
      instance._contextMenuHandler(getNonTargetEvent());
      assert.isFalse(stub.called);
      stub.restore();
    });

    it('Do not calls renderActions() when no target', () => {
      const stub = sinon.stub(instance, 'renderActions');
      instance._contextMenuHandler(getNoTargetEvent());
      assert.isFalse(stub.called);
      stub.restore();
    });

    it('Sets _lastTarget property', () => {
      instance._contextMenuHandler(getTargetEvent());
      assert.ok(instance._lastTarget);
    });
  });

  describe('renderActions()', () => {
    let instance;
    const pos = {x: 1, y: 2};
    beforeEach(function() {
      instance = new ArcContextMenu();
    });

    afterEach(() => {
      const nodes = document.body.querySelectorAll('paper-listbox');
      if (nodes.length) {
        for (let i = 0; i < nodes.length; i++) {
          nodes[i].parentNode.removeChild(nodes[i]);
        }
      }
    });

    function getActions() {
      return [{
        label: 'aL',
        action: 'aA'
      }, {
        label: 'bL',
        action: 'bA'
      }];
    }

    it('Adds paper-listbox to the DOM', () => {
      instance.renderActions(getActions(), pos);
      const node = document.body.querySelector('paper-listbox');
      assert.ok(node);
    });

    it('Renders all actions', () => {
      instance.renderActions(getActions(), pos);
      const nodes = document.body.querySelectorAll('paper-listbox paper-item');
      assert.lengthOf(nodes, 2);
    });

    it('Sets data-action on action item', () => {
      instance.renderActions(getActions(), pos);
      const node = document.body.querySelector('paper-listbox paper-item');
      assert.equal(node.dataset.action, 'aA');
    });

    it('Renders item label', () => {
      instance.renderActions(getActions(), pos);
      const node = document.body.querySelector('paper-listbox paper-item');
      assert.equal(node.innerText, 'aL');
    });

    it('Sets _currentMenu porperty', () => {
      instance.renderActions(getActions(), pos);
      const node = document.body.querySelector('paper-listbox');
      assert.isTrue(node === instance._currentMenu);
    });

    it('Sets _currentActions porperty', () => {
      instance.renderActions(getActions(), pos);
      assert.deepEqual(instance._currentActions, getActions());
    });

    it('paper-listbox has global calss name', () => {
      instance.renderActions(getActions(), pos);
      assert.equal(instance._currentMenu.className, 'arc-context-menu');
    });

    it('paper-listbox has top position', () => {
      instance.renderActions(getActions(), pos);
      assert.equal(instance._currentMenu.style.top, '2px');
    });

    it('paper-listbox has left position', () => {
      instance.renderActions(getActions(), pos);
      assert.equal(instance._currentMenu.style.left, '1px');
    });

    it('Removes any previously added context menu', () => {
      instance.renderActions(getActions(), pos);
      instance.renderActions(getActions(), pos);
      const nodes = document.body.querySelectorAll('paper-listbox');
      assert.lengthOf(nodes, 1);
    });
  });

  describe('removeActions()', () => {
    let instance;
    const pos = {x: 1, y: 2};
    function getActions() {
      return [{
        label: 'aL',
        action: 'aA'
      }, {
        label: 'bL',
        action: 'bA'
      }];
    }

    beforeEach(function() {
      instance = new ArcContextMenu();
    });

    afterEach(() => {
      const node = document.body.querySelector('paper-listbox');
      if (node) {
        node.parentNode.removeChild(node);
      }
    });

    it('Does nothing when no menu', () => {
      assert.isUndefined(instance._currentMenu);
      instance.removeActions();
    });

    it('Removes context menu from the DOM', () => {
      instance.renderActions(getActions(), pos);
      instance.removeActions();
      const node = document.body.querySelector('paper-listbox');
      assert.notOk(node);
    });

    it('Removes _currentMenu property', () => {
      instance.renderActions(getActions(), pos);
      instance.removeActions();
      assert.isUndefined(instance._currentMenu);
    });

    it('Removes _currentActions property', () => {
      instance.renderActions(getActions(), pos);
      instance.removeActions();
      assert.isUndefined(instance._currentActions);
    });
  });
});
