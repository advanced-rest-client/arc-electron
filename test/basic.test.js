const bootstrap = require('./test-bootstrap.js');
const assert = require('assert');

describe('Basic', function() {
  describe('application launch', function() {
    this.timeout(10000);
    beforeEach(function() {
      this.app = bootstrap.getApp();
      return this.app.start()
      .then(() => console.log('App started'));
    });

    afterEach(function() {
      if (this.app && this.app.isRunning()) {
        return this.app.stop();
      }
    });

    it('shows an initial window', function() {
      return this.app.client.getWindowCount().then(function(count) {
        assert.equal(count, 1);
      });
    });
  });
});
