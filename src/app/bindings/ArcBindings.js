import { ConfigurationBindingsElectron } from './ConfigurationBindingsElectron.js';
import { ApplicationBindingsElectron } from './ApplicationBindingsElectron.js';
import { ThemeBindingsElectron } from './ThemeBindingsElectron.js';
import { WorkspaceBindingsElectron } from './WorkspaceBindingsElectron.js';
import { DataExportBindingsElectron } from './DataExportBindingsElectron.js';
import { EncryptionBindingsElectron } from './EncryptionBindingsElectron.js';
import { OAuth2BindingsElectron } from './OAuth2BindingsElectron.js';
import { GoogleDriveBindingsElectron } from './GoogleDriveBindingsElectron.js';
import { ElectronRequestBindings } from './ElectronRequestBindings.js';
import { ElectronMenuBindings } from './ElectronMenuBindings.js';
import { ElectronApiParserBindings } from './ElectronApiParserBindings.js';
import { HttpProxyBindings } from './HttpProxyBindings.js';
import { SearchBindings } from './SearchBindings.js';
import { SessionCookieBindings } from './SessionCookieBindings.js';
import { GoogleAnalyticsBindings } from './GoogleAnalyticsBindings.js';
import { ContextActionBindings } from './ContextActionBindings.js';
import { AppUpdaterBindings } from './AppUpdaterBindings.js';
import { AppHostname } from '../../common/Constants.js';

/**
 * A class that initializes Electron bindings for ARC.
 */
export class ArcBindings {
  constructor() {
    this.config = new ConfigurationBindingsElectron();
    this.application = new ApplicationBindingsElectron();
    this.theme = new ThemeBindingsElectron('themes:', AppHostname);
    this.workspace = new WorkspaceBindingsElectron();
    this.dataExport = new DataExportBindingsElectron();
    this.encryption = new EncryptionBindingsElectron();
    this.googleDrive = new GoogleDriveBindingsElectron();
    this.oauth2 = new OAuth2BindingsElectron();
    this.apiParser = new ElectronApiParserBindings();
    this.http = new ElectronRequestBindings();
    this.menu = new ElectronMenuBindings();
    this.search = new SearchBindings();
    this.request = new HttpProxyBindings();
    this.session = new SessionCookieBindings();
    this.analytics = new GoogleAnalyticsBindings();
    this.contextActions = new ContextActionBindings();
    this.updated = new AppUpdaterBindings();
  }

  async initialize() {
    await this.config.initialize();
    await this.application.initialize();
    await this.analytics.initialize();
    await this.theme.initialize();
    await this.workspace.initialize();
    await this.dataExport.initialize();
    await this.encryption.initialize();
    await this.googleDrive.initialize();
    await this.oauth2.initialize();
    await this.apiParser.initialize();
    await this.http.initialize();
    await this.menu.initialize();
    await this.search.initialize();
    await this.request.initialize();
    await this.session.initialize();
    await this.contextActions.initialize();
    await this.updated.initialize();
  }
}
