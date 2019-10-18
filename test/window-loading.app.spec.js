const bootstrap = require('./test-bootstrap.js');
const { assert } = require('chai');
const fs = require('fs-extra');
const path = require('path');

describe('Loading default window', function() {
  const basePath = path.join('test', 'tests-exe-dir');
  const settingsFilePath = path.join(basePath, 'test-settings.json');
  const workspaceFilePath = path.join(basePath, 'workspace');
  const themesFilePath = path.join(basePath, 'themes-esm');
  const componentsFilePath = path.join(basePath, 'components');

  after(() => fs.remove(basePath));

  describe('Loading app.html', function() {
    this.timeout(10000);
    let app;
    before(function() {
      app = bootstrap.getApp();
      return app.start()
      .then(() => app.client.waitUntilWindowLoaded(10000))
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

    it('Loads app file from "file:" scheme', function() {
      return app.client.getUrl()
      .then((location) => {
        assert.equal(location.indexOf('file:'), 0);
      });
    });

    it('Loads app init file', function() {
      return app.client.getUrl()
      .then((location) => {
        assert.notEqual(location.indexOf('app.html', -1));
      });
    });

    it('DevTools is not opened', () => {
      return app.browserWindow.isDevToolsOpened()
      .then(function(opened) {
        assert.isFalse(opened);
      });
    });
  });

  describe('Workspace preparation', function() {
    this.timeout(10000);
    const opts = {
      args: [
        '--settings-file',
        settingsFilePath,
        '--workspace-path',
        workspaceFilePath,
        '--themes-path',
        themesFilePath,
        // '--debug',
        // '--debug-level',
        // 'silly'
      ]
    };
    let app;
    before(function() {
      app = bootstrap.getApp(opts);
      return app.start()
      .then(() => app.client.waitUntilWindowLoaded(10000))
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
      if (app && app.isRunning()) {
        return app.stop();
      }
    });

    it('Settings file is created', function() {
      return fs.pathExists(settingsFilePath)
      .then((exists) => assert.isTrue(exists));
    });

    it('Settings file has default configuration', function() {
      return fs.readJson(settingsFilePath)
      .then((config) => {
        assert.deepEqual(config, {
          appVariablesEnabled: true,
          systemVariablesEnabled: true,
          historyEnabled: true,
          requestDefaultTimeout: 45,
          autoUpdate: true,
          telemetry: true,
          viewListType: 'default',
          followRedirects: true
        });
      });
    });

    // process.env.ARC_THEMES
    it('Sets ARC_THEMES path', () => {
      return app.mainProcess.env()
      .then((variables) => {
        assert.equal(variables.ARC_THEMES, themesFilePath);
      });
    });

    it('Creates themes path', () => {
      return fs.pathExists(themesFilePath)
      .then((exists) => assert.isTrue(exists));
    });

    it('Creates themes info file', () => {
      return fs.pathExists(path.join(themesFilePath, 'themes-info.json'))
      .then((exists) => assert.isTrue(exists));
    });

    const arcPrefix = '@advanced-rest-client';

    it('Copies default theme', () => {
      const prefix = path.join(themesFilePath, arcPrefix, 'arc-electron-default-theme');
      return fs.pathExists(prefix)
      .then((exists) => {
        assert.isTrue(exists, 'Main folder exists');
        return fs.pathExists(path.join(prefix, 'arc-electron-default-theme.css'));
      })
      .then((exists) => {
        assert.isTrue(exists, 'Theme file exists');
        return fs.pathExists(path.join(prefix, 'package.json'));
      })
      .then((exists) => {
        assert.isTrue(exists, 'Info file exists');
      });
    });

    it('Copies anypoint theme', () => {
      const prefix = path.join(themesFilePath, arcPrefix, 'arc-electron-anypoint-theme');
      return fs.pathExists(prefix)
      .then((exists) => {
        assert.isTrue(exists, 'Main folder exists');
        return fs.pathExists(path.join(prefix, 'arc-electron-anypoint-theme.css'));
      })
      .then((exists) => {
        assert.isTrue(exists, 'Theme file exists');
        return fs.pathExists(path.join(prefix, 'package.json'));
      })
      .then((exists) => {
        assert.isTrue(exists, 'Info file exists');
      });
    });

    it('Copies dark theme', () => {
      const prefix = path.join(themesFilePath, arcPrefix, 'arc-electron-dark-theme');
      return fs.pathExists(prefix)
      .then((exists) => {
        assert.isTrue(exists, 'Main folder exists');
        return fs.pathExists(path.join(prefix, 'arc-electron-dark-theme.css'));
      })
      .then((exists) => {
        assert.isTrue(exists, 'Theme file exists');
        return fs.pathExists(path.join(prefix, 'package.json'));
      })
      .then((exists) => {
        assert.isTrue(exists, 'Info file exists');
      });
    });

    it('Creates workspace path', () => {
      return fs.pathExists(workspaceFilePath)
      .then((exists) => assert.isTrue(exists));
    });

    it('Creates workspace default file', () => {
      return fs.pathExists(path.join(workspaceFilePath, 'workspace.json'))
      .then((exists) => assert.isTrue(exists));
    });
  });
});
