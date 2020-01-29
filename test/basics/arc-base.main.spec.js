const { ArcBase } = require('../../scripts/main/arc-base');
const { assert } = require('chai');

describe('ArcBase class', function() {
  describe('Debounce', function() {
    let base;
    beforeEach(function() {
      base = new ArcBase();
    });

    it('Execute tasks', function(done) {
      const fn = function() {
        done();
      };
      base.debounce('name', fn, 10);
    });

    it('Execute tasks only once', function(done) {
      let called = 0;
      const fn = function() {
        called++;
      };
      base.debounce('name', fn, 10);
      setTimeout(function() {
        base.debounce('name', fn, 10);
      }, 2);
      base.debounce('name', fn, 10);
      setTimeout(function() {
        assert.equal(called, 1);
        done();
      }, 15);
    });
  }).timeout(10000);

  describe('Cancel debounce', function() {
    let base;
    beforeEach(function() {
      base = new ArcBase();
    });

    it('Does not execute tasks', function(done) {
      let called = 0;
      const fn = function() {
        called++;
      };
      base.debounce('name', fn, 10);
      setTimeout(function() {
        base.cancelDebounce('name');
      }, 2);
      setTimeout(function() {
        assert.equal(called, 0);
        done();
      }, 15);
    });
  }).timeout(10000);

  describe('_debounceIndex()', () => {
    let base;
    beforeEach(function() {
      base = new ArcBase();
    });

    it('Returns -1 if debouncer not set', () => {
      const result = base._debounceIndex('test');
      assert.equal(result, -1);
    });

    it('Returns index of a debouncer', () => {
      base._debouncers.push({
        name: 'test'
      });
      const result = base._debounceIndex('test');
      assert.equal(result, 0);
    });
  });

  describe('nextIpcRequestId()', () => {
    let base;
    beforeEach(function() {
      base = new ArcBase();
    });

    it('Returns a number', () => {
      const result = base.nextIpcRequestId();
      assert.typeOf(result, 'number');
    });

    it('Increases the number for each call', () => {
      const result1 = base.nextIpcRequestId();
      const result2 = base.nextIpcRequestId();
      assert.isAbove(result2, result1);
    });
  });

  describe('appendPromise()', () => {
    let base;
    beforeEach(function() {
      base = new ArcBase();
    });

    it('Returns a promise', () => {
      const result = base.appendPromise('test');
      assert.typeOf(result, 'promise');
    });

    it('Adds promise to the queue', () => {
      base.appendPromise('test');
      assert.lengthOf(base._promises, 1);
    });

    it('Added promise has the id', () => {
      base.appendPromise('test');
      assert.equal(base._promises[0].id, 'test');
    });

    it('Added promise has resolve function', () => {
      base.appendPromise('test');
      assert.typeOf(base._promises[0].resolve, 'function');
    });

    it('Added promise has reject function', () => {
      base.appendPromise('test');
      assert.typeOf(base._promises[0].reject, 'function');
    });
  });

  describe('_ipcPromiseCallback()', () => {
    let base;
    beforeEach(function() {
      base = new ArcBase();
    });

    it('Throws an error when promise not found in the queue', () => {
      assert.throws(function() {
        base._ipcPromiseCallback({}, 'test');
      });
    });

    it('Resolves promise', () => {
      const p = base.appendPromise('test');
      base._ipcPromiseCallback({}, 'test', false);
      return p;
    });

    it('Rejects promise', () => {
      const p = base.appendPromise('test');
      base._ipcPromiseCallback({}, 'test', true);
      let called = false;
      return p
      .then(() => {
        called = true;
        throw new Error('Resolves the promise');
      })
      .catch((cause) => {
        if (called) {
          throw cause;
        }
      });
    });

    it('Resolves promise with arguments', () => {
      const p = base.appendPromise('test');
      base._ipcPromiseCallback({}, 'test', false, 'a', 'b', 'c');
      return p
      .then((result) => {
        assert.deepEqual(result, ['a', 'b', 'c']);
      });
    });

    it('Rejects promise with arguments', () => {
      const p = base.appendPromise('test');
      base._ipcPromiseCallback({}, 'test', true, 'a', 'b', 'c');
      let called = false;
      return p
      .then(() => {
        called = true;
        throw new Error('Resolves the promise');
      })
      .catch((cause) => {
        if (called) {
          throw cause;
        }
        assert.deepEqual(cause, ['a', 'b', 'c']);
      });
    });
  });
});
