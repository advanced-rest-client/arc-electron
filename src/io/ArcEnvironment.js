import { app, BrowserWindow, ipcMain } from 'electron';
import { Oauth2Identity } from '@advanced-rest-client/electron-oauth2';
import fs from 'fs-extra';
import { ApplicationUpdater } from './ApplicationUpdater.js';
import { logger } from './Logger.js';
import { ThemesProtocol } from './ThemesProtocol.js';
import { EsmProtocol } from './EsmProtocol.js';
import { WindowsManager } from './WindowsManager.js';
import { ApplicationMenu } from './ApplicationMenu.js';
import { PopupMenuService } from './PopupMenuService.js';
import { ThemeManager } from './ThemeManager.js';
import { SessionManager } from './SessionManager.js';
import { ContentSearchService } from './ContentSearchService.js';
import { AppPrompts } from './AppPrompts.js';
import { AppStateManager } from './AppStateManager.js';
import { GoogleDrive } from './GoogleDrive.js';
import { ExternalResourcesManager } from './ExternalResourcesManager.js';

/** @typedef {import('../types').ApplicationOptionsConfig} ApplicationOptionsConfig */
/** @typedef {import('../types').ProtocolFile} ProtocolFile */
/** @typedef {import('./PreferencesManager').PreferencesManager} PreferencesManager */

export const importWorkspaceHandler = Symbol('importWorkspaceHandler');

export class ArcEnvironment {
  /**
   * @param {PreferencesManager} prefMgr Initialized preferences manager
   * @param {ApplicationOptionsConfig=} [params={}]
   */
  constructor(prefMgr, params={}) {
    this.config = prefMgr; 
    this.initParams = params;
    this.isDebug = params.dev || false;
    this.withDevTools = params.withDevtools || false;

    this.initializeConfiguration(prefMgr);
    this.initializeAppState();
    this.initializeWindowsManager(params);
    this.initializeUpdater();
    this.initializeOAuth2();
    this.initializeMenu();
    this.initializePopupMenu();
    this.initializeThemes();
    this.initializeSessionManager();
    this.initializeSearchService();
    this.initializePrompts();
    this.initializeGoogleDrive();
    this.initializeExternalResources();

    app.on('activate', () => this.activateHandler.bind(this));
    app.on('window-all-closed', this.allClosedHandler.bind(this));
    // @todo(pawel): create an overlay window on quit to delay the quit from ctrl/cmd+q for a second.
    // app.on('will-quit', () => this.willQuitHandler.bind(this));
    // app.on('before-quit', () => this.beforeQuitHandler.bind(this));
  }

  /**
   * Loads event listeners for the preferences manager
   * @param {PreferencesManager} manager Initialized preferences manager
   */
  initializeConfiguration(manager) {
    manager.on('settings-changed', (name, value) => {
      this.wm.notifyAll('preferences-value-updated', [name, value]);
      this.settingsChanged(name, value);
    });
    manager.observe();
  }

  initializeAppState() {
    this.state = new AppStateManager(process.env.ARC_STATE_FILE);
    this.state.observe();
  }

  /**
   * Initializes the window manager class.
   * @param {ApplicationOptionsConfig} params
   */
  initializeWindowsManager(params) {
    logger.debug('Initializing windows manager.');
    this.wm = new WindowsManager(params);
    this.wm.listen();
  }

  /**
   * Initializes auto updater.
   */
  initializeUpdater() {
    this.updater = new ApplicationUpdater();
    this.updater.listen();
    this.updater.on('notify-windows', (type, arg) => {
      this.wm.notifyAll(type, arg);
    });
  }

  initializeOAuth2() {
    Oauth2Identity.listen();
  }

  /**
   * Initializes the application menu`
   */
  initializeMenu() {
    logger.debug('Initializing application menu (system menu).');
    this.menu = new ApplicationMenu(this.updater);
    this.menu.build();
    logger.debug('Listening for system menu events.');
    this.menu.on('menu-action', (action, win) => {
      this.menuActionHandler(action, win);
    });
    this.menu.loadWorkspaceHistory();
    this.menu.on('open-workspace', (filePath) => this.openWorkspace(filePath));
  }

  initializePopupMenu() {
    logger.debug('Initializing app menu service (popup listener).');
    const instance = new PopupMenuService(this.wm);
    instance.listen();
    this.appMenuService = instance;
  }

  initializeThemes() {
    logger.debug('Initializing theme manager.');
    this.themes = new ThemeManager(this, this.initParams.skipThemesUpdate);
    this.themes.listen();
  }

  initializeSessionManager() {
    logger.debug('Initializing session manager.');
    this.sm = new SessionManager({
      appUrls: [
        'https://advancedrestclient-1155.appspot.com',
        'advancedrestclient.com'
      ],
    });
    this.sm.listen();
    this.sm.on('cookie-changed', (cookies) => this.wm.notifyAll('cookie-changed', [cookies]));
  }

  initializeSearchService() {
    logger.debug('Initializing content search service.');
    this.search = new ContentSearchService(this.wm);
    this.search.listen();
  }

  initializePrompts() {
    this.prompts = new AppPrompts();
    this.prompts.listen();
  }

  initializeGoogleDrive() {
    this.gDrive = new GoogleDrive();
    this.gDrive.listen();
    // this is dispatched by the `GoogleDriveProxy.js` preload class.
    ipcMain.on('google-drive-proxy-file-pick', this.proxyGoogleDriveFilePick.bind(this));
  }

  initializeExternalResources() {
    this.externalResources = new ExternalResourcesManager();
    this.externalResources.listen();
  }

  /**
   * @param {Electron.IpcMainEvent} event
   * @param {string} fileId
   */
  proxyGoogleDriveFilePick(event, fileId) {
    const child = BrowserWindow.fromWebContents(event.sender);
    const parent = child.getParentWindow();
    child.close();
    if (!parent) {
      return;
    }
    parent.webContents.send('google-drive-file-pick', fileId);
  }

  /**
   * Handler for settings change.
   * @param {String} name Changed property name
   * @param {any} value Changed value
   */
  settingsChanged(name, value) {
    switch (name) {
      case 'releaseChannel':
        this.updater.setReleaseChannel(value);
        break;
      default: 
    }
  }

  registerHandlers() {
    logger.debug('initializing themes protocol');
    const tp = new ThemesProtocol();
    tp.register();
    this.themesProtocol = tp;
    logger.debug('initializing ESM protocol');
    const mp = new EsmProtocol();
    mp.register();
    this.modulesProtocol = mp;
  }

  /**
   * Reads current settings and initialized the environment:
   * - the application updater
   */
  async loadEnvironment() {
    logger.debug('Loading user configuration...');
    const settings = await this.config.load();
    logger.debug('User configuration ready.');
    if (!this.isDebug) {
      this.updater.start(settings, this.initParams.skipAppUpdate);
    }
  }

  /**
   * Opens a new application window.
   * @param {string|ProtocolFile=} params
   */
  open(params) {
    if (params === 'string' || !params) {
      // @ts-ignore
      this.wm.open(params);
    } else {
      this.wm.openWithAction(/** @type ProtocolFile */ (params));
    }
  }

  /**
   * A callback fof all windows closed event.
   * It gives some time to the process to open another window.
   * This may happen when calling close and open together. This callback runs 
   * and closes the app but new window is not yet ready. Hence a delay.
   */
  allClosedHandler() {
    setTimeout(() => {
      if (this.wm.hasWindow) {
        return;
      }
      logger.debug('All windows are now closed.');
      // https://github.com/advanced-rest-client/arc-electron/issues/396
      logger.debug('Quitting the IO thread.');
      app.quit();
      // if (process.platform !== 'darwin') {
      //   logger.debug('Quitting main thread.');
      // } else {
      //   logger.debug('Keeping main thread running.');
      // }
    }, 1000);
  }

  /**
   * On OS X it's common to re-create a window in the app when the
   * dock icon is clicked and there are no other windows open.
   */
  async activateHandler() {
    logger.debug('Activating a window.');
    if (!this.wm.hasWindow) {
      await this.wm.open();
    } else {
      this.wm.restoreLast();
    }
  }

  /**
   * Event handler for menu actions.
   *
   * @param {String} action Action type to perform
   * @param {Electron.BrowserWindow} win Browser window association with the action
   */
  menuActionHandler(action, win) {
    logger.debug(`Handing menu command: ${action}`);
    if (action.startsWith('application:')) {
      this.applicationActionHandler(action.substr(12), win);
      return;
    }
    if (action.startsWith('request:')) {
      win.webContents.send('request-action', action.substr(8));
      return;
    }
    logger.warn(`Menu command not handled: ${action}`);
  }

  /**
   * Handles menu actions that are prefixed with `application:`.
   * The `action` is without the application prefix.
   *
   * @param {String} action Action type to perform
   * @param {Electron.BrowserWindow} win Browser window association with the action
   */
  applicationActionHandler(action, win) {
    switch (action) {
      case 'quit':
        logger.debug('Quitting the application.');
        app.quit();
        break;
      case 'new-window':
        logger.debug('Opening new window.');
        this.wm.open();
        break;
      case 'popup-menu':
        logger.debug('Toggling popup menu.');
        this.appMenuService.togglePopupMenu();
        break;
      case 'clear-workspace-history':
        this.menu.clearWorkspaceHistory();
        break;
      case 'open-file':
        AppPrompts.openAssetDialog(win);
        break;
      case 'open-drive':
        this.wm.open({
          page: 'drive-picker.html',
          preload: 'arc-preload.js',
          ignoreWindowSessionSettings: true,
          noMenu: true,
          noWebSecurity: true,
          parent: win,
        });
        break;
      case 'import-workspace':
        this[importWorkspaceHandler](win);
        break;
      case 'find':
        this.search.start(win);
        break;
      case 'open-themes':
        this.wm.open({
          page: 'themes.html',
          preload: 'themes-preload.js',
          ignoreWindowSessionSettings: true,
          noMenu: true,
        });
        break;
      case 'open-license':
        this.wm.open({
          page: 'license.html',
          ignoreWindowSessionSettings: true,
          noMenu: true,
        });
        break;
      case 'about':
        this.wm.open({
          page: 'about.html',
          preload: 'arc-preload.js',
          ignoreWindowSessionSettings: true,
          noMenu: true,
          parent: win,
          sizing: {
            height: 800,
            width: 800,
          },
        });
        break;
      case 'open-privacy-policy':
      case 'open-documentation':
      case 'open-faq':
      case 'open-discussions':
      case 'report-issue':
      case 'search-issues':
      case 'web-session-help':
        this.externalResources.openHelpTopic(action);
        break;
      default:
        logger.debug(`Sending "${action}" action to the UI thread.`);
        win.webContents.send('command', action);
    }
  }

  /**
   * An application menu handler for open workspace from file.
   * @param {Electron.BrowserWindow} win Window from where the request came from
   * @return {Promise}
   */
  async [importWorkspaceHandler](win) {
    const path = await AppPrompts.openWorkspaceFile(win);
    if (path) {
      logger.info('Opening workspace file in a new window.');
      await this.wm.open({
        workspaceFile: path,
      });
      await this.menu.appendWorkspaceHistory(path);
    }
  }

  /**
   * Opens workspace from file
   * @param {string} filePath Workspace file location.
   * @returns {Promise<void>}
   */
  async openWorkspace(filePath) {
    const exists = await fs.pathExists(filePath);
    if (!exists) {
      AppPrompts.workspaceMissing(filePath);
    } else {
      logger.info('Opening workspace file in a new window.');
      await this.wm.open({
        workspaceFile: filePath,
      });
    };
  }
}
