const { assert } = require('chai');
const bootstrap = require('../test-bootstrap.js');

describe('ARC API', function() {
  describe('View control commands', function() {
    let app;
    before(function() {
      return bootstrap.runAppDeffered(2000)
      .then((result) => {
        app = result;
      });
    });

    after(function() {
      return bootstrap.stopAndClean(app);
    });

    [
      ['show-settings', 'settings'],
      ['about', 'about'],
      ['open-saved', 'saved'],
      ['open-history', 'history'],
      ['open-drive', 'drive'],
      ['open-cookie-manager', 'cookie-manager'],
      ['open-hosts-editor', 'hosts-rules'],
      ['open-themes', 'themes-panel'],
      ['open-requests-workspace', 'request'],
      ['open-web-socket', 'socket']
    ].forEach((item) => {
      it(`${item[0]} command renders ${item[1]} page`, function(done) {
        // this.timeout(10000);
        app.webContents.send('command', item[0])
        .then(() => {
          return app.client.execute(() => {
            const arc = document.querySelector('arc-electron');
            return arc.page;
          });
        })
        .then((result) => {
          assert.equal(result.value, item[1]);
          done();
        })
        .catch((cause) => {
          done(cause);
        });
      });
    });
  });
  // I am not sure how to test this flow...
  // describe.only('Other commands', function() {
  //   let app;
  //   before(function() {
  //     this.timeout(10000);
  //     return bootstrap.runAppDeffered(2000)
  //     .then((result) => {
  //       app = result;
  //     });
  //   });
  //
  //   after(function() {
  //     return bootstrap.stopAndClean(app);
  //   });
  //
  //   it('Returns value for get-tabs-count', function(done) {
  //     this.timeout(5000);
  //     app.electron.remote.ipcMain.on('current-tabs-count', (evt, callId, err, cnt) => {
  //       assert.equal(callId, 'test-id');
  //       assert.isFalse(err);
  //       assert.equal(cnt, 1);
  //       done();
  //     });
  //     app.webContents.send('command', 'get-tabs-count', 'test-id');
  //   });
  // });
});
