const assert = require('chai').assert;
const fs = require('fs-extra');
const path = require('path');
const { ThemeDefaults } = require('../../../scripts/main/defaults/theme-defaults.js');

describe.only('ThemeDefaults', function() {
  const themePath = './test/scripts/main/theme';
  const basePath = path.join(themePath, '@advanced-rest-client');
  const defaultFile = path.join(basePath, 'arc-electron-default-theme', 'arc-electron-default-theme.css');
  const defaultPackage = path.join(basePath, 'arc-electron-default-theme', 'package.json');
  const anypointFile = path.join(basePath, 'arc-electron-anypoint-theme', 'arc-electron-anypoint-theme.css');
  const anypointPackage = path.join(basePath, 'arc-electron-anypoint-theme', 'package.json');
  const darkFile = path.join(basePath, 'arc-electron-dark-theme', 'arc-electron-dark-theme.css');
  const darkPackage = path.join(basePath, 'arc-electron-dark-theme', 'package.json');
  const themeInfo = path.join(themePath, 'themes-info.json');

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
    beforeEach(function() {
      instance = new ThemeDefaults();
      instance.themePath = themePath;
    });

    afterEach(function() {
      return fs.remove(instance.themePath);
    });

    async function testContents(themeFile, pkgFile) {
      const fileExists = await fs.exists(themeFile);
      assert.isTrue(fileExists, 'Main file exists');
      const pkgExists = await fs.exists(pkgFile);
      assert.isTrue(pkgExists, 'Package file exists');
    }

    it('Copies default theme files', async () => {
      await instance.prepareEnvironment();
      await testContents(defaultFile, defaultPackage);
    });

    it('Copies anypoint theme files', async () => {
      await instance.prepareEnvironment();
      await testContents(anypointFile, anypointPackage);
    });

    it('Copies dark theme files', async () => {
      await instance.prepareEnvironment();
      await testContents(darkFile, darkPackage);
    });

    it('Copies theme info file', async () => {
      await instance.prepareEnvironment();
      const exists = await fs.exists(themeInfo);
      assert.isTrue(exists, 'File exists');
    });
  });

  describe('Updating preinstalled theme files', () => {
    beforeEach(function() {
      instance = new ThemeDefaults();
      instance.themePath = themePath;
    });

    afterEach(function() {
      return fs.remove(instance.themePath);
    });

    async function installDummy(version) {
      version = version || '1.0.0';
      await fs.outputFile(defaultFile, 'not-a-theme-file');
      await fs.writeJson(defaultPackage, {
        version
      });
    }

    it('updates pre-installed theme file', async () => {
      await installDummy();
      await instance.prepareEnvironment();
      const contents = await fs.readFile(defaultFile, 'utf8');
      assert.notEqual(contents, 'not-a-theme-file');
    });
  });
});
