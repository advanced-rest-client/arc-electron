const { ipcRenderer: ipc, clipboard } = require('electron');
const { app } = require('electron').remote;
const log = require('electron-log');
const Jexl = require('jexl');
const prefix = '@advanced-rest-client/';
const { ArcElectronDrive } = require(prefix + 'electron-drive/renderer');
const { OAuth2Handler } = require(prefix + 'electron-oauth2/renderer');
const { WorkspaceManager } = require('../packages/arc-preferences/renderer');
const { ArcPreferencesProxy } = require('../packages/arc-preferences/renderer');
const { ThemeManager } = require('../packages/themes-manager/renderer');
const { SocketRequest, ElectronRequest } = require(prefix + 'electron-request');
const { CookieBridge } = require(prefix + 'electron-session-state/renderer');
const { ArcContextMenu } = require('../packages/context-actions/renderer');
const { FilesystemProxy } = require('./filesystem-proxy');
const { ElectronAmfService } = require('@advanced-rest-client/electron-amf-service');
const { WindowSearchService } = require('../packages/search-service/renderer');
const { EncryptionService } = require('../packages/encryption/renderer/encryption.js');
const { UpgradeHelper } = require('./upgrade-helper');
const { ImportFilePrePprocessor } = require('./import-file-preprocessor');
const setImmediateFn = setImmediate;
const versions = process.versions;
const env = {};
Object.keys(process.env).forEach((key) => {
  if (key.indexOf('npm_') === 0 || key.indexOf('ARC_') === 0) {
    return;
  }
  env[key] = process.env[key];
});

process.once('loaded', () => {
  if (process.env.NODE_ENV === 'test') {
    global.electronRequire = require;
  }
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
  global.Jexl = Jexl;
  global.UpgradeHelper = UpgradeHelper;
  global.ImportFilePrePprocessor = ImportFilePrePprocessor;
  global.EncryptionService = EncryptionService;
  global.versionInfo = {
    chrome: versions.chrome,
    appVersion: app.getVersion()
  };
  global.clipboard = clipboard;
  global.process = {
    env
  };
});
