const assert = require('chai').assert;
const path = require('path');
const fs = require('fs-extra');
const {ArcPreferences} = require('../');

describe('ArcPreferences class - renderer process', function() {
  const file = path.join('test', 'test.json');

  describe('Setting up paths', function() {
    it('Sets default paths', function() {
      const instance = new ArcPreferences();
      assert.typeOf(instance.userSettingsDir, 'string');
      assert.typeOf(instance.settingsFile, 'string');
    });

    it('Default file is settings.json', function() {
      const instance = new ArcPreferences();
      assert.notEqual(instance.settingsFile.indexOf('settings.json'), -1);
    });

    it('Accepts "file" option', function() {
      const data = 'path/to/a/file.json';
      const instance = new ArcPreferences({
        file: data
      });
      assert.equal(instance.settingsFile, data);
    });

    it('Accepts "fileName" option', function() {
      const data = 'other-file.json';
      const instance = new ArcPreferences({
        fileName: data
      });
      assert.notEqual(instance.settingsFile.indexOf(data), -1);
    });

    it('Accepts "filePath" option', function() {
      const data = 'path/to/a/file/';
      const instance = new ArcPreferences({
        filePath: data
      });
      assert.equal(instance.settingsFile, data + 'settings.json');
    });

    it('Accepts "filePath" and "fileName" option', function() {
      const p = 'path/to/a';
      const f = 'file.json';
      const instance = new ArcPreferences({
        filePath: p,
        fileName: f
      });
      assert.equal(instance.settingsFile, 'path/to/a/file.json');
    });

    it('File overrides other options', function() {
      const p = 'path/to/a';
      const f = 'file.json';
      const data = 'path/to/a/file.json';
      const instance = new ArcPreferences({
        filePath: p,
        fileName: f,
        file: data
      });
      assert.equal(instance.settingsFile, data);
    });
  });

  describe('_resolvePath()', function() {
    let instance;
    before(() => {
      instance = new ArcPreferences();
    });

    it('Resolves ~ as home dir', function() {
      const data = '~/path';
      const result = instance._resolvePath(data);
      assert.notEqual(result, data);
      assert.equal(result.indexOf('~'), -1);
      assert.notEqual(result.indexOf('/path'), -1);
    });

    it('Returns the same path', function() {
      const data = 'path/to/a/file.json';
      const result = instance._resolvePath(data);
      assert.equal(result, data);
    });
  });

  describe('_restoreFile()', function() {
    after(() => {
      return fs.remove(file);
    });

    it('Creates the file', function() {
      const instance = new ArcPreferences();
      return instance._restoreFile(file)
      .then(() => fs.pathExists(file))
      .then((exists) => assert.isTrue(exists));
    });

    it('Reads file content', () => {
      const data = {
        test: true,
        _restoreFile: true
      };
      const instance = new ArcPreferences();
      return fs.outputJson(file, data)
      .then(() => instance._restoreFile(file))
      .then((content) => {
        assert.deepEqual(content, data);
      });
    });
  });

  describe('_storeFile()', () => {
    const data = {
      test: true,
      _storeFile: true
    };

    after(() => {
      return fs.remove(file);
    });

    it('Creates the file', function() {
      const instance = new ArcPreferences();
      return instance._storeFile(file, data)
      .then(() => fs.pathExists(file))
      .then((exists) => assert.isTrue(exists));
    });

    it('Writes to the file', function() {
      const instance = new ArcPreferences();
      return instance._storeFile(file, data)
      .then(() => fs.readJson(file))
      .then((content) => {
        assert.deepEqual(content, data);
      });
    });
  });

  describe('load()', function() {
    const data = {
      test: true,
      load: true
    };

    after(() => {
      return fs.remove(file);
    });

    it('Returns empty data for non existing file', function() {
      const instance = new ArcPreferences({
        file
      });
      return instance.load()
      .then((content) => {
        assert.deepEqual(content, {});
      });
    });

    it('Returns defaultSettings for non existing file', function() {
      const instance = new ArcPreferences({
        file
      });
      instance.defaultSettings = function() {
        return Promise.resolve(data);
      };
      return instance.load()
      .then((content) => {
        assert.deepEqual(content, data);
      });
    });

    it('Creates the file with default data', function() {
      const instance = new ArcPreferences({
        file
      });
      instance.defaultSettings = function() {
        return Promise.resolve(data);
      };
      return instance.load()
      .then(() => fs.readJson(file))
      .then((content) => {
        assert.deepEqual(content, data);
      });
    });

    it('Sets up "__settings"', function() {
      const instance = new ArcPreferences({
        file
      });
      instance.defaultSettings = function() {
        return Promise.resolve(data);
      };
      return instance.load()
      .then(() => {
        assert.deepEqual(instance.__settings, data);
      });
    });

    it('Returns "__settings" when available', function() {
      const instance = new ArcPreferences({
        file
      });
      instance.defaultSettings = function() {
        return Promise.resolve(data);
      };
      let settings;
      return instance.load()
      .then(() => {
        settings = instance.__settings;
        settings.testValue = true;
        return instance.load();
      })
      .then((content) => {
        assert.deepEqual(content, settings);
      });
    });
  });
});
