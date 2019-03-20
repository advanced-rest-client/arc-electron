const {assert} = require('chai');
const bootstrap = require('./test-bootstrap.js');
const fs = require('fs-extra');
const path = require('path');

describe('Renderer configuration', function() {
  let app;
  before(function() {
    this.timeout(10000);
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
    this.timeout(10000);
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
    this.timeout(10000);
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
      assert.isUndefined(cnf.sentMessageLimit);
      done();
    })
    .catch((cause) => {
      done(cause);
    });
  });

  it('Sets configuration on variables-manager component', (done) => {
    this.timeout(10000);
    app.client.element('arc-electron')
    .then((result) => {
      assert.ok(result);
    })
    .then(() => {
      return app.client.execute(() => {
        const arc = document.querySelector('arc-electron');
        const mgr = arc.shadowRoot.querySelector('variables-manager');
        return {
          sysVariablesDisabled: mgr.sysVariablesDisabled,
          appVariablesDisabled: mgr.appVariablesDisabled
        };
      });
    })
    .then((result) => {
      const cnf = result.value;
      assert.isFalse(cnf.sysVariablesDisabled);
      assert.isFalse(cnf.appVariablesDisabled);
      done();
    })
    .catch((cause) => {
      done(cause);
    });
  });

  it('Sets configuration on arc-request-logic component', (done) => {
    this.timeout(10000);
    app.client.element('arc-electron')
    .then((result) => {
      assert.ok(result);
    })
    .then(() => {
      return app.client.execute(() => {
        const arc = document.querySelector('arc-electron');
        const node = arc.shadowRoot.querySelector('arc-request-logic');
        return {
          variablesDisabled: node.variablesDisabled
        };
      });
    })
    .then((result) => {
      const cnf = result.value;
      assert.isFalse(cnf.variablesDisabled);
      done();
    })
    .catch((cause) => {
      done(cause);
    });
  });

  it('Sets configuration on arc-menu component', (done) => {
    this.timeout(10000);
    app.client.element('arc-electron')
    .then((result) => {
      assert.ok(result);
    })
    .then(() => {
      return app.client.execute(() => {
        const arc = document.querySelector('arc-electron');
        const node = arc.shadowRoot.querySelector('arc-menu');
        return {
          allowPopup: node.allowPopup,
          listType: node.listType
        };
      });
    })
    .then((result) => {
      const cnf = result.value;
      assert.isFalse(cnf.allowPopup);
      assert.equal(cnf.listType, 'default');
      done();
    })
    .catch((cause) => {
      done(cause);
    });
  });

  it('Sets configuration on history-panel component', (done) => {
    this.timeout(10000);
    app.client.element('arc-electron')
    .then((result) => {
      assert.ok(result);
    })
    .then(() => {
      return app.client.execute(() => {
        const arc = document.querySelector('arc-electron');
        const node = arc.shadowRoot.querySelector('history-panel');
        return {
          listType: node.listType
        };
      });
    })
    .then((result) => {
      const cnf = result.value;
      assert.equal(cnf.listType, 'default');
      done();
    })
    .catch((cause) => {
      done(cause);
    });
  });

  it('Sets configuration on saved-requests-panel component', (done) => {
    this.timeout(10000);
    app.client.element('arc-electron')
    .then((result) => {
      assert.ok(result);
    })
    .then(() => {
      return app.client.execute(() => {
        const arc = document.querySelector('arc-electron');
        const node = arc.shadowRoot.querySelector('saved-requests-panel');
        return {
          listType: node.listType
        };
      });
    })
    .then((result) => {
      const cnf = result.value;
      assert.equal(cnf.listType, 'default');
      done();
    })
    .catch((cause) => {
      done(cause);
    });
  });

  it('Renders app-analytics elements', (done) => {
    this.timeout(10000);
    app.client.element('arc-electron')
    .then((result) => {
      assert.ok(result);
    })
    .then(() => {
      return app.client.execute(() => {
        const arc = document.querySelector('arc-electron');
        const node = arc.shadowRoot.querySelectorAll('app-analytics');
        return {
          length: node.length
        };
      });
    })
    .then((result) => {
      const cnf = result.value;
      assert.equal(cnf.length, 3);
      done();
    })
    .catch((cause) => {
      done(cause);
    });
  });
});
