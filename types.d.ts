import { SocketRequest as SocketRequestBase, ElectronRequest as ElectronRequestBase } from '@advanced-rest-client/electron/renderer';
import { ArcEnvironment as Environment } from './src/preload/ArcEnvironment';

declare interface AppVersionInfo {
  chrome: string;
  appVersion: string;
}

declare global {
  var versionInfo: AppVersionInfo;
  var ArcEnvironment: typeof Environment;
  var SocketRequest: typeof SocketRequestBase;
  var ElectronRequest: typeof ElectronRequestBase;
}
