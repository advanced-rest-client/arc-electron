const { AppOptions } = require('../../scripts/main/app-options');
const { assert } = require('chai');
describe('AppOptions', () => {
  describe('#availableOptions', () => {
    let instance;
    before(() => {
      instance = new AppOptions();
    });

    [
      '--settings-file',
      '--workspace-path',
      '--themes-path',
      '--components-path',
      '--debug',
      '--debug-level',
      '--with-devtools',
      '.',
      '--port',
      '--open',
    ].forEach((option) => {
      it(`supports ${option} option`, () => {
        const opts = instance.availableOptions;
        const item = opts.find((i) => i.name === option);
        assert.ok(item, `${option} is set`);
      });
    });

    [
      '-s',
      '-w',
      '-t',
      '-c',
      '-d',
      '-l',
      '-w',
      '-dot',
      '-p',
      '-o',
    ].forEach((option) => {
      it(`supports ${option} shortcut`, () => {
        const opts = instance.availableOptions;
        const item = opts.find((i) => i.shortcut === option);
        assert.ok(item, `${option} is set`);
      });
    });

    [
      ['--settings-file', String],
      ['--workspace-path', String],
      ['--themes-path', String],
      ['--components-path', String],
      ['--debug', Boolean],
      ['--debug-level', String],
      ['--with-devtools', Boolean],
      ['.', String],
      ['--port', Number],
      ['--open', String],
    ].forEach(([option, type]) => {
      it(`has type for ${option} option`, () => {
        const opts = instance.availableOptions;
        const item = opts.find((i) => i.name === option);
        assert.equal(item.type, type);
      });
    });
  });

  describe('parse()', () => {
    let instance;
    beforeEach(() => {
      instance = new AppOptions();
    });

    [
      ['--settings-file', 'test-settings-file', 'test-settings-file', 'settingsFile'],
      ['--workspace-path', 'test-workspace-path', 'test-workspace-path', 'workspacePath'],
      ['--themes-path', 'test-themes-path', 'test-themes-path', 'themesPath'],
      ['--components-path', 'test-components-path', 'test-components-path', 'componentsPath'],
      ['--debug-level', 'silly', 'silly', 'debugLevel'],
      ['--open', 'test-file', 'test-file', 'open'],
      ['--debug', undefined, true, 'debug'],
      ['--with-devtools', undefined, true, 'withDevtools'],
      ['--port', '8080', 8080, 'port'],
    ].forEach(([option, value, parsedValue, property]) => {
      it(`sets ${option} property to ${value}`, () => {
        const orig = process.argv;
        const newArgs = [orig[0], option];
        if (value) {
          newArgs[newArgs.length] = value;
        }
        process.argv = newArgs;
        instance.parse();
        process.argv = orig;
        assert.equal(instance[property], parsedValue);
      });
    });
  });

  describe('openProtocolFile()', () => {
    let instance;
    beforeEach(() => {
      instance = new AppOptions();
    });

    it('sets Drive protocol info', () => {
      const orig = process.argv;
      process.argv = [orig[0], 'arc-file://drive/open/file-id'];
      instance.parse();
      process.argv = orig;
      assert.deepEqual(instance.openProtocolFile, {
        source: 'google-drive',
        action: 'open',
        id: 'file-id'
      });
    });
  });
});
