const arcPaths = require('../scripts/main/arc-paths');
const electron = require('electron');
const path = require('path');

let pathsSet = false;

module.exports = {
  getBasePath: function() {
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
    arcPaths.setComponentsPath();
    return basePath;
  }
};
