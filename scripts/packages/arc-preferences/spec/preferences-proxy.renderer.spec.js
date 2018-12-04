const assert = require('chai').assert;
const {ArcPreferencesProxy} = require('../renderer');

describe('ArcPreferencesProxy class - renderer process', function() {
  function fire(type, detail) {
    const e = new CustomEvent(type, {
      bubbles: true,
      cancelable: true,
      detail
    });
    document.body.dispatchEvent(e);
    return e;
  }
  describe('Read data web event handler', function() {
    let instance;
    beforeEach(() => {
      instance = new ArcPreferencesProxy();
      instance.observe();
    });

    afterEach(() => {
      instance.unobserve();
    });

    it('Handles the event', function() {
      const e = fire('settings-read', {});
      assert.isTrue(e.defaultPrevented, 'Event is canceled');
      assert.ok(e.detail.result, 'Has promise on detail');
    });

    it('Handler increases request id counter', function() {
      fire('settings-read', {});
      assert.equal(instance.lastRequestId, 1);
    });

    it('Handler adds promise', function() {
      fire('settings-read', {});
      const p = instance.promises[0];
      assert.typeOf(p, 'object');
      assert.equal(p.type, 'read');
      assert.equal(p.id, instance.lastRequestId);
      assert.typeOf(p.resolve, 'function');
    });

    it('Handler resolves the promise when ready', function() {
      const e = fire('settings-read', {});
      const data = {test: true};
      setTimeout(() => {
        instance._mainPrefsHandler({}, data, 1);
      }, 1);
      return e.detail.result
      .then((settings) => {
        assert.deepEqual(settings, data);
      });
    });

    it('Handler clears the promise when ready', function() {
      const e = fire('settings-read', {});
      const data = {test: true};
      setTimeout(() => {
        instance._mainPrefsHandler({}, data, 1);
      }, 1);
      return e.detail.result
      .then(() => {
        assert.lengthOf(instance.promises, 0);
      });
    });
  });

  describe('Store data web event handler', function() {
    let instance;
    const name = 'test-name';
    const value = 'test-value';
    beforeEach(() => {
      instance = new ArcPreferencesProxy();
      instance.observe();
    });

    afterEach(() => {
      instance.unobserve();
    });

    it('Handles the event', function() {
      const e = fire('settings-changed', {name, value});
      assert.isTrue(e.defaultPrevented, 'Event is canceled');
      assert.ok(e.detail.result, 'Has promise on detail');
    });

    it('Do not increase request ID', function() {
      fire('settings-changed', {name, value});
      assert.equal(instance.lastRequestId, 0);
    });

    it('Handler adds promise', function() {
      fire('settings-changed', {name, value});
      const p = instance.promises[0];
      assert.typeOf(p, 'object');
      assert.equal(p.type, 'store');
      assert.equal(p.name, name);
      assert.typeOf(p.resolve, 'function');
    });

    it('Handler resolves the promise when ready', function() {
      const e = fire('settings-changed', {name, value});
      setTimeout(() => {
        instance._mainChangedHandler({}, name, value);
      }, 1);
      return e.detail.result;
    });

    it('Handler clears the promise when ready', function() {
      const e = fire('settings-changed', {name, value});
      setTimeout(() => {
        instance._mainChangedHandler({}, name, value);
      }, 1);
      return e.detail.result
      .then(() => {
        assert.lengthOf(instance.promises, 0);
      });
    });

    it('Dispatches non-0cancelable settings-changed event', function(done) {
      fire('settings-changed', {name, value});
      document.body.addEventListener('settings-changed', function f(e) {
        document.body.removeEventListener('settings-changed', f);
        assert.isFalse(e.cancelable, 'Event is not cancelable');
        assert.equal(e.detail.name, name, 'Name is set');
        assert.equal(e.detail.value, value, 'Value is set');
        done();
      });
      setTimeout(() => {
        instance._mainChangedHandler({}, name, value);
      }, 1);
    });
  });
});
