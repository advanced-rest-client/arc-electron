const electron = require('electron');
const path = require('path');
// @ts-ignore
const _require = require('esm')(module);

const { ApplicationPaths } = _require('../src/io/ApplicationPaths.js');
const { ArcEnvironment } = _require('../src/io/ArcEnvironment.js');
const { PreferencesManager } = _require('../src/io/PreferencesManager.js');

const arcPaths = new ApplicationPaths();

let pathsSet = false;

module.exports = {
  getBasePath: () => {
    const app = electron.remote ? electron.remote.app : electron.app;
    if (pathsSet) {
      return app.getPath('userData');
    }
    pathsSet = true;
    const basePath = path.join(__dirname, 'tests-exe-dir');
    app.setPath('userData', basePath);
    arcPaths.setHome();
    arcPaths.setSettingsFile();
    arcPaths.setWorkspacePath();
    arcPaths.setThemesPath();
    arcPaths.setStateFile();
    return basePath;
  },

  setupEnvironment() {
    const prefManager = new PreferencesManager(path.join(__dirname, 'tests-exe-dir', 'test-settings.json'));
    const env = new ArcEnvironment(prefManager, {});
    // @ts-ignore
    global.Arc = env;
    env.registerHandlers();
    // await env.loadEnvironment();
  }
};
