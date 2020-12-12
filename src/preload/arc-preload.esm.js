import { ipcRenderer, clipboard } from 'electron';
import logger from 'electron-log';
import { OAuth2Handler } from '@advanced-rest-client/electron-oauth2/renderer/OAuth2Handler.js';
import { SocketRequest, ElectronRequest, ArcHeaders } from '@advanced-rest-client/electron-request';
import { PreferencesProxy } from './PreferencesProxy.js';
import { WindowProxy } from './WindowProxy.js';
import { CookieBridge } from './CookieBridge.js';
import { ArcContextMenu } from './ArcContextMenu.js';
import { ThemeManager } from './ThemeManager.js';
import { EncryptionService } from './EncryptionService.js';
import { WorkspaceManager } from './WorkspaceManager.js';
import { ImportFilePreProcessor } from './ImportFilePreProcessor.js';
import { FilesystemProxy } from './FilesystemProxy.js';
import { ApplicationSearchProxy } from './ApplicationSearchProxy.js';

const env = {};
const APP_VERSION = process.env.npm_package_version;
Object.keys(process.env).forEach((key) => {
  if (key.indexOf('npm_') === 0 || key.indexOf('ARC_') === 0) {
    return;
  }
  env[key] = process.env[key];
});

const { versions } = process;
const nodeBuffer = Buffer;

process.once('loaded', () => {
  // @ts-ignore
  global.OAuth2Handler = OAuth2Handler;
  // @ts-ignore
  global.PreferencesProxy = PreferencesProxy;
  global.logger = logger;
  // @ts-ignore
  global.WindowManagerProxy = WindowProxy;
  // @ts-ignore
  global.CookieBridge = CookieBridge;
  // @ts-ignore
  global.SocketRequest = SocketRequest;
  // @ts-ignore
  global.ElectronRequest = ElectronRequest;
  // @ts-ignore
  global.ArcContextMenu = ArcContextMenu;
  // @ts-ignore
  global.ThemeManager = ThemeManager;
  // @ts-ignore
  global.EncryptionService = EncryptionService;
  // @ts-ignore
  global.WorkspaceManager = WorkspaceManager;
  // @ts-ignore
  global.ImportFilePreProcessor = ImportFilePreProcessor;
  // @ts-ignore
  global.FilesystemProxy = FilesystemProxy;
  // @ts-ignore
  global.ApplicationSearchProxy = ApplicationSearchProxy;
  // @ts-ignore
  global.ArcHeaders = ArcHeaders;
  global.ipc = ipcRenderer;
  global.clipboard = clipboard;

  global.process = {
    // @ts-ignore
    env,
  };

  // @ts-ignore
  global.versionInfo = {
    // @ts-ignore
    chrome: versions.chrome,
    appVersion: APP_VERSION,
  };

  // this is important for the response view which uses Buffer class when the response has been recorded by Electron app.
  global.Buffer = nodeBuffer;
});
