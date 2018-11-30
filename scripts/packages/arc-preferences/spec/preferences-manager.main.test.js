const assert = require('chai').assert;
const path = require('path');
const fs = require('fs-extra');
const {PreferencesManager} = require('../main');

describe('PreferencesManager class - main process', function() {
  const file = path.join('test', 'test.json');

  describe('Reading preferences', function() {
    after(() => {
      return fs.remove(file);
    });
    const id = 'test-id';
    const data = {
      test: true
    };

    it('Responds with app-preferences event', function(done) {
      const instance = new PreferencesManager({
        file: file
      });
      instance._readHandler({
        sender: {
          send: function(type, data, _id) {
            setTimeout(() => {
              assert.equal(type, 'app-preferences', 'Type is set');
              assert.deepEqual(data, {
                autoUpdate: true,
                requestDefaultTimeout: 45,
                telemetry: true,
                useCookieStorage: true,
                useVariables: true
              }, 'Data has default values');
              assert.equal(_id, id, 'Returns the same id');
              done();
            }, 1);
          }
        }
      }, id);
    });

    it('Responds with data if exists', function(done) {
      const instance = new PreferencesManager({
        file: file
      });
      fs.outputJson(file, data)
      .then(() => {
        instance._readHandler({
          sender: {
            send: function(type, _data) {
              setTimeout(() => {
                assert.deepEqual(data, _data, 'Data is set');
                done();
              }, 1);
            }
          }
        }, id);
      });
    });
  });

  describe('Updating preferences', function() {
    after(() => {
      return fs.remove(file);
    });
    const name = 'test-name';
    const value = 'test-value';

    it('Updates settings', (done) => {
      const instance = new PreferencesManager({
        file: file
      });
      const timeout = setTimeout(() => {
        assert.equal(instance.__settings[name], value, 'Value set on the instance');
        fs.readJson(file)
        .then((data) => {
          assert.equal(data[name], value, 'Value stored in file');
          done();
        });
      }, 500);
      instance._changeHandler({
        sender: {
          send: function(type, name, message) {
            clearTimeout(timeout);
            done(new Error(message));
          }
        }
      }, name, value);
    });

    it('Notifies the change', (done) => {
      const instance = new PreferencesManager({
        file: file
      });
      instance.once('settings-changed', (n, v) => {
        assert.equal(n, name);
        assert.equal(v, value);
        done();
      });
      instance._changeHandler({
        sender: {
          send: function() {}
        }
      }, name, value);
    });
  });
});
