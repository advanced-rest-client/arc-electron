const {ipcRenderer: ipc} = require('electron');
const {ArcPreferencesProxy} = require('../../arc-preferences/renderer');
const {ThemeManager} = require('../../themes-manager/renderer');

process.once('loaded', () => {
  global.ipc = ipc;
  global.ArcPreferencesProxy = ArcPreferencesProxy;
  global.ThemeManager = ThemeManager;
});
