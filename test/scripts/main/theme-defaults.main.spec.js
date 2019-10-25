const assert = require('chai').assert;
const fs = require('fs-extra');
const path = require('path');
const { ThemeDefaults } = require('../../../scripts/main/defaults/theme-defaults.js');

const testPaths = require('../../setup-paths');
testPaths.getBasePath();

describe('ThemeDefaults', function() {
  const basePath = path.join(process.env.ARC_THEMES, '@advanced-rest-client');
  const defaultFile = path.join(basePath, 'arc-electron-default-theme', 'arc-electron-default-theme.css');
  const defaultPackage = path.join(basePath, 'arc-electron-default-theme', 'package.json');
  const anypointFile = path.join(basePath, 'arc-electron-anypoint-theme', 'arc-electron-anypoint-theme.css');
  const anypointPackage = path.join(basePath, 'arc-electron-anypoint-theme', 'package.json');
  const darkFile = path.join(basePath, 'arc-electron-dark-theme', 'arc-electron-dark-theme.css');
  const darkPackage = path.join(basePath, 'arc-electron-dark-theme', 'package.json');

  let instance;

  describe('prepareEnvironment()', function() {
    beforeEach(function() {
      instance = new ThemeDefaults();
    });

    afterEach(function() {
      return fs.remove(process.env.ARC_THEMES);
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
      const exists = await fs.exists(process.env.ARC_THEMES_SETTINGS);
      assert.isTrue(exists, 'File exists');
    });
  });

  describe('Updating preinstalled theme files', () => {
    beforeEach(function() {
      instance = new ThemeDefaults();
    });

    afterEach(function() {
      return fs.remove(process.env.ARC_THEMES);
    });

    async function installDummy(version) {
      version = version || '0.0.0';
      await fs.outputFile(defaultFile, 'not-a-theme-file');
      await fs.writeJson(defaultPackage, {
        version
      });
    }

    async function installDb() {
      const db = await fs.readJson(
        path.join(__dirname, '..', '..', '..', 'appresources', 'themes', 'themes-info.json'));
      db.themes.forEach((item) => item.version = '0.0.0');
      await fs.outputJson(process.env.ARC_THEMES_SETTINGS, db);
    }

    it('updates pre-installed theme file', async () => {
      await installDummy();
      await instance.prepareEnvironment();
      const contents = await fs.readFile(defaultFile, 'utf8');
      assert.notEqual(contents, 'not-a-theme-file', 'Theme content has changed');
      const pkg = await fs.readJson(defaultPackage);
      assert.typeOf(pkg.version, 'string', 'Theme package has a version');
      assert.notEqual(pkg.version, '0.0.0', 'Package version is updated');
    });

    it('updates indo db', async () => {
      await installDummy();
      await installDb();
      await instance.prepareEnvironment();
      const db = await fs.readJson(process.env.ARC_THEMES_SETTINGS);
      db.themes.forEach((item) => {
        assert.typeOf(item.version, 'string', 'Theme has a version');
        assert.notEqual(item.version, '0.0.0', 'Theme version is updated');
      });
    });
  });
});
