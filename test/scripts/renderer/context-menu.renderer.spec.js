const {assert} = require('chai');
const {ArcContextMenu} = require('../../../scripts/renderer/context-menu.js');
const sinon = require('sinon');

describe.only('ArcContextMenu', function() {
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
  });
});
