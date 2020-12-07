import { OAuth2Handler } from '@advanced-rest-client/electron-oauth2/renderer/OAuth2Handler.js';
import logger from 'electron-log';
import { SocketRequest, ElectronRequest } from '@advanced-rest-client/electron-request';
import { PreferencesProxy } from './PreferencesProxy.js';
import { WindowProxy } from './WindowProxy.js';
import { CookieBridge } from './CookieBridge.js';
import { ArcContextMenu } from './ArcContextMenu.js';
import { ThemeManager } from './ThemeManager.js';
import { EncryptionService } from './EncryptionService.js';
import { WorkspaceManager } from './WorkspaceManager.js';

process.once('loaded', () => {
  // @ts-ignore
  global.OAuth2Handler = OAuth2Handler;
  // @ts-ignore
  global.PreferencesProxy = PreferencesProxy;
  // @ts-ignore
  global.logger = logger;
  // @ts-ignore
  global.WindowProxy = WindowProxy;
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
});
