import { ElectronRequest as ElectronRequestBase, SocketRequest as SocketRequestBase } from "@advanced-rest-client/electron-request";
import { OAuth2Handler as OAuth2HandlerBase } from "@advanced-rest-client/electron-oauth2/renderer/OAuth2Handler";
import { Clipboard, IpcRenderer } from "electron";
import { ArcContextMenu as ArcContextMenuBase } from "./src/preload/ArcContextMenu";
import { CookieBridge as CookieBridgeBase } from "./src/preload/CookieBridge";
import { EncryptionService as EncryptionServiceBase } from "./src/preload/EncryptionService";
import { ThemeManager as ThemeManagerBase } from "./src/preload/ThemeManager";
import { WorkspaceManager as WorkspaceManagerBase } from "./src/preload/WorkspaceManager";
import { WindowProxy as WindowProxyBase } from "./src/preload/WindowProxy";
import { PreferencesProxy as PreferencesProxyBase } from "./src/preload/PreferencesProxy";
import logger from "electron-log";

// declare global {
//   interface Global {
//     ipc: IpcRenderer;
//   }
// }
interface Window {
  ipc: IpcRenderer;
}

declare global {
  var ipc: IpcRenderer;
  var clipboard: Clipboard;
  var logger: logger.ElectronLog;
  class WorkspaceManager extends WorkspaceManagerBase {}
  class EncryptionService extends EncryptionServiceBase {}
  class ThemeManager extends ThemeManagerBase {}
  class ArcContextMenu extends ArcContextMenuBase {}
  class ElectronRequest extends ElectronRequestBase {}
  class SocketRequest extends SocketRequestBase {}
  class CookieBridge extends CookieBridgeBase {}
  class WindowManagerProxy extends WindowProxyBase {}
  class PreferencesProxy extends PreferencesProxyBase {}
  class OAuth2Handler extends OAuth2HandlerBase {}
}
