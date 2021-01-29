const bootstrap = require('../test-bootstrap.js');
const { assert } = require('chai');
const path = require('path');
const fs = require('fs-extra');

describe('PouchDB integration', function() {
  describe('PouchdbQuickSearch', () => {
    let app;
    before(async () => {
      try {
        app = await bootstrap.runAppDeffered(2000);
      } catch(cause) {
        if (app && app.isRunning()) {
          await app.stop();
        }
        throw cause;
      }
    });

    after(async () => {
      if (app && app.isRunning()) {
        await app.stop();
      }
      const basePath = path.join('test', 'playground');
      await fs.remove(basePath);
    });

    it('Registers quicksearch plugin', async () => {
      const init = await app.client.element('arc-electron');
      assert.ok(init);
      const result = await app.client.execute(() => {
        /* global PouchDB */
        const db = new PouchDB('saved-requests');
        const to = typeof db.search;
        return {
          to
        };
      });
      const queryResult = result.value;
      assert.equal(queryResult.to, 'function');
    });
  });
});
