const assert = require('chai').assert;
const fs = require('fs-extra');
const {ArcMeta} = require('../main');

describe('ArcMeta class - main process', function() {
  describe('File path', function() {
    it('Sets correct file path', function() {
      const instance = new ArcMeta();
      assert.notEqual(instance.settingsFile.indexOf('app-meta.json'), -1);
    });
  });

  describe('Reading data', function() {
    let instance;
    after(() => fs.remove(instance.settingsFile));

    beforeEach(() => {
      instance = new ArcMeta();
    });

    it('Creates the settings', (done) => {
      instance.load()
      .then((meta) => {
        // load settings has `catch` function.
        setTimeout(() => {
          assert.typeOf(meta, 'object', 'Returns is an object');
          assert.typeOf(meta.appId, 'string', 'appId is set');
          assert.typeOf(meta.aid, 'string', 'aid is set');
          done();
        }, 1);
      });
    });

    it('Created data is persistent', (done) => {
      let createdAppId;
      let createdAid;
      instance.load()
      .then((meta) => {
        createdAppId = meta.appId;
        createdAid = meta.aid;
        const other = new ArcMeta();
        return other.load();
      })
      .then((meta) => {
        setTimeout(() => {
          assert.equal(meta.appId, createdAppId);
          assert.equal(meta.aid, createdAid);
          done();
        }, 1);
      });
    });

    const data = {
      appId: 'appid-test',
      aid: 'aid-test'
    };

    it('getAppId() returns the id', (done) => {
      fs.outputJson(instance.settingsFile, data)
      .then(() => instance.getAppId())
      .then((appId) => {
        setTimeout(() => {
          assert.equal(appId, data.appId);
          done();
        }, 1);
      });
    });

    it('getAninimizedId() returns the id', (done) => {
      fs.outputJson(instance.settingsFile, data)
      .then(() => instance.getAninimizedId())
      .then((aid) => {
        setTimeout(() => {
          assert.equal(aid, data.aid);
          done();
        }, 1);
      });
    });
  });
});
