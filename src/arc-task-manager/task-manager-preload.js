const { app, BrowserWindow, process } = require('electron').remote;
const { ThemeManager } = require('../../scripts/packages/themes-manager/renderer');
/*
Normally it would require to use `process.once('loaded')` to pass the global variables.
However, the task manager window is not intend to run as the first window.
Because of that, when the manager is triggered, the process is already loaded
and it is safe to set up global variables right away.
*/

global.app = {
  getAppMetrics: () => app.getAppMetrics()
};
global.BrowserWindow = BrowserWindow;
global.appProcess = {
  pid: process.pid
};
global.ThemeManager = ThemeManager;
