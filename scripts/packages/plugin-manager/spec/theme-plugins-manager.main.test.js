const assert = require('chai').assert;
const fs = require('fs-extra');
const {ThemePluginsManager} = require('../main');

describe('ThemePluginsManager - main process', function() {
  const basePath = 'test/themes';
  describe('constructor()', function() {
    it('Sets default themesBasePath', function() {
      const instance = new ThemePluginsManager();
      assert.typeOf(instance.themesBasePath, 'string');
    });

    it('Sets themesBasePath using passed argument', function() {
      const instance = new ThemePluginsManager(basePath);
      assert.equal(instance.themesBasePath.indexOf(basePath), 0);
    });

    it('Sets infoFilePath property', () => {
      const instance = new ThemePluginsManager(basePath);
      assert.notEqual(instance.infoFilePath.indexOf('themes-info.json'), -1);
    });
  });

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
      assert.equal(result.options.cwd, instance.themesBasePath);
    });

    it('pluginsPath is set', function() {
      const result = instance.pluginManager;
      assert.equal(result.options.pluginsPath, instance.themesBasePath);
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
      assert.equal(result.settingsFile, instance.infoFilePath);
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
      instance = new ThemePluginsManager(basePath);
    });

    it('Creates path to the location', () => {
      const loc = basePath + '/a/b/c';
      return instance._ensureSymlinkPath(loc)
      .then(() => fs.pathExists(basePath + '/a/b'))
      .then((exists) => assert.isTrue(exists));
    });

    it('Last folder is not created', () => {
      const loc = basePath + '/a/b/c';
      return instance._ensureSymlinkPath(loc)
      .then(() => fs.pathExists(basePath + '/a/b/c'))
      .then((exists) => assert.isFalse(exists));
    });
  });

  describe('_installLocalPackage()', () => {
    const localPackage = 'test/local-package';
    afterEach(() => fs.remove(basePath));

    let instance;
    beforeEach(() => {
      instance = new ThemePluginsManager(basePath);
    });

    it('Creates a symlink', () => {
      return instance._installLocalPackage(localPackage)
      .then(() => fs.pathExists('test/themes/test-package'))
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
        assert.equal(result.location, basePath + '/test-package');
      });
    });

    it('location is set', () => {
      return instance._installLocalPackage(localPackage)
      .then((result) => {
        assert.equal(result.mainFile, basePath + '/test-package/theme.js');
      });
    });
  });

  describe('_installRemotePackage()', function() {
    afterEach(() => fs.remove(basePath));

    const pkgName = 'advanced-rest-client/arc-electron-default-theme';
    const pkgVersion = '2.0.0-preview';

    it('Installs GitHub package', function() {
      const instance = new ThemePluginsManager(basePath);
      return instance._installRemotePackage(pkgName, pkgVersion)
      .then(() => fs.pathExists('test/themes/@advanced-rest-client/arc-electron-default-theme'))
      .then((exists) => assert.isTrue(exists));
    });

    it('Returns info object', function() {
      const instance = new ThemePluginsManager(basePath);
      return instance._installRemotePackage(pkgName, pkgVersion)
      .then((result) => {
        assert.typeOf(result, 'object');
        assert.equal(result.name, '@advanced-rest-client/arc-electron-default-theme');
        assert.equal(result.version, pkgVersion);
        assert.equal(result.location, basePath + '/@' + pkgName);
        assert.equal(result.mainFile,
          basePath + '/@' + pkgName + '/arc-electron-default-theme.html');
      });
    });
  });

  describe('_createThemeInfo()', () => {
    const pkgName = 'test';
    let instance;
    let info;
    beforeEach(() => {
      instance = new ThemePluginsManager(basePath);
      info = {
        name: 'test-name',
        version: 'test-version',
        location: 'test/local-package',
        mainFile: 'test/local-package/theme.js',
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
      instance = new ThemePluginsManager(basePath);
      info = {
        _id: 'test-id',
        name: 'test-name',
        version: 'test-version',
        location: 'test/local-package',
        mainFile: 'test/local-package/theme.js'
      };
    });

    afterEach(() => fs.remove(basePath));

    it('Creates theme registry file', () => {
      return instance._addThemeEntry(info)
      .then(() => fs.pathExists(basePath + '/themes-info.json'))
      .then((exists) => assert.isTrue(exists));
    });

    it('Adds info to theme registry file', () => {
      return instance._addThemeEntry(info)
      .then(() => fs.readJson(basePath + '/themes-info.json'))
      .then((data) => {
        assert.typeOf(data, 'array');
        assert.lengthOf(data, 1);
      });
    });

    it('Adds 2 info  objects to theme registry file', () => {
      return instance._addThemeEntry(info)
      .then(() => instance._addThemeEntry(info))
      .then(() => fs.readJson(basePath + '/themes-info.json'))
      .then((data) => {
        assert.typeOf(data, 'array');
        assert.lengthOf(data, 2);
      });
    });
  });

  describe.only('uninstall()', () => {
    describe('Local package', () => {
      let instance;
      const localPackage = 'test/local-package';
      beforeEach(() => {
        instance = new ThemePluginsManager(basePath);
        return instance.install(localPackage);
      });

      afterEach(() => fs.remove(basePath));

      it('Has package installed', () => {
        return fs.pathExists('test/themes/test-package')
        .then((exists) => assert.isTrue(exists));
      });

      it('Has entry in theme info file.', () => {
        return fs.pathExists(basePath + '/themes-info.json')
        .then((exists) => assert.isTrue(exists));
      });

      it('Removes local package', () => {
        return instance.uninstall(localPackage)
        .then(() => fs.pathExists('test/themes/test-package'))
        .then((exists) => {
          assert.isFalse(exists);
        });
      });

      it('Removes entry from info file.', () => {
        return instance.uninstall(localPackage)
        .then(() => fs.readJson(basePath + '/themes-info.json'))
        .then((data) => {
          assert.typeOf(data, 'array');
          assert.lengthOf(data, 0);
        });
      });
    });

    describe('Remove package', () => {
      let instance;
      const pkgName = 'advanced-rest-client/arc-electron-default-theme';
      const pkgVersion = '2.0.0-preview';
      const installedLocation = 'test/themes/@advanced-rest-client/arc-electron-default-theme';

      before(() => {
        instance = new ThemePluginsManager(basePath);
        return instance.install(pkgName, pkgVersion);
      });

      after(() => fs.remove(basePath));

      it('Has package installed', () => {
        return fs.pathExists(installedLocation)
        .then((exists) => assert.isTrue(exists));
      });

      it('Has entry in theme info file.', () => {
        return fs.pathExists(basePath + '/themes-info.json')
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
        return fs.readJson(basePath + '/themes-info.json')
        .then((data) => {
          assert.typeOf(data, 'array');
          assert.lengthOf(data, 0);
        });
      });
    });
  });
});
