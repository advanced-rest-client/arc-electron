const { assert } = require('chai');
const fs = require('fs-extra');
const path = require('path');
const bootstrap = require('../test-bootstrap.js');

describe('Renderer configuration', function() {
  let app;
  before(function() {
    return bootstrap.runAppDeffered(2000)
    .then((result) => {
      app = result;
    })
    .catch((cause) => {
      if (app && app.isRunning()) {
        return app.stop()
        .then(() => {
          throw cause;
        });
      }
      throw cause;
    });
  });

  after(function() {
    let p;
    if (app && app.isRunning()) {
      p = app.stop();
    } else {
      p = Promise.resolve();
    }
    const basePath = path.join('test', 'playground');
    return p.then(() => fs.remove(basePath));
  });

  it('Sets configuration on arc-electron component', (done) => {
    app.client.element('arc-electron')
    .then((result) => {
      assert.ok(result);
    })
    .then(() => {
      return app.client.execute(() => {
        const arc = document.querySelector('arc-electron');
        return arc.config;
      });
    })
    .then((result) => {
      const cnf = result.value;
      assert.isTrue(cnf.autoUpdate);
      assert.equal(cnf.requestDefaultTimeout, 45);
      assert.isTrue(cnf.appVariablesEnabled);
      assert.isTrue(cnf.systemVariablesEnabled);
      assert.isTrue(cnf.followRedirects);
      assert.isTrue(cnf.historyEnabled);
      assert.isTrue(cnf.telemetry);
      assert.equal(cnf.viewListType, 'default');
      done();
    })
    .catch((cause) => {
      done(cause);
    });
  });

  it('Sets configuration on electron-http-transport component', (done) => {
    app.client.element('arc-electron')
    .then((result) => {
      assert.ok(result);
    })
    .then(() => {
      return app.client.execute(() => {
        const arc = document.querySelector('arc-electron');
        const transport = arc.shadowRoot.querySelector('electron-http-transport');
        return {
          followRedirects: transport.followRedirects,
          requestTimeout: transport.requestTimeout,
          nativeTransport: transport.nativeTransport,
          validateCertificates: transport.validateCertificates,
          sentMessageLimit: transport.sentMessageLimit
        };
      });
    })
    .then((result) => {
      const cnf = result.value;
      assert.isTrue(cnf.followRedirects);
      assert.equal(cnf.requestTimeout, 45);
      assert.isFalse(cnf.nativeTransport);
      assert.isFalse(cnf.validateCertificates);
      assert.equal(cnf.sentMessageLimit, null);
      done();
    })
    .catch((cause) => {
      done(cause);
    });
  });

  it('Sets configuration on variables-manager component', async () => {
    const result = await app.client.element('arc-electron');
    assert.ok(result);
    const call = await app.client.execute(() => {
      const arc = document.querySelector('arc-electron');
      const mgr = arc.shadowRoot.querySelector('variables-manager');
      return {
        sysVariablesDisabled: mgr.sysVariablesDisabled,
        appVariablesDisabled: mgr.appVariablesDisabled
      };
    });
    const cnf = call.value;
    assert.equal(cnf.sysVariablesDisabled, null);
    assert.equal(cnf.appVariablesDisabled, null);
  });

  it('Sets configuration on arc-request-logic component', async () => {
    const init = await app.client.element('arc-electron');
    assert.ok(init);
    const result = await app.client.execute(() => {
      const arc = document.querySelector('arc-electron');
      const node = arc.shadowRoot.querySelector('arc-request-logic');
      return {
        variablesDisabled: node.variablesDisabled
      };
    });
    const cnf = result.value;
    assert.equal(cnf.variablesDisabled, null);
  });

  it('Sets configuration on arc-menu component', async () => {
    const init = await app.client.element('arc-electron');
    assert.ok(init);
    const result = await app.client.execute(() => {
      const arc = document.querySelector('arc-electron');
      const node = arc.shadowRoot.querySelector('arc-menu');
      return {
        allowPopup: node.allowPopup,
        listType: node.listType
      };
    });
    const cnf = result.value;
    assert.equal(cnf.allowPopup, null);
    assert.equal(cnf.listType, 'default');
  });

  it('Sets configuration on history-panel component', async () => {
    const init = await app.client.element('arc-electron');
    assert.ok(init);
    const result = await app.client.executeAsync((done) => {
      const arc = document.querySelector('arc-electron');
      arc.page = 'history';
      setTimeout(() => {
        const node = arc.shadowRoot.querySelector('history-panel');
        done({
          listType: node.listType
        });
      });
    });
    const cnf = result.value;
    assert.equal(cnf.listType, 'default');
  });

  it('Sets configuration on saved-requests-panel component', async () => {
    const init = await app.client.element('arc-electron');
    assert.ok(init);
    const result = await app.client.executeAsync((done) => {
      const arc = document.querySelector('arc-electron');
      arc.page = 'saved';
      setTimeout(() => {
        const node = arc.shadowRoot.querySelector('saved-requests-panel');
        done({
          listType: node.listType
        });
      });
    });
    const cnf = result.value;
    assert.equal(cnf.listType, 'default');
  });

  it('Renders app-analytics elements', async () => {
    const init = await app.client.element('arc-electron');
    assert.ok(init);
    const result = await app.client.execute(() => {
      const arc = document.querySelector('arc-electron');
      const node = arc.shadowRoot.querySelectorAll('app-analytics');
      return {
        length: node.length
      };
    });
    const cnf = result.value;
    assert.equal(cnf.length, 3);
  });
});
