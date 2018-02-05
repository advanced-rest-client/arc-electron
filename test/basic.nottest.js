const bootstrap = require('./test-bootstrap.js');
const assert = require('assert');

/**
 * This test has been suspended because of different exectution
 * on different environemnts.
 * TODO: check what is happening.
 */
describe('Basic', function() {
  describe('application launch', function() {
    this.timeout(10000);
    beforeEach(function() {
      this.app = bootstrap.getApp();
      return this.app.start()
      .then(() => this.app.client.waitUntilWindowLoaded(10000));
    });

    afterEach(function() {
      if (this.app && this.app.isRunning()) {
        return this.app.stop();
      }
    });

    it('shows an initial window', function() {
      return this.app.client.getWindowCount()
      .then(function(count) {
        assert.equal(count, 2);
      });
    });

    // it('Renders the application main element', function() {
    //   return this.app.client.element('arc-electron')
    //   .then(value => {
    //     assert.ok(value.value);
    //   });
    // });
  });
});
