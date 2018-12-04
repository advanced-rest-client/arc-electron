const bootstrap = require('./test-bootstrap.js');
const assert = require('assert');
const fs = require('fs-extra');
const path = require('path');

describe('Initial paths', function() {
  const settingsFilePath = path.join('test', 'test-settings.json');
  const workspaceFilePath = path.join('test', 'workspace');

  describe('Setups default file paths', function() {
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
      if (app && app.isRunning()) {
        return app.stop();
      }
    });

    it('Should not set settings file location', function() {
      return app.electron.remote.app
      .testsInterface('get-application-settings-file-location')
      .then((location) => {
        assert.equal(location, undefined);
      });
    });

    it('Should not set workspace file location', function() {
      return app.electron.remote.app
      .testsInterface('get-application-workspace-state-file-location')
      .then((location) => {
        assert.equal(location, undefined);
      });
    });

    it('Should set settings default file location', function() {
      let fileLocation;
      return app.electron.remote.app
      .testsInterface('get-preferences-settings-location')
      .then((location) => {
        fileLocation = location;
        return app.electron.remote.app.getPath('userData');
      })
      .then((settingsPath) => {
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
        '--workspace-path',
        workspaceFilePath
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

    it('Should set settings file location', function() {
      return app.electron.remote.app.
      testsInterface('get-application-settings-file-location')
      .then((location) => {
        assert.equal(location, settingsFilePath);
      });
    });

    it('Should set workspace file location', function() {
      return app.electron.remote.app
      .testsInterface('get-application-workspace-state-file-location')
      .then((location) => {
        assert.equal(location, workspaceFilePath);
      });
    });

    // function waitFor(time) {
    //   return new Promise(resolve => {
    //     setTimeout(resolve, time);
    //   });
    // }
    //
    // it('Application receives workspace-script attribute', function() {
    //   return waitFor(1000)
    //   .then(() => this.app.client.getAttribute('arc-electron',
    //   'workspace-script'))
    //   .then(value => {
    //     assert.equal(value, workspaceFilePath);
    //   });
    // });
    //
    // it('Application receives settings-script attribute', function() {
    //   return waitFor(1000)
    //   .then(() => this.app.client.getAttribute('arc-electron',
    //   'settings-script'))
    //   .then(value => {
    //     assert.equal(value, settingsFilePath);
    //   });
    // });
  });
});
