const assert = require('chai').assert;
const fs = require('fs-extra');
const path = require('path');
const {ThemeDefaults} = require('../../../scripts/main/defaults/theme-defaults.js');

describe('ThemeDefaults', function() {
  let instance;
  describe('Basics', function() {
    before(function() {
      instance = new ThemeDefaults();
    });

    it('Sets themePath property', function() {
      assert.typeOf(instance.themePath, 'string');
    });
  });

  describe('prepareEnvironment()', function() {
    const themePath = './test/scripts/main/theme';
    const defaultFile = path.join(themePath, 'default-theme', 'default-theme.html');
    const defaultPackage = path.join(themePath, 'default-theme', 'package.json');
    const anypointFile = path.join(themePath, 'anypoint-theme', 'anypoint-theme.html');
    const anypointPackage = path.join(themePath, 'anypoint-theme', 'package.json');
    const themeInfo = path.join(themePath, 'themes-info.json');
    before(function() {
      instance = new ThemeDefaults();
      instance.themePath = themePath;
    });

    afterEach(function() {
      return fs.remove(instance.themePath);
    });

    it('Returns a promise', function() {
      const result = instance.prepareEnvironment();
      assert.typeOf(result.then, 'function');
      return result;
    });

    it('Copies default theme files', function() {
      return instance.prepareEnvironment()
      .then(() => fs.exists(defaultFile))
      .then((exists) => assert.isTrue(exists, 'Main file exists'))
      .then(() => fs.exists(defaultPackage))
      .then((exists) => assert.isTrue(exists, 'Package file exists'));
    });

    it('Copies anypoint theme files', function() {
      return instance.prepareEnvironment()
      .then(() => fs.exists(anypointFile))
      .then((exists) => assert.isTrue(exists, 'Main file exists'))
      .then(() => fs.exists(anypointPackage))
      .then((exists) => assert.isTrue(exists, 'Package file exists'));
    });

    it('Copies theme info file', function() {
      return instance.prepareEnvironment()
      .then(() => fs.exists(themeInfo))
      .then((exists) => assert.isTrue(exists, 'File exists'));
    });
  });
});
