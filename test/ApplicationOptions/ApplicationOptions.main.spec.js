const { assert } = require('chai');
const _require = require('esm')(module);

/** @typedef {import('../../src/io/ApplicationOptions').ApplicationOptions} ApplicationOptions */

const { ApplicationOptions } = _require('../../src/io/ApplicationOptions.js');

describe('ApplicationOptions', () => {
  describe('#availableOptions', () => {
    let instance = /** @type ApplicationOptions */ (null);
    before(() => {
      instance = new ApplicationOptions();
    });

    [
      '--settings-file',
      '--state-file',
      '--workspace-path',
      '--themes-path',
      '--dev',
      '--debug-level',
      '--with-devtools',
      '.',
      '--port',
      '--open',
      '--skip-app-update',
      '--skip-themes-update',
      '--user-data-dir',
      '--release-channel',
      '--skip-cookie-consent',
      '--skip-database-upgrade',
      '--proxy',
      '--proxy-username',
      '--proxy-password',
      '--proxy-system-settings',
      '--proxy-all',
    ].forEach((option) => {
      it(`supports ${option} option`, () => {
        const opts = instance.availableOptions;
        const item = opts.find((i) => i.name === option);
        assert.ok(item, `${option} is set`);
      });
    });

    [
      '-s',
      '-S',
      '-w',
      '-t',
      '-d',
      '-l',
      '-w',
      '-dot',
      '-p',
      '-o',
      '-u',
      '-x',
      '-D',
      '-r',
    ].forEach((option) => {
      it(`supports ${option} shortcut`, () => {
        const opts = instance.availableOptions;
        const item = opts.find((i) => i.shortcut === option);
        assert.ok(item, `${option} is set`);
      });
    });

    [
      ['--settings-file', String],
      ['--state-file', String],
      ['--workspace-path', String],
      ['--themes-path', String],
      ['--dev', Boolean],
      ['--debug-level', String],
      ['--with-devtools', Boolean],
      ['.', String],
      ['--port', Number],
      ['--open', String],
      ['--skip-themes-update', Boolean],
      ['--skip-app-update', Boolean],
      ['--user-data-dir', String],
      ['--release-channel', String],
      ['--skip-cookie-consent', Boolean],
      ['--skip-database-upgrade', Boolean],
    ].forEach(([option, type]) => {
      it(`has type for ${option} option`, () => {
        const opts = instance.availableOptions;
        const item = opts.find((i) => i.name === option);
        assert.equal(item.type, type);
      });
    });
  });

  describe('parse()', () => {
    let instance = /** @type ApplicationOptions */ (null);
    beforeEach(() => {
      instance = new ApplicationOptions();
    });

    [
      ['--settings-file', 'test-settings-file', 'test-settings-file', 'settingsFile'],
      ['--state-file', 'test-state-file', 'test-state-file', 'stateFile'],
      ['--workspace-path', 'test-workspace-path', 'test-workspace-path', 'workspacePath'],
      ['--themes-path', 'test-themes-path', 'test-themes-path', 'themesPath'],
      ['--dev', undefined, true, 'dev'],
      ['--debug-level', 'silly', 'silly', 'debugLevel'],
      ['--with-devtools', undefined, true, 'withDevtools'],
      ['--port', '8080', 8080, 'port'],
      ['--open', 'test-file', 'test-file', 'open'],
      ['--skip-app-update', undefined, true, 'skipAppUpdate'],
      ['--skip-themes-update', undefined, true, 'skipThemesUpdate'],
      ['--user-data-dir', 'data-path', 'data-path', 'userDataDir'],
      ['--release-channel', 'latest', 'latest', 'releaseChannel'],
      ['--skip-cookie-consent', undefined, true, 'skipCookieConsent'],
      ['--skip-database-upgrade', undefined, true, 'skipDatabaseUpgrade'],
      ['--proxy', '192.168.1.10', '192.168.1.10', 'proxy'],
      ['--proxy-username', 'my-username', 'my-username', 'proxyUsername'],
      ['--proxy-password', 'my-password', 'my-password', 'proxyPassword'],
      ['--proxy-system-settings', undefined, true, 'proxySystemSettings'],
      ['--proxy-all', undefined, true, 'proxyAll'],
    ].forEach(([option, value, parsedValue, property]) => {
      it(`sets ${option} property to ${value}`, () => {
        const orig = process.argv;
        const newArgs = [orig[0], option];
        if (value) {
          newArgs[newArgs.length] = value;
        }
        // @ts-ignore
        process.argv = newArgs;
        instance.parse();
        process.argv = orig;
        // @ts-ignore
        assert.equal(instance[property], parsedValue);
      });
    });
  });

  describe('openProtocolFile()', () => {
    let instance = /** @type ApplicationOptions */ (null);
    beforeEach(() => {
      instance = new ApplicationOptions();
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
