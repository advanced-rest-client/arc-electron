const { assert } = require('chai');
const fs = require('fs-extra');
const path = require('path');
const _require = require('esm')(module);
const testPaths = require('../setup-paths.js');

const { ThemePluginsManager } = _require('../../src/io/ThemePluginsManager.js');
const { setLevel } = _require('../../src/io/Logger');

/** @typedef {import('../../src/io/ThemePluginsManager').ThemePluginsManager} ThemePluginsManager */

setLevel('error');

describe('ThemePluginsManager - main process', () => {
  let basePath;

  before(async () => {
    basePath = testPaths.getBasePath();
    const logFile = path.join(basePath, 'log.log');
    await fs.ensureFile(logFile);
  });

  after(() => fs.remove(basePath));

  describe('themeInfo getter', () => {
    let instance = /** @type ThemePluginsManager */ (null);
    beforeEach(() => {
      instance = new ThemePluginsManager();
    });

    it('Returns an instance of ThemeInfo', () => {
      const result = instance.themeInfo;
      assert.equal(result.constructor.name, 'ThemeInfo');
    });

    it('settingsFile is set', () => {
      const result = instance.themeInfo;
      assert.equal(result.settingsFile, process.env.ARC_THEMES_SETTINGS);
    });

    it('Always returns new instance', () => {
      const i1 = instance.themeInfo;
      const i2 = instance.themeInfo;
      assert.isFalse(i1 === i2);
    });
  });

  describe('resolvePath()', () => {
    let instance = /** @type ThemePluginsManager */ (null);
    beforeEach(() => {
      instance = new ThemePluginsManager();
    });

    it('Reads home path', () => {
      const result = instance.resolvePath('~/test');
      assert.equal(result.indexOf('~/'), -1);
    });
  });

  describe('_ensureSymlinkPath()', () => {
    afterEach(() => fs.remove(basePath));

    let instance = /** @type ThemePluginsManager */ (null);
    beforeEach(() => {
      instance = new ThemePluginsManager();
    });

    it('Creates path to the location', async () => {
      const loc = path.join(basePath, 'a', 'b', 'c');
      await instance._ensureSymlinkPath(loc);
      const exists = await fs.pathExists(path.join(basePath, 'a', 'b'));
      assert.isTrue(exists);
    });

    it('Last folder is not created', async () => {
      const loc = `${basePath}/a/b/c`;
      await instance._ensureSymlinkPath(loc);
      const exists = await fs.pathExists(path.join(basePath, 'a', 'b', 'c'));
      assert.isFalse(exists);
    });
  });

  describe('_installLocalPackage()', () => {
    const localPackage = path.join(__dirname, 'local-package');
    afterEach(() => fs.remove(basePath));

    let instance = /** @type ThemePluginsManager */ (null);
    beforeEach(() => {
      instance = new ThemePluginsManager();
    });

    it('creates the symlink', async () => {
      await instance._installLocalPackage(localPackage);
      const exists = await fs.pathExists(path.join(process.env.ARC_THEMES, 'test-package'));
      assert.isTrue(exists);
    });

    it('returns package info object', async () => {
      const result = await instance._installLocalPackage(localPackage);
      assert.typeOf(result, 'object');
    });

    it('Has package name', async () => {
      const result = await instance._installLocalPackage(localPackage);
      assert.equal(result.name, 'test-package');
    });

    it('isSymlink is set', async () => {
      const result = await instance._installLocalPackage(localPackage);
      assert.isTrue(result.isSymlink);
    });

    it('version is set', async () => {
      const result = await instance._installLocalPackage(localPackage);
      assert.equal(result.version, '0.1.0');
    });

    it('location is set', async () => {
      const result = await instance._installLocalPackage(localPackage);
      assert.equal(result.location, path.join(process.env.ARC_THEMES, 'test-package'));
    });

    it('mainFile is set', async () => {
      const result = await instance._installLocalPackage(localPackage);
      assert.equal(result.mainFile, path.join(process.env.ARC_THEMES, 'test-package', 'theme.css'));
    });
  });

  // these tests made the tests to silently stop...
  describe.skip('_installRemotePackage()', () => {
    afterEach(() => fs.remove(basePath));

    const pkgName = 'advanced-rest-client/arc-electron-default-theme';
    const pkgVersion = '3.0.4';

    it('installs GitHub package', async () => {
      const instance = new ThemePluginsManager();
      await instance._installRemotePackage(`@${pkgName}`, pkgVersion);
      const exists = await fs.pathExists(path.join(process.env.ARC_THEMES, '@advanced-rest-client', 'arc-electron-default-theme'));
      assert.isTrue(exists);
    });

    it('returns info object', async () => {
      const instance = new ThemePluginsManager();
      const result = await instance._installRemotePackage(`@${pkgName}`, pkgVersion);
      assert.typeOf(result, 'object');
      assert.equal(result.name, '@advanced-rest-client/arc-electron-default-theme');
      assert.equal(result.version, pkgVersion);
      assert.equal(result.location, path.join(process.env.ARC_THEMES, `@${pkgName}`));
      assert.equal(result.mainFile,path.join(process.env.ARC_THEMES, `@${pkgName}`, 'arc-electron-default-theme.css'));
    });
  });

  describe('uninstall()', () => {
    describe('Local package', () => {
      let instance = /** @type ThemePluginsManager */ (null);
      const pkgName = 'test-package';
      const localPackage = path.join(__dirname, 'local-package');
      beforeEach(async () => {
        instance = new ThemePluginsManager();
        await instance.install(localPackage);
        const exists = await fs.pathExists(path.join(process.env.ARC_THEMES, 'test-package'));
        assert.isTrue(exists, 'has the installed package in the themes location');
        const exists2 = await fs.pathExists(path.join(process.env.ARC_THEMES, 'themes-info.json'))
        assert.isTrue(exists2, 'has the theme info file');
      });

      afterEach(() => fs.remove(basePath));

      it('Removes local package', async () => {
        await instance.uninstall(pkgName);
        const exists  = await fs.pathExists(path.join(process.env.ARC_THEMES, 'test-package'));
        assert.isFalse(exists);
      });

      it('Removes entry from info file.', async () => {
        await instance.uninstall(pkgName);
        const data = await fs.readJson(process.env.ARC_THEMES_SETTINGS);
        assert.typeOf(data.themes, 'array');
        assert.lengthOf(data.themes, 0);
      });
    });

    describe.skip('Remote package', () => {
      let instance = /** @type ThemePluginsManager */ (null);
      const pkgName = 'advanced-rest-client/arc-electron-default-theme';
      const installedName = `@${pkgName}`;
      const pkgVersion = '3.0.4';
      let installedLocation;

      before(async () => {
        installedLocation = path.join(process.env.ARC_THEMES, '@advanced-rest-client', 'arc-electron-default-theme');
        instance = new ThemePluginsManager();
        await instance.install(installedName, pkgVersion);
      });

      after(() => fs.remove(basePath));

      it('has the installed package', async () => {
        const exists = await fs.pathExists(installedLocation)
        assert.isTrue(exists);
      });

      it('has the entry in the theme info file.', async () => {
        const exists = await fs.pathExists(process.env.ARC_THEMES_SETTINGS)
        assert.isTrue(exists);
      });

      it('removes remote package', async () => {
        await instance.uninstall(installedName);
        const exists = await fs.pathExists(installedLocation);
        assert.isFalse(exists);
      });

      it('removes entry from the info file.', async () => {
        const data = await fs.readJson(path.join(process.env.ARC_THEMES_SETTINGS));
        assert.typeOf(data.themes, 'array');
        assert.lengthOf(data.themes, 0);
      });
    });
  });
});
