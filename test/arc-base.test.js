const {ArcBase} = require('../scripts/main/arc-base');
const assert = require('assert');

describe('ArcBase class', function() {
  let base;
  describe('Debounce', function() {
    this.timeout(10000);

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
  });
  describe('Cancel debounce', function() {
    this.timeout(10000);

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
  });
});
