const assert = require('chai').assert;
const fs = require('fs-extra');
const path = require('path');
const { ThemePluginsManager } = require('../../scripts/packages/plugin-manager/main');
const testPaths = require('../setup-paths');

describe('ThemePluginsManager - main process', function() {
  let basePath;

  before(async () => {
    basePath = testPaths.getBasePath();
    const logFile = path.join(basePath, 'log.log');
    await fs.ensureFile(logFile);
  });

  after(() => fs.remove(basePath));

  describe('pluginManager getter', () => {
    let instance;
    beforeEach(() => {
      instance = new ThemePluginsManager();
    });

    it('Returns an instance of PluginManager', function() {
      const result = instance.pluginManager;
      assert.equal(result.constructor.name, 'PluginManager');
    });

    it('cwd is set', function() {
      const result = instance.pluginManager;
      assert.equal(result.options.cwd, process.env.ARC_THEMES);
    });

    it('pluginsPath is set', function() {
      const result = instance.pluginManager;
      assert.equal(result.options.pluginsPath, process.env.ARC_THEMES);
    });

    it('Always returns the same instance', () => {
      const i1 = instance.pluginManager;
      const i2 = instance.pluginManager;
      assert.isTrue(i1 === i2);
    });
  });

  describe('themeInfo getter', () => {
    let instance;
    beforeEach(() => {
      instance = new ThemePluginsManager();
    });

    it('Returns an instance of ThemeInfo', function() {
      const result = instance.themeInfo;
      assert.equal(result.constructor.name, 'ThemeInfo');
    });

    it('settingsFile is set', function() {
      const result = instance.themeInfo;
      assert.equal(result.settingsFile, process.env.ARC_THEMES_SETTINGS);
    });

    it('Always returns new instance', () => {
      const i1 = instance.themeInfo;
      const i2 = instance.themeInfo;
      assert.isFalse(i1 === i2);
    });
  });

  describe('resolvePath()', function() {
    let instance;
    beforeEach(() => {
      instance = new ThemePluginsManager();
    });

    it('Reads home path', function() {
      const result = instance.resolvePath('~/test');
      assert.equal(result.indexOf('~/'), -1);
    });
  });

  describe('_ensureSymlinkPath()', () => {
    afterEach(() => fs.remove(basePath));

    let instance;
    beforeEach(() => {
      instance = new ThemePluginsManager();
    });

    it('Creates path to the location', () => {
      const loc = path.join(basePath, 'a', 'b', 'c');
      return instance._ensureSymlinkPath(loc)
      .then(() => fs.pathExists(path.join(basePath, 'a', 'b')))
      .then((exists) => assert.isTrue(exists));
    });

    it('Last folder is not created', () => {
      const loc = basePath + '/a/b/c';
      return instance._ensureSymlinkPath(loc)
      .then(() => fs.pathExists(path.join(basePath, 'a', 'b', 'c')))
      .then((exists) => assert.isFalse(exists));
    });
  });

  describe('_installLocalPackage()', () => {
    const localPackage = path.join(__dirname, 'local-package');
    afterEach(() => fs.remove(basePath));

    let instance;
    beforeEach(() => {
      instance = new ThemePluginsManager();
    });

    it('Creates a symlink', () => {
      return instance._installLocalPackage(localPackage)
      .then(() => fs.pathExists(path.join(process.env.ARC_THEMES, 'test-package')))
      .then((exists) => assert.isTrue(exists));
    });

    it('Returns package info object', () => {
      return instance._installLocalPackage(localPackage)
      .then((result) => {
        assert.typeOf(result, 'object');
      });
    });

    it('Has package name', () => {
      return instance._installLocalPackage(localPackage)
      .then((result) => {
        assert.equal(result.name, 'test-package');
      });
    });

    it('isSymlink is set', () => {
      return instance._installLocalPackage(localPackage)
      .then((result) => {
        assert.isTrue(result.isSymlink);
      });
    });

    it('version is set', () => {
      return instance._installLocalPackage(localPackage)
      .then((result) => {
        assert.equal(result.version, '0.1.0');
      });
    });

    it('location is set', () => {
      return instance._installLocalPackage(localPackage)
      .then((result) => {
        assert.equal(result.location, path.join(process.env.ARC_THEMES, 'test-package'));
      });
    });

    it('mainFile is set', () => {
      return instance._installLocalPackage(localPackage)
      .then((result) => {
        assert.equal(result.mainFile, path.join(process.env.ARC_THEMES, 'test-package', 'theme.css'));
      });
    });
  });

  describe('_installRemotePackage()', function() {
    afterEach(() => fs.remove(basePath));

    const pkgName = 'advanced-rest-client/arc-electron-default-theme';
    const pkgVersion = '2.0.0-preview';

    it('Installs GitHub package', function() {
      const instance = new ThemePluginsManager();
      return instance._installRemotePackage(pkgName, pkgVersion)
      .then(() => fs.pathExists(
        path.join(process.env.ARC_THEMES, '@advanced-rest-client', 'arc-electron-default-theme')))
      .then((exists) => assert.isTrue(exists));
    });

    it('Returns info object', function() {
      const instance = new ThemePluginsManager();
      return instance._installRemotePackage(pkgName, pkgVersion)
      .then((result) => {
        assert.typeOf(result, 'object');
        assert.equal(result.name, '@advanced-rest-client/arc-electron-default-theme');
        assert.equal(result.version, pkgVersion);
        assert.equal(result.location, path.join(process.env.ARC_THEMES, '@' + pkgName));
        assert.equal(result.mainFile,
          path.join(process.env.ARC_THEMES, '@' + pkgName, 'arc-electron-default-theme.html'));
      });
    });
  });

  describe('_createThemeInfo()', () => {
    const pkgName = 'test';
    let instance;
    let info;
    beforeEach(() => {
      instance = new ThemePluginsManager();
      info = {
        name: 'test-name',
        version: 'test-version',
        location: __dirname + '/local-package',
        mainFile: __dirname + '/local-package/theme.css',
        isSymlink: true
      };
    });

    it('Eventually returns an object', () => {
      return instance._createThemeInfo(pkgName, info)
      .then((result) => {
        assert.typeOf(result, 'object');
      });
    });

    it('_id is set', () => {
      return instance._createThemeInfo(pkgName, info)
      .then((result) => {
        assert.equal(result._id, pkgName);
      });
    });

    it('isSymlink is set', () => {
      return instance._createThemeInfo(pkgName, info)
      .then((result) => {
        assert.isTrue(result.isSymlink);
      });
    });

    it('name is set', () => {
      return instance._createThemeInfo(pkgName, info)
      .then((result) => {
        assert.equal(result.name, info.name);
      });
    });

    it('version is set', () => {
      return instance._createThemeInfo(pkgName, info)
      .then((result) => {
        assert.equal(result.version, info.version);
      });
    });

    it('location is set', () => {
      return instance._createThemeInfo(pkgName, info)
      .then((result) => {
        assert.equal(result.location, info.location);
      });
    });

    it('mainFile is set', () => {
      return instance._createThemeInfo(pkgName, info)
      .then((result) => {
        assert.equal(result.mainFile, info.mainFile);
      });
    });

    it('title is set from the package.json file', () => {
      return instance._createThemeInfo(pkgName, info)
      .then((result) => {
        assert.equal(result.title, 'Test title');
      });
    });

    it('description is set from the package.json file', () => {
      return instance._createThemeInfo(pkgName, info)
      .then((result) => {
        assert.equal(result.description, 'Test description');
      });
    });
  });

  describe('_addThemeEntry()', () => {
    let instance;
    let info;
    beforeEach(() => {
      instance = new ThemePluginsManager();
      info = {
        _id: 'test-id',
        name: 'test-name',
        version: 'test-version',
        location: __dirname + '/local-package',
        mainFile: __dirname + '/local-package/theme.css'
      };
    });

    afterEach(() => fs.remove(basePath));

    it('Creates theme registry file', () => {
      return instance._addThemeEntry(info)
      .then(() => fs.pathExists(process.env.ARC_THEMES_SETTINGS))
      .then((exists) => assert.isTrue(exists));
    });

    it('Adds info to theme registry file', () => {
      return instance._addThemeEntry(info)
      .then(() => fs.readJson(process.env.ARC_THEMES_SETTINGS))
      .then((data) => {
        assert.typeOf(data, 'object');
        assert.typeOf(data.themes, 'array');
        assert.lengthOf(data.themes, 1);
      });
    });

    it('Adds 2 info  objects to theme registry file', () => {
      return instance._addThemeEntry(info)
      .then(() => instance._addThemeEntry(info))
      .then(() => fs.readJson(process.env.ARC_THEMES_SETTINGS))
      .then((data) => {
        assert.typeOf(data.themes, 'array');
        assert.lengthOf(data.themes, 2);
      });
    });
  });

  describe('uninstall()', () => {
    describe('Local package', () => {
      let instance;
      const localPackage = path.join(__dirname, 'local-package');
      beforeEach(() => {
        instance = new ThemePluginsManager();
        return instance.install(localPackage);
      });

      afterEach(() => fs.remove(basePath));

      it('Has package installed', () => {
        return fs.pathExists(path.join(process.env.ARC_THEMES, 'test-package'))
        .then((exists) => assert.isTrue(exists));
      });

      it('Has entry in theme info file.', () => {
        return fs.pathExists(path.join(process.env.ARC_THEMES, 'themes-info.json'))
        .then((exists) => assert.isTrue(exists));
      });

      it('Removes local package', async () => {
        await instance.uninstall(localPackage);
        const exists  = await fs.pathExists(path.join(process.env.ARC_THEMES, 'test-package'));
        assert.isFalse(exists);
      });

      it('Removes entry from info file.', async () => {
        await instance.uninstall(localPackage);
        const data = await fs.readJson(process.env.ARC_THEMES_SETTINGS);
        assert.typeOf(data.themes, 'array');
        assert.lengthOf(data.themes, 0);
      });
    });

    describe('Remote package', () => {
      let instance;
      const pkgName = 'advanced-rest-client/arc-electron-default-theme';
      const pkgVersion = '2.0.0-preview';
      let installedLocation;

      before(() => {
        installedLocation = path.join(
          process.env.ARC_THEMES,
          '@advanced-rest-client',
          'arc-electron-default-theme');
        instance = new ThemePluginsManager();
        return instance.install(pkgName, pkgVersion);
      });

      after(() => fs.remove(basePath));

      it('Has package installed', () => {
        return fs.pathExists(installedLocation)
        .then((exists) => assert.isTrue(exists));
      });

      it('Has entry in theme info file.', () => {
        return fs.pathExists(process.env.ARC_THEMES_SETTINGS)
        .then((exists) => assert.isTrue(exists));
      });

      it('Removes remote package', () => {
        return instance.uninstall(pkgName)
        .then(() => fs.pathExists(installedLocation))
        .then((exists) => {
          assert.isFalse(exists);
        });
      });

      it('Removes entry from info file.', () => {
        return fs.readJson(path.join(process.env.ARC_THEMES_SETTINGS))
        .then((data) => {
          assert.typeOf(data.themes, 'array');
          assert.lengthOf(data.themes, 0);
        });
      });
    });
  });
});
