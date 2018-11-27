const {ipcRenderer: ipc} = require('electron');
const prefix = '@advanced-rest-client/';
const {ThemeManager} = require('../packages/sources-manager/renderer');
const {ArcPreferencesProxy} = require(prefix + 'arc-electron-preferences/renderer');
process.once('loaded', () => {
  global.ipc = ipc;
  global.ThemeManager = ThemeManager;
  global.ArcPreferencesProxy = ArcPreferencesProxy;
});
