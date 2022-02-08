/* eslint-disable no-param-reassign */
const { assert } = require('chai');
const fs = require('fs-extra');
const path = require('path');
const _require = require('esm')(module);
const testPaths = require('../setup-paths');

testPaths.getBasePath();

const { ThemeDefaults } = _require('../../src/io/defaults/ThemeDefaults');
const { setLevel } = _require('../../src/io/Logger');

/** @typedef {import('../../src/io/defaults/ThemeDefaults').ThemeDefaults} ThemeDefaults */

setLevel('error');

describe('ThemeDefaults', () => {
  const basePath = path.join(process.env.ARC_THEMES, '@advanced-rest-client');
  const defaultFile = path.join(basePath, 'arc-electron-default-theme', 'arc-electron-default-theme.css');
  const defaultPackage = path.join(basePath, 'arc-electron-default-theme', 'package.json');
  const anypointFile = path.join(basePath, 'arc-electron-anypoint-theme', 'arc-electron-anypoint-theme.css');
  const anypointPackage = path.join(basePath, 'arc-electron-anypoint-theme', 'package.json');
  const darkFile = path.join(basePath, 'arc-electron-dark-theme', 'arc-electron-dark-theme.css');
  const darkPackage = path.join(basePath, 'arc-electron-dark-theme', 'package.json');

  let instance = /** @type ThemeDefaults */ (null);

  describe('prepareEnvironment()', () => {
    beforeEach(() => {
      instance = new ThemeDefaults();
    });

    afterEach(async () => {
      await fs.remove(process.env.ARC_THEMES);
    });

    async function testContents(themeFile, pkgFile) {
      const fileExists = await fs.pathExists(themeFile);
      assert.isTrue(fileExists, 'Main file exists');
      const pkgExists = await fs.pathExists(pkgFile);
      assert.isTrue(pkgExists, 'Package file exists');
    }

    it('copies default theme files', async () => {
      await instance.prepareEnvironment();
      await testContents(defaultFile, defaultPackage);
    });

    it('copies anypoint theme files', async () => {
      await instance.prepareEnvironment();
      await testContents(anypointFile, anypointPackage);
      const fontsLocations = path.join(basePath, 'arc-electron-anypoint-theme', 'fonts');
      const fontsExists = await fs.pathExists(fontsLocations);
      assert.isTrue(fontsExists, 'fonts folder is copied');
      
      const fonts = [
        'DINPro-Light.ttf', 'DINPro-Light.woff', 'DINPro-Light.woff2',
        'OpenSans-Bold.ttf', 'OpenSans-Bold.woff', 'OpenSans-Bold.woff2',
        'OpenSans-Light.ttf', 'OpenSans-Light.woff', 'OpenSans-Light.woff2',
        'OpenSans-LightItalic.ttf', 'OpenSans-LightItalic.woff', 'OpenSans-LightItalic.woff2',
        'OpenSans-Regular.ttf', 'OpenSans-Regular.woff', 'OpenSans-Regular.woff2',
        'OpenSans-Semibold.ttf', 'OpenSans-Semibold.woff', 'OpenSans-Semibold.woff2',
        'SourceCodePro-Regular.ttf', 'SourceCodePro-Regular.woff', 'SourceCodePro-Regular.woff2',
      ];
      for await (const font of fonts) {
        const fontFile = path.join(basePath, 'arc-electron-anypoint-theme', 'fonts', font);
        const fontExists = await fs.pathExists(fontFile);
        assert.isTrue(fontExists, `${font} font is copied`);
      }
    });

    it('copies dark theme files', async () => {
      await instance.prepareEnvironment();
      await testContents(darkFile, darkPackage);
    });

    it('copies theme info file', async () => {
      await instance.prepareEnvironment();
      const exists = await fs.pathExists(process.env.ARC_THEMES_SETTINGS);
      assert.isTrue(exists, 'File exists');
    });
  });

  describe('Updating preinstalled theme files', () => {
    beforeEach(() => {
      instance = new ThemeDefaults();
    });

    afterEach(async () => {
      await fs.remove(process.env.ARC_THEMES);
    });

    async function installDummy(version='0.0.0') {
      await fs.outputFile(defaultFile, 'not-a-theme-file');
      await fs.writeJson(defaultPackage, {
        version
      });
    }

    async function installDb() {
      const db = await fs.readJson(path.join(__dirname, '..', '..', 'appresources', 'themes', 'themes-info.json'));
      db.themes.forEach((item) => { item.version = '0.0.0' });
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

    it('updates the db', async () => {
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

  describe('_readDefaultThemesPackages()', () => {
    before(() => {
      instance = new ThemeDefaults();
    });

    it('reads theme info', async () => {
      const result = await instance._readDefaultThemesPackages();
      assert.typeOf(result, 'array', 'returns the array');
      assert.lengthOf(result, 3, 'has all default themes');
    });

    it('has the Anypoint theme info', async () => {
      const result = await instance._readDefaultThemesPackages();
      const info = result.find(i => i.name === '@advanced-rest-client/arc-electron-anypoint-theme');
      assert.ok(info, 'has the theme');
      assert.equal(info.main, 'arc-electron-anypoint-theme.css', 'sets the "main"');
      assert.include(info.location, '/appresources/themes/@advanced-rest-client/arc-electron-anypoint-theme', 'sets the "location"');
      assert.include(info.files, 'fonts', 'has the "fonts" dependency');
    });

    it('has the dark theme info', async () => {
      const result = await instance._readDefaultThemesPackages();
      const info = result.find(i => i.name === '@advanced-rest-client/arc-electron-dark-theme');
      assert.ok(info, 'has the theme');
      assert.equal(info.main, 'arc-electron-dark-theme.css', 'sets the "main"');
      assert.include(info.location, '/appresources/themes/@advanced-rest-client/arc-electron-dark-theme', 'sets the "location"');
    });

    it('has the default theme info', async () => {
      const result = await instance._readDefaultThemesPackages();
      const info = result.find(i => i.name === '@advanced-rest-client/arc-electron-default-theme');
      assert.ok(info, 'has the theme');
      assert.equal(info.main, 'arc-electron-default-theme.css', 'sets the "main"');
      assert.include(info.location, '/appresources/themes/@advanced-rest-client/arc-electron-default-theme', 'sets the "location"');
    });
  });
});
