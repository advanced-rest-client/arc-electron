const { assert } = require('chai');
const bootstrap = require('../test-bootstrap.js');

describe.skip('OSs dark theme', function() {
  // See https://github.com/electron-userland/spectron/issues/466
  describe('View control commands', function() {
    let app;
    before(async () => {
      app = await bootstrap.runAppDeffered(2000);
    });

    after(() => bootstrap.stopAndClean(app));

    it('changes theme when dark theme is turned on', async () => {
      console.log(app.electron);
      app.electron.nativeTheme.themeSource = 'dark';

      const result = await app.client.execute(() => {
        const nodes = document.head.querySelectorAll('link[rel="stylesheet"]');
        const themes = [];
        for (let i = nodes.length - 1; i >= 0; i--) {
          const href = nodes[i].href;
          if (href && href.indexOf('themes:') === 0) {
            themes[themes.length] = href;
          }
        }
        return {
          themes
        };
      });
      const queryResult = result.value;
      assert.deepEqual(queryResult.themes, ['@advanced-rest-client/arc-electron-default-theme']);
    });
  });
});
