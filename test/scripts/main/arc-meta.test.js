const assert = require('chai').assert;
const fs = require('fs-extra');
const path = require('path');
const {ArcMeta} = require('../../../scripts/main/arc-meta.js');

describe('ArcMeta', function() {
  let instance;
  const settingsPath = './test/scripts/main/settings-test';
  const metaFile = path.join(settingsPath, 'app-meta.json');

  describe('_defaultMeta()', function() {
    before(function() {
      instance = new ArcMeta();
    });

    it('Returns a promise', function() {
      const result = instance._defaultMeta();
      assert.typeOf(result.then, 'function');
      return result;
    });

    it('Creates a meta default object', function() {
      return instance._defaultMeta()
      .then((data) => {
        assert.typeOf(data, 'object');
        assert.typeOf(data.appId, 'string');
        assert.typeOf(data.aid, 'string');
      });
    });
  });

  describe('_processMeta()', function() {
    beforeEach(function() {
      instance = new ArcMeta();
      instance.userSettingsDir = settingsPath;
      instance.metaFile = metaFile;
    });

    afterEach(function() {
      return fs.remove(settingsPath);
    });

    it('Returns a promise', function() {
      const result = instance._processMeta();
      assert.typeOf(result.then, 'function');
      return result;
    });

    it('Creates a meta file', function() {
      return instance._processMeta()
      .then(() => fs.exists(metaFile))
      .then((exists) => assert.isTrue(exists, 'Main file exists'));
    });
  });

  describe('getMeta()', function() {
    beforeEach(function() {
      instance = new ArcMeta();
      instance.userSettingsDir = settingsPath;
      instance.metaFile = metaFile;
    });

    afterEach(function() {
      return fs.remove(settingsPath);
    });

    it('Returns a promise', function() {
      const result = instance.getMeta();
      assert.typeOf(result.then, 'function');
      return result;
    });

    it('Resolves to a meta data', function() {
      return instance.getMeta()
      .then((data) => {
        assert.typeOf(data, 'object');
        assert.typeOf(data.appId, 'string');
        assert.typeOf(data.aid, 'string');
      })
      .then(() => fs.exists(metaFile))
      .then((exists) => assert.isTrue(exists, 'Main file exists'));
    });
  });

  describe('getMeta()', function() {
    beforeEach(function() {
      instance = new ArcMeta();
      instance.userSettingsDir = settingsPath;
      instance.metaFile = metaFile;
      return instance.getMeta()
      .then(() => {
        instance._meta.appId = 'test-app-id';
        instance._meta.aid = 'test-a-id';
        return instance.updateMeta();
      })
      .then(() => {
        instance._meta = undefined;
      });
    });

    afterEach(function() {
      return fs.remove(settingsPath);
    });

    it('Restores appId', function() {
      return instance.getMeta()
      .then((data) => assert.equal(data.appId, 'test-app-id'));
    });

    it('Restores aid', function() {
      return instance.getMeta()
      .then((data) => assert.equal(data.aid, 'test-a-id'));
    });
  });
});
