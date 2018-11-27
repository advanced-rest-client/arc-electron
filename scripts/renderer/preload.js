const {ipcRenderer: ipc, clipboard} = require('electron');
const {app} = require('electron').remote;
const log = require('electron-log');
const prefix = '@advanced-rest-client/';
const {ArcElectronDrive} = require(prefix + 'electron-drive/renderer');
const {OAuth2Handler} = require(prefix + 'electron-oauth2/renderer');
const {WorkspaceManager} = require(prefix + 'arc-electron-preferences/renderer');
const {ArcPreferencesProxy} = require(prefix + 'arc-electron-preferences/renderer');
const {ThemeManager} = require('../packages/sources-manager/renderer');
const {SocketRequest, ElectronRequest} = require(prefix + 'electron-request');
const {CookieBridge} = require(prefix + 'electron-session-state/renderer');
const {ArcContextMenu} = require('./context-menu');
const {FilesystemProxy} = require('./filesystem-proxy');
const {ElectronAmfService} = require('../packages/amf-service');
const {WindowSearchService} = require('../packages/search-service/renderer');
const setImmediateFn = setImmediate;
const versions = process.versions;
const env = {};
Object.keys(process.env).forEach((key) => {
  if (key.indexOf('npm_') === 0) {
    return;
  }
  env[key] = process.env[key];
});
process.once('loaded', () => {
  global.ipcRenderer = ipc;
  global.ipc = ipc;
  global.ArcElectronDrive = ArcElectronDrive;
  global.OAuth2Handler = OAuth2Handler;
  global.WorkspaceManager = WorkspaceManager;
  global.ArcPreferencesProxy = ArcPreferencesProxy;
  global.ThemeManager = ThemeManager;
  global.ArcContextMenu = ArcContextMenu;
  global.SocketRequest = SocketRequest;
  global.ElectronRequest = ElectronRequest;
  global.CookieBridge = CookieBridge;
  global.log = log;
  global.setImmediate = setImmediateFn;
  global.FilesystemProxy = FilesystemProxy;
  global.ElectronAmfService = ElectronAmfService;
  global.WindowSearchService = WindowSearchService;
  global.versionInfo = {
    chrome: versions.chrome,
    appVersion: app.getVersion()
  };
  global.clipboard = clipboard;
  global.process = {
    env
  };
});
