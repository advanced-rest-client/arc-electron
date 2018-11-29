const {assert} = require('chai');
const {AppOptions} = require('../../../scripts/main/app-options.js');

describe('AppOptions', function() {
  let instance;

  describe('availableOptions', function() {
    before(function() {
      instance = new AppOptions();
    });

    it('Returns and Array', function() {
      assert.typeOf(instance.availableOptions, 'array');
    });

    it('Array has 4 items', function() {
      assert.lengthOf(instance.availableOptions, 4);
    });

    it('Properties are set', function() {
      const opts = instance.availableOptions;
      for (let i = 0, len = opts.length; i < len; i++) {
        assert.typeOf(opts[i].name, 'string', 'Name is a string');
        assert.typeOf(opts[i].shortcut, 'string', 'Shortcut is a string');
        assert.typeOf(opts[i].type, 'function', 'Type is set');
      }
    });
  });

  describe('parse()', function() {
    let origArgV;
    describe('Defaults', function() {
      before(function() {
        origArgV = process.argv;
        process.argv = [
          '/app/path'
        ];
        instance = new AppOptions();
        instance.parse();
      });

      after(function() {
        process.argv = origArgV;
      });

      it('Settings file is undefined', function() {
        assert.isUndefined(instance.settingsFile);
      });

      it('Workspace file is undefined', function() {
        assert.isUndefined(instance.workspacePath);
      });

      it('disableLog is undefined', function() {
        assert.isUndefined(instance.disableLog);
      });
    });

    describe('Full options names', function() {
      before(function() {
        origArgV = process.argv;
        process.argv = [
          '/app/path',
          '--settings-file',
          'settings-file-test',
          '--workspace-path',
          'workspace-path-test',
          '--debug',
          '--invalid-option',
          'ivalid-value'
        ];
        instance = new AppOptions();
        instance.parse();
      });

      after(function() {
        process.argv = origArgV;
      });

      it('Sets settings file', function() {
        assert.equal(instance.settingsFile, 'settings-file-test');
      });

      it('Sets workspace file', function() {
        assert.equal(instance.workspacePath, 'workspace-path-test');
      });

      it('Sets debug', function() {
        assert.isTrue(instance.debug, 'debug is set');
      });

      it('invalidOption is not set', function() {
        assert.isUndefined(instance.invalidOption);
      });
    });

    describe('Shortcuts', function() {
      before(function() {
        origArgV = process.argv;
        process.argv = [
          '/app/path',
          '-d',
          '-s',
          'settings-file-test',
          '-w',
          'workspace-path-test'
        ];
        instance = new AppOptions();
        instance.parse();
      });

      after(function() {
        process.argv = origArgV;
      });

      it('Sets settings file', function() {
        assert.equal(instance.settingsFile, 'settings-file-test');
      });

      it('Sets workspace file', function() {
        assert.equal(instance.workspacePath, 'workspace-path-test');
      });

      it('Sets debug', function() {
        assert.isTrue(instance.debug, 'debug is set');
      });
    });
  });

  describe('findDefinnition()', function() {
    before(function() {
      instance = new AppOptions();
    });

    it('Finds a definition for full name', function() {
      const name = '--settings-file';
      const result = instance.findDefinnition(name);
      assert.typeOf(result, 'object');
      assert.equal(result.name, name);
    });

    it('Finds a definition for shortcut', function() {
      const name = '--settings-file';
      const result = instance.findDefinnition('-s');
      assert.typeOf(result, 'object');
      assert.equal(result.name, name);
    });

    it('Returns undefined for unknown name', function() {
      const result = instance.findDefinnition('--test');
      assert.isUndefined(result);
    });

    it('Returns undefined for unknown shortcut', function() {
      const result = instance.findDefinnition('-test');
      assert.isUndefined(result);
    });
  });

  describe('getPropertyDefinition()', function() {
    const def = {
      type: String,
      name: 'test'
    };
    const argWithValue = 'name="test-value"';
    const arg = 'name';
    before(function() {
      instance = new AppOptions();
    });

    it('Parses argument with value', function() {
      const defArg = Object.assign({}, def);
      const result = instance.getPropertyDefinition(argWithValue, defArg, 'other-test');
      assert.isFalse(result.skipNext);
      assert.equal(result.value, 'test-value');
    });

    it('Parses argument without value', function() {
      const defArg = Object.assign({}, def);
      const result = instance.getPropertyDefinition(arg, defArg, 'other-test');
      assert.isTrue(result.skipNext);
      assert.equal(result.value, 'other-test');
    });

    it('Value is number for numeric types', function() {
      const defArg = Object.assign({}, def);
      defArg.type = Number;
      const result = instance.getPropertyDefinition(arg, defArg, '2');
      assert.isTrue(result.skipNext);
      assert.strictEqual(result.value, 2);
    });

    it('Value is a Boolean for Boolean types', function() {
      const defArg = Object.assign({}, def);
      defArg.type = Boolean;
      const result = instance.getPropertyDefinition(arg, defArg);
      assert.isFalse(result.skipNext);
      assert.isTrue(result.value);
    });
  });

  describe('getArgValue()', function() {
    before(function() {
      instance = new AppOptions();
    });

    it('Returns value with quota', function() {
      const result = instance.getArgValue('name="test"');
      assert.equal(result, 'test');
    });

    it('Returns value without quota', function() {
      const result = instance.getArgValue('name=test');
      assert.equal(result, 'test');
    });

    it('Returns empty stirng when no value', function() {
      const result = instance.getArgValue('name');
      assert.equal(result, '');
    });
  });

  describe('setProperty()', function() {
    const def = {
      value: 'test'
    };
    before(function() {
      instance = new AppOptions();
    });

    it('Sets full name property', function() {
      const arg = Object.assign({name: '--my-name-argument'}, def);
      instance.setProperty(arg);
      assert.equal(instance.myNameArgument, 'test');
    });
  });

  describe('getOptions()', function() {
    let origArgV;
    before(function() {
      origArgV = process.argv;
      process.argv = [
        '/app/path',
        '--debug',
        '--settings-file',
        'settings-file-test',
        '--workspace-path',
        'workspace-path-test'
      ];
      instance = new AppOptions();
      instance.parse();
    });

    after(function() {
      process.argv = origArgV;
    });

    it('Returns object', function() {
      const result = instance.getOptions();
      assert.typeOf(result, 'object');
    });

    it('Object has 3 properties', function() {
      const result = instance.getOptions();
      assert.lengthOf(Object.keys(result), 3);
    });

    it('Returns all properties', function() {
      const result = instance.getOptions();
      assert.equal(result.settingsFile, 'settings-file-test');
      assert.equal(result.workspacePath, 'workspace-path-test');
      assert.isTrue(result.debug);
    });
  });
});
