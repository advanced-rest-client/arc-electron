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
});
