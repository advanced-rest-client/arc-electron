const bootstrap = require('./test-bootstrap.js');
const assert = require('assert');
const fs = require('fs-extra');

describe('Initial paths', function() {
  const settingsFilePath = 'test/test-settings.json';
  const workspaceFilePath = 'test/test-workspace.json';

  describe('Setups default file paths', function() {
    this.timeout(10000);
    before(function() {
      this.app = bootstrap.getApp();
      return this.app.start()
      .then(() => this.app.client.waitUntilWindowLoaded(10000));
    });

    after(function() {
      if (this.app && this.app.isRunning()) {
        return this.app.stop();
      }
    });

    it('Should not set settings file location', function() {
      return this.app.electron.remote.app.testsInterface('get-application-settings-file-location')
      .then(location => {
        assert.equal(location, undefined);
      });
    });

    it('Should not set workspace file location', function() {
      return this.app.electron.remote.app
      .testsInterface('get-application-workspace-state-file-location')
      .then(location => {
        assert.equal(location, undefined);
      });
    });

    it('Should set settings default file location', function() {
      var fileLocation;
      return this.app.electron.remote.app
      .testsInterface('get-preferences-settings-location')
      .then(location => {
        fileLocation = location;
        return this.app.electron.remote.app.getPath('userData');
      })
      .then(settingsPath => {
        let finalLocation = settingsPath + '/settings.json';
        assert.equal(fileLocation, finalLocation);
      });
    });
  });

  describe('Setups configuration file paths', function() {
    this.timeout(10000);

    const opts = {
      args: [
        '--settings-file',
        settingsFilePath,
        '--workspace-file',
        workspaceFilePath
      ]
    };

    before(function() {
      this.app = bootstrap.getApp(opts);
      return this.app.start()
      .then(() => this.app.client.waitUntilWindowLoaded(10000));
    });

    after(function() {
      var promise;
      if (this.app && this.app.isRunning()) {
        promise = this.app.stop();
      } else {
        promise = Promise.resolve();
      }
      return promise
      .then(() => fs.remove(settingsFilePath))
      .then(() => fs.remove(workspaceFilePath));
    });

    it('Should set settings file location', function() {
      return this.app.electron.remote.app.testsInterface('get-application-settings-file-location')
      .then(location => {
        assert.equal(location, settingsFilePath);
      });
    });

    it('Should set workspace file location', function() {
      return this.app.electron.remote.app
      .testsInterface('get-application-workspace-state-file-location')
      .then(location => {
        assert.equal(location, workspaceFilePath);
      });
    });

    function waitFor(time) {
      return new Promise(resolve => {
        setTimeout(resolve, time);
      });
    }

    it('Application receives workspace-script attribute', function() {
      return waitFor(1000)
      .then(() => this.app.client.getAttribute('arc-electron', 'workspace-script'))
      .then(value => {
        assert.equal(value, workspaceFilePath);
      });
    });

    it('Application receives settings-script attribute', function() {
      return waitFor(1000)
      .then(() => this.app.client.getAttribute('arc-electron', 'settings-script'))
      .then(value => {
        assert.equal(value, settingsFilePath);
      });
    });
  });
});
