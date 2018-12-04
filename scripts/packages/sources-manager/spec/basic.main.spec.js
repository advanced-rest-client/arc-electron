const assert = require('chai').assert;
const fs = require('fs-extra');
const {SourcesManager} = require('../main');
const {ArcPreferences} = require('../../arc-preferences');

describe('SourcesManager basic tests- main process', function() {
  const prefsFile = './test-prefs.json';
  const prefs = new ArcPreferences({
    file: prefsFile
  });

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
