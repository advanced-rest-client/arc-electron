const bootstrap = require('../test-bootstrap.js');
const { assert } = require('chai');
const fs = require('fs-extra');
const path = require('path');

describe('Initial paths', function() {
  const basePath = path.join('test', 'tests-exe-dir');
  const settingsFilePath = path.join(basePath, 'test-settings.json');
  const workspaceFilePath = path.join(basePath, 'workspace');
  const themesFilePath = path.join(basePath, 'themes-esm');

  describe('Setups default file paths', function() {
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

    it('Should set default settings file location', function() {
      return app.electron.remote.app
      .testsInterface('get-application-settings-file-location')
      .then((location) => {
        assert.typeOf(location, 'string');
      });
    });

    it('Should set default workspace file location', function() {
      return app.electron.remote.app
      .testsInterface('get-application-workspace-state-file-location')
      .then((location) => {
        assert.typeOf(location, 'string');
      });
    });

    it('Sets ARC_HOME variable', () => {
      return app.mainProcess.env()
      .then((variables) => {
        assert.typeOf(variables.ARC_HOME, 'string');
      });
    });

    it('Sets ARC_SETTINGS_FILE variable', () => {
      return app.mainProcess.env()
      .then((variables) => {
        assert.typeOf(variables.ARC_SETTINGS_FILE, 'string');
      });
    });

    it('Sets default ARC_SETTINGS_FILE is in ARC_HOME', () => {
      return app.mainProcess.env()
      .then((variables) => {
        assert.equal(variables.ARC_SETTINGS_FILE, bootstrap.settingsFilePath);
      });
    });

    it('Sets default ARC_THEMES in ARC_HOME', () => {
      return app.mainProcess.env()
      .then((variables) => {
        assert.equal(variables.ARC_THEMES, bootstrap.themesFilePath);
      });
    });

    it('Sets default ARC_THEMES_SETTINGS in ARC_THEMES', () => {
      return app.mainProcess.env()
      .then((variables) => {
        assert.equal(variables.ARC_THEMES_SETTINGS, path.join(bootstrap.themesFilePath, 'themes-info.json'));
      });
    });

    it('Sets default ARC_WORKSPACE_PATH in ARC_HOME', () => {
      return app.mainProcess.env()
      .then((variables) => {
        assert.equal(variables.ARC_WORKSPACE_PATH, bootstrap.workspaceFilePath);
      });
    });
  });

  describe('Setups configuration file paths', function() {
    const opts = {
      args: [
        '--settings-file',
        settingsFilePath,
        '--workspace-path',
        workspaceFilePath,
        '--themes-path',
        themesFilePath
      ]
    };
    let app;
    before(function() {
      app = bootstrap.getApp(opts);
      return app.start()
      .then(() => app.client.waitUntilWindowLoaded(10000));
    });

    after(function() {
      let promise;
      if (app && app.isRunning()) {
        promise = app.stop();
      } else {
        promise = Promise.resolve();
      }
      return promise
      .then(() => fs.remove(settingsFilePath))
      .then(() => fs.remove(workspaceFilePath));
    });

    it('Sets ARC_SETTINGS_FILE variable', () => {
      return app.mainProcess.env()
      .then((variables) => {
        assert.equal(variables.ARC_SETTINGS_FILE, settingsFilePath);
      });
    });

    it('Sets ARC_WORKSPACE_PATH variable', () => {
      return app.mainProcess.env()
      .then((variables) => {
        assert.equal(variables.ARC_WORKSPACE_PATH, workspaceFilePath);
      });
    });

    it('Sets ARC_THEMES variable', () => {
      return app.mainProcess.env()
      .then((variables) => {
        assert.equal(variables.ARC_THEMES, themesFilePath);
      });
    });

    it('Sets ARC_THEMES_SETTINGS variable', () => {
      return app.mainProcess.env()
      .then((variables) => {
        assert.equal(variables.ARC_THEMES_SETTINGS, path.join(themesFilePath, 'themes-info.json'));
      });
    });
  });
});
