const assert = require('chai').assert;
const path = require('path');
const fs = require('fs-extra');
const {WorkspaceManager} = require('../renderer');

describe('ArcPreferencesProxy class - renderer process', function() {
  function fire(type, detail) {
    const e = new CustomEvent(type, {
      bubbles: true,
      cancelable: true,
      detail
    });
    document.body.dispatchEvent(e);
    return e;
  }
  const file = path.join('test', 'workspace.json');
  const defaultSate = {
    requests: [],
    selected: 0,
    environment: 'default'
  };

  describe('Web events', function() {
    describe('Read event', function() {
      const type = 'workspace-state-read';
      let instance;
      beforeEach(() => {
        instance = new WorkspaceManager(0, {file});
        instance.observe();
      });
      afterEach(() => {
        instance.unobserve();
        return fs.remove(file);
      });

      it('Cancels the custom event', function(done) {
        const e = fire(type, {});
        e.detail.result
        .then(() => {
          setTimeout(() => {
            assert.isTrue(e.defaultPrevented);
            done();
          }, 1);
        });
      });

      it('Returns default worspace state', function(done) {
        const e = fire(type, {});
        e.detail.result
        .then((data) => {
          setTimeout(() => {
            assert.deepEqual(data, defaultSate);
            done();
          }, 1);
        });
      });

      it('Returns file contents', function(done) {
        const data = {test: true};
        fs.outputJson(file, data)
        .then(() => {
          const e = fire(type, {});
          return e.detail.result;
        })
        .then((state) => {
          setTimeout(() => {
            assert.deepEqual(state, data);
            done();
          }, 1);
        });
      });
    });

    describe('Store event', function() {
      const type = 'workspace-state-store';
      const data = {
        workspaceTest: true
      };
      let instance;
      beforeEach(() => {
        instance = new WorkspaceManager(0, {file});
        instance.observe();
        instance.initialized = true;
        instance.storeDebounce = 1;
      });
      afterEach(() => {
        instance.unobserve();
        return fs.remove(file);
      });

      it('Cancels custom event', function(done) {
        const e = fire(type, {value: data});
        assert.isTrue(e.defaultPrevented);
        setTimeout(() => done(), instance.storeDebounce + 1);
      });

      it('Updates "__settings" object', function(done) {
        fire(type, {value: data});
        assert.deepEqual(instance.__settings, data);
        setTimeout(() => done(), instance.storeDebounce + 1);
      });

      it('Stores data in file after storeDebounce time', function(done) {
        fire(type, {value: data});
        setTimeout(() => {
          fs.readJson(file)
          .then((state) => {
            assert.deepEqual(state, data);
            done();
          });
        }, instance.storeDebounce + 1);
      });
    });
  });
});
