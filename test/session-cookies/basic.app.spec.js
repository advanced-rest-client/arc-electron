const { assert } = require('chai');
const fs = require('fs-extra');
const path = require('path');
const bootstrap = require('../test-bootstrap.js');

describe('Session cookies', function() {
  let app;
  before(async () => {
    await fs.outputJson(bootstrap.settingsFilePath, {
      ignoreSessionCookies: true
    });
    app = await bootstrap.runAppDeffered(2000);
  });

  after(async () => {
    if (app && app.isRunning()) {
      await app.stop();
    }
    const basePath = path.join('test', 'playground');
    await fs.remove(basePath);
  });

  it('sets ignoreSessionCookies on CookieBridge when init', async () => {
    const result = await app.client.execute(async () => {
      /* global initScript */
      return initScript.cookieBridge.ignoreSessionCookies;
    });
    assert.isTrue(result.value);
  });

  it('updates ignoreSessionCookies on CookieBridge instance', async () => {
    const result = await app.client.execute(async () => {
      document.body.dispatchEvent(new CustomEvent('settings-changed', {
        bubbles: true,
        detail: {
          name: 'ignoreSessionCookies',
          value: false,
        }
      }));
      return initScript.cookieBridge.ignoreSessionCookies;
    });
    assert.isFalse(result.value);
  });

  it('ignores other setting change events', async () => {
    const result = await app.client.execute(async () => {
      document.body.dispatchEvent(new CustomEvent('settings-changed', {
        bubbles: true,
        detail: {
          name: 'a',
          value: 'b',
        }
      }));
      return initScript.cookieBridge.ignoreSessionCookies;
    });
    assert.isFalse(result.value);
  });
});
