const {ipcRenderer: ipc} = require('electron');
const {ThemeManager} = require('../packages/sources-manager/renderer');
const {ArcPreferencesProxy} = require('../packages/arc-preferences/renderer');
process.once('loaded', () => {
  global.ipc = ipc;
  global.ThemeManager = ThemeManager;
  global.ArcPreferencesProxy = ArcPreferencesProxy;
});
