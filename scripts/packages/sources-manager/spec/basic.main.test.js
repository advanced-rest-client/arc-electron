const assert = require('chai').assert;
const fs = require('fs-extra');
const {SourcesManager} = require('../main');
const {ArcPreferences} = require('@advanced-rest-client/arc-electron-preferences');

describe('SourcesManager basic tests- main process', function() {
  const prefsFile = './test-prefs.json';
  const prefs = new ArcPreferences({
    file: prefsFile
  });
  const themes = [{
    _id: 'dd1b715f-af00-4ee8-8b0c-2a262b3cf0c8',
    path: 'default',
    main: 'default.html'
  }];

  after(() => fs.remove(prefsFile));

  describe('resolvePath()', function() {
    let instance;
    before(() => {
      instance = new SourcesManager(prefs, {});
    });

    it('Reads home path', function() {
      const result = instance.resolvePath('~/test');
      assert.equal(result.indexOf('~/'), -1);
    });
  });

  describe('_getAppComponentsLocation()', function() {
    let instance;
    before(() => {
      instance = new SourcesManager(prefs, {});
    });

    it('Returns startup option', function() {
      const so = {
        appComponents: 'test-path'
      };
      const result = instance._getAppComponentsLocation({}, so);
      assert.equal(result, so.appComponents);
    });

    it('Returns default path', function() {
      const so = {};
      const result = instance._getAppComponentsLocation({}, so);
      assert.equal(result, 'components/default');
    });
  });

  describe('_getImportFileLocation()', function() {
    let instance;
    before(() => {
      instance = new SourcesManager(prefs, {});
    });

    it('Returns startup option', function() {
      const so = {
        importFile: 'test-path'
      };
      const result = instance._getImportFileLocation({}, so);
      assert.equal(result, so.importFile);
    });

    it('Returns default path', function() {
      const result = instance._getImportFileLocation({}, {});
      assert.notEqual(result.indexOf('components/default/import.html'), -1);
    });
  });

  describe('_getSearchFileLocation()', function() {
    let instance;
    before(() => {
      instance = new SourcesManager(prefs, {});
    });

    it('Returns startup option', function() {
      const so = {
        searchFile: 'test-path'
      };
      const result = instance._getSearchFileLocation({}, so, themes);
      assert.equal(result, so.searchFile);
    });

    it('Returns default path', function() {
      const result = instance._getSearchFileLocation({}, {}, themes);
      assert.notEqual(result.indexOf('components/default/import-search-bar.html'), -1);
    });
  });

  describe('getAppConfig()', function() {
    it('Reads default config', function() {
      const instance = new SourcesManager(prefs, {});
      return instance.getAppConfig()
      .then((info) => {
        assert.equal(info.appComponents, 'components/default');
        assert.notEqual(info.importFile.indexOf('components/default/import.html'), -1);
        assert.notEqual(info.searchFile.indexOf('components/default/import-search-bar.html'), -1);
        assert.equal(info.theme, instance.defaultTheme);
      });
    });
  });
});
