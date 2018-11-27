const {ipcRenderer: ipc} = require('electron');
const prefix = '@advanced-rest-client/';
const {ArcPreferencesProxy} = require(prefix + 'arc-electron-preferences/renderer');
const {ThemeManager} = require('../../sources-manager/renderer');

process.once('loaded', () => {
  global.ipc = ipc;
  global.ArcPreferencesProxy = ArcPreferencesProxy;
  global.ThemeManager = ThemeManager;
});
