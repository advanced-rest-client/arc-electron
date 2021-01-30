const { assert } = require('chai');
const fs = require('fs-extra');
const path = require('path');
const bootstrap = require('../test-bootstrap.js');

/** @typedef {import('spectron').Application} Application */

describe('Initial paths', () => {
  const basePath = path.join('test', 'tests-exe-dir');
  const settingsFilePath = path.join(basePath, 'test-settings.json');
  const workspaceFilePath = path.join(basePath, 'workspace');
  const themesFilePath = path.join(basePath, 'themes-esm');

  describe('Setups default file paths', () => {
    let app = /** @type Application */ (null);
    before(async () => {
      const opts = {
        args: [
          '--skip-cookie-consent',
          '--skip-database-upgrade',
        ]
      };
      app = bootstrap.getApp(opts);
      try {
        await app.start();
        // await app.client.waitUntilWindowLoaded();
        await bootstrap.deffer(5000);
      } catch (e) {
        console.log('IS RUNNING', app.isRunning());
        await app.stop()
        if (app && app.isRunning()) {
          throw e;
        }
        throw e;
      }
    });

    after(async () => {
      if (app && app.isRunning()) {
        await app.stop();
      }
      const bp = path.join('test', 'playground');
      await fs.remove(bp);
    });

    it('sets ARC_HOME variable', async () => {
      console.log(app);
      const variables = await app.mainProcess.env();
      assert.typeOf(variables.ARC_HOME, 'string');
    });

    it('sets ARC_SETTINGS_FILE variable', async () => {
      const variables = await app.mainProcess.env();
      assert.typeOf(variables.ARC_SETTINGS_FILE, 'string');
    });

    it('sets default ARC_SETTINGS_FILE is in ARC_HOME', async () => {
      const variables = await app.mainProcess.env();
      assert.equal(variables.ARC_SETTINGS_FILE, bootstrap.settingsFilePath);
    });

    it('sets default ARC_THEMES in ARC_HOME', async () => {
      const variables = await app.mainProcess.env();
      assert.equal(variables.ARC_THEMES, bootstrap.themesFilePath);
    });

    it('sets default ARC_THEMES_SETTINGS in ARC_THEMES', async () => {
      const variables = await app.mainProcess.env();
      assert.equal(variables.ARC_THEMES_SETTINGS, path.join(bootstrap.themesFilePath, 'themes-info.json'));
    });

    it('sets default ARC_WORKSPACE_PATH in ARC_HOME', async () => {
      const variables = await app.mainProcess.env();
      assert.equal(variables.ARC_WORKSPACE_PATH, bootstrap.workspaceFilePath);
    });
  });

  describe('Setups configuration file paths', () => {
    const opts = {
      args: [
        '--settings-file',
        settingsFilePath,
        '--workspace-path',
        workspaceFilePath,
        '--themes-path',
        themesFilePath,
        '--skip-cookie-consent',
        '--skip-database-upgrade',
      ]
    };
    let app = /** @type Application */ (null);
    before(async () => {
      app = bootstrap.getApp(opts);
      await app.start()
      await app.client.waitUntilWindowLoaded(10000);
    });

    after(async () => {
      if (app && app.isRunning()) {
        await app.stop();
      }
      await fs.remove(settingsFilePath);
      await fs.remove(workspaceFilePath);
    });

    it('sets ARC_SETTINGS_FILE variable', async () => {
      const variables = await app.mainProcess.env();
      assert.equal(variables.ARC_SETTINGS_FILE, settingsFilePath);
    });

    it('sets ARC_WORKSPACE_PATH variable', async () => {
      const variables = await app.mainProcess.env();
      assert.equal(variables.ARC_WORKSPACE_PATH, workspaceFilePath);
    });

    it('sets ARC_THEMES variable', async () => {
      const variables = await app.mainProcess.env();
      assert.equal(variables.ARC_THEMES, themesFilePath);
    });

    it('sets ARC_THEMES_SETTINGS variable', async () => {
      const variables = await app.mainProcess.env();
      assert.equal(variables.ARC_THEMES_SETTINGS, path.join(themesFilePath, 'themes-info.json'));
    });
  });
});
