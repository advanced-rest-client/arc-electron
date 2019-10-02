const { ipcRenderer: ipc } = require('electron');
const { ThemeManager } = require('../../scripts/packages/themes-manager/renderer');
const { ArcPreferencesProxy } = require('../../scripts/packages/arc-preferences/renderer');
process.once('loaded', () => {
  global.ipc = ipc;
  global.ThemeManager = ThemeManager;
  global.ArcPreferencesProxy = ArcPreferencesProxy;
});
