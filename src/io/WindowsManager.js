/* eslint-disable no-param-reassign */
import { BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';
import url from 'url';
import { v4 } from 'uuid';
import { MainWindowPersist, AppHostname } from '../common/Constants.js';
import { logger } from './Logger.js';
import { WindowsPersistance } from './WindowsPersistance.js';
import { ContextActions } from './ContextActions.js';

/** @typedef {import('../types').ApplicationOptionsConfig} ApplicationOptionsConfig */
/** @typedef {import('../types').ProtocolFile} ProtocolFile */
/** @typedef {import('../types').WindowSession} WindowSession */
/** @typedef {import('../types').OpenPageOptions} OpenPageOptions */
/** @typedef {import('electron').WebContents} WebContents */


export const lastFocusedSymbol = Symbol('lastFocusedSymbol');
export const focusQueueSymbol = Symbol('focusQueueSymbol');
export const closedHandler = Symbol('closedHandler');
export const movedHandler = Symbol('movedHandler');
export const resizedHandler = Symbol('resizedHandler');
export const focusedHandler = Symbol('focusedHandler');
export const popupHandler = Symbol('popupHandler');
export const settingHandler = Symbol('settingHandler');
export const windowOpenHandler = Symbol('windowOpenHandler');
export const toggleDevToolsHandler = Symbol('toggleDevToolsHandler');
export const windowReadyHandler = Symbol('windowReadyHandler');
export const winContextInitHandler = Symbol('winContextInitHandler');
export const workspaceLocationHandler = Symbol('workspaceLocationHandler');
export const workspaceChangeLocationHandler = Symbol('workspaceChangeLocationHandler');

export class WindowsManager {
  /**
   * @param {ApplicationOptionsConfig} startupOptions Application startup options. 
   */
  constructor(startupOptions={}) {
    this.startupOptions = startupOptions;
    /** 
     * @type {BrowserWindow[]}
     */
    this.windows = [];
    this[closedHandler] = this[closedHandler].bind(this);
    this[movedHandler] = this[movedHandler].bind(this);
    this[resizedHandler] = this[resizedHandler].bind(this);
    this[focusedHandler] = this[focusedHandler].bind(this);
    this[popupHandler] = this[popupHandler].bind(this);
    this[settingHandler] = this[settingHandler].bind(this);
    this[windowOpenHandler] = this[windowOpenHandler].bind(this);
    this[toggleDevToolsHandler] = this[toggleDevToolsHandler].bind(this);
    this[winContextInitHandler] = this[winContextInitHandler].bind(this);
    this[workspaceLocationHandler] = this[workspaceLocationHandler].bind(this);
    this[workspaceChangeLocationHandler] = this[workspaceChangeLocationHandler].bind(this);
    
    this.workspace = new WindowsPersistance();
    this.contextActions = new ContextActions();

    /** 
     * A map with the location to the workspaces loaded in the current windows.
     * @type {Map<string, string>}
     */
    this.workspacesMap = new Map();

    /**
     * A pointer to last focused window.
     * @type {BrowserWindow}
     */
    this[lastFocusedSymbol] = undefined;
    /** 
     * A list of focused windows, in order of latest focus
     * @type {BrowserWindow[]}
     */
    this[focusQueueSymbol] = [];
  }

  /**
   * @returns {boolean} True if has at leas one window.
   */
  get hasWindow() {
    return this.windows.length > 0;
  }

  /**
   * @return {BrowserWindow|undefined} Reference to last focused browser window
   * or undefined if the window is destroyed or undefined.
   */
  get lastFocused() {
    if (!this[lastFocusedSymbol]) {
      return null;
    }
    if (this[lastFocusedSymbol].isDestroyed()) {
      this[lastFocusedSymbol] = undefined;
      return null;
    }
    return this[lastFocusedSymbol];
  }

  /**
   * @return {BrowserWindow|undefined} Reference to last focused browser window that is ARC main window.
   */
  get lastArcFocused() {
    return this[focusQueueSymbol].find((item) => {
      if (item.isDestroyed()) {
        return false;
      }
      const pageUrl = item.webContents.getURL();
      return pageUrl.includes('/app.html');
    })
  }

  /**
   * @return {BrowserWindow} Returns reference to last created and still active
   * window object.
   */
  get lastActive() {
    const ws = this.windows;
    if (!ws || !ws.length) {
      return null;
    }
    for (let i = ws.length - 1; i >= 0; i--) {
      if (!ws[i].isDestroyed()) {
        return ws[i];
      }
    }
    return null;
  }

  /**
   * Restores latest window is any present.
   */
  restoreLast() {
    const win = this.lastActive;
    if (win) {
      win.show();
    } else {
      this.open();
    }
  }

  /**
   * Listens for relevant for this class events from the renderer.
   */
  listen() {
    ipcMain.on('new-window', this[windowOpenHandler]);
    ipcMain.on('toggle-devtools', this[toggleDevToolsHandler]);
    ipcMain.on('settings-changed', this[settingHandler]);
    ipcMain.on('window-context-menu-init', this[winContextInitHandler]);
    ipcMain.handle('workspace-get-location', this[workspaceLocationHandler]);
    ipcMain.handle('workspace-change-location', this[workspaceChangeLocationHandler]);
  }

  /**
   * Notifies all opened windows with event data.
   *
   * @param {string} type Event type (channel name)
   * @param {any=} args List of arguments or a single argument
   * @param {BrowserWindow=} ignored The window that should not receive the notification.
   */
  notifyAll(type, args=[], ignored) {
    logger.debug(`[WM] Notifying all windows with type: ${type}`);
    this.windows.forEach((win, index) => {
      if (win.isDestroyed()) {
        this.windows.splice(index, 1);
        return;
      }
      if (ignored && win.id === ignored.id) {
        return;
      }
      if (Array.isArray(args)) {
        win.webContents.send(type, ...args);
      } else {
        win.webContents.send(type, args);
      }
    });
  }

  /**
   * Finds an index for a window.
   * @returns {number}
   */
  findIndex() {
    const { windows } = this;
    if (!windows.length) {
      return 1;
    }
    windows.sort((a, b) => a.id - b.id);
    const len = windows.length;
    for (let i = 1; i < len; i++) {
      if (windows[i].id !== i) {
        return i;
      }
    }
    return len + 1;
  }

  /**
   * Closes a window by its WebContents id
   * @param {number} id
   */
  closeWindow(id) {
    const bWin = this.windows.find((win) => win.webContents.id === id);
    if (bWin.isDestroyed()) {
      const index = this.windows.indexOf(bWin);
      this.windows.splice(index, 1);
      return;
    }
    bWin.close();
  }

  /**
   * @param {{[key: string]: string}} target
   */
  createArcWindowInitOptions(target) {
    const { startupOptions } = this;
    if (startupOptions.proxy) {
      target.proxy = startupOptions.proxy;
      if (startupOptions.proxyUsername) {
        target.proxyUsername = startupOptions.proxyUsername;
      }
      if (startupOptions.proxyPassword) {
        target.proxyPassword = startupOptions.proxyPassword;
      }
    }
  }

  /**
   * Opens a new application window.
   *
   * @param {OpenPageOptions=} [options={}] Page create options. Don't set for the default ARC window.
   * @return {Promise<Electron.BrowserWindow>} Resolved promise when the window is ready.
   */
  async open(options={}) {
    const { page, route, params={}, workspaceFile } = options;
    let { preload } = options;
    if (!preload && !page || page === 'app.html') {
      preload = 'arc-preload.js';
    }
    if (workspaceFile) {
      const id = v4();
      this.workspacesMap.set(id, workspaceFile);
      params.workspaceId = id;
    }
    this.createArcWindowInitOptions(params);
    logger.debug('[WM] Opening new window');
    const id = this.findIndex();
    let info;
    if (options.sizing) {
      info = options.sizing;
    } else {
      info = options.ignoreWindowSessionSettings ? {} : await this.workspace.restoreWindowState(id);
    }
    const win = this.createWindow(info, preload, options);
    if (options.noMenu) {
      win.removeMenu();
      win.setMenu(null);
    }
    this.addWidowListeners(win, options.ignoreWindowSessionSettings);
    this.windows.push(win);
    this.loadPage(win, page, route, params);
    if (this.startupOptions.withDevtools) {
      win.webContents.openDevTools();
    }
    // win.webContents.openDevTools();
    return win;
  }

  /**
   * Opens ARC application window with path set to file action.
   *
   * @param {ProtocolFile} options Action configuration.
   * @return {Promise<Electron.BrowserWindow|undefined>}
   */
  async openWithAction(options) {
    if (!options) {
      logger.error('openWithAction called without argument.');
      return undefined;
    }
    logger.debug(`[WM] Opening new window with action ${options.source} ${options.action}`);
    const route = `file-protocol-action/${options.source}/${options.action}/${options.id}`;
    return this.open({
      route,
    });
  }

  /**
   * @param {string=} preload The preload script to load from the `src/preload/` folder.
   * @returns {Electron.BrowserWindowConstructorOptions} The base options for ARC windows.
   */
  createBaseWindowOptions(preload) {
    const options = /** @type Electron.BrowserWindowConstructorOptions */({
      backgroundColor: '#00A2DF',
      show: false,
      title: 'Advanced REST Client',
      webPreferences: {
        partition: MainWindowPersist,
        nativeWindowOpen: true,
        nodeIntegration: false,
        contextIsolation: false,
        // DO NOT ENABLE THIS FOR ALL WINDOWS.
        // webSecurity: false,
      },
    });
    if (preload) {
      options.webPreferences.preload = path.join(__dirname, '..', 'preload', preload);
    }
    return options;
  }

  /**
   * Creates a configured browser window.
   * @param {WindowSession} info
   * @param {string=} preload The preload script to load from the `src/preload/` folder.
   * @param {OpenPageOptions=} init
   * @returns {BrowserWindow}
   */
  createWindow(info, preload, init={}) {
    const options = { ...this.createBaseWindowOptions(preload), ...info };
    if (init.noWebSecurity) {
      options.webPreferences.webSecurity = false;
    }
    if (init.parent) {
      options.parent = init.parent;
    }
    return new BrowserWindow(options);
  }

  /**
   * Loads application for a path.
   *
   * @param {BrowserWindow} win Window to load the app to.
   * @param {string=} [page='app.html'] The page to open from the src/app folder.
   * @param {string=} [appPath=''] ARC internal routing path.
   * @param {{[key: string]: string}=} [params={}] A list of parameters to pass to the page with query parameters
   */
  loadPage(win, page='app.html', appPath='', params={}) {
    const full = url.format({
      hostname: AppHostname,
      pathname: `/src/app/${page}`,
      // loads the entire page on the esm protocol so all assets are served through it
      // TODO: ARC <16 uses the `file:` protocol and does not use host name. An adapter is needed to be shipped
      // with ARC 16 to move all data from the old domain.
      protocol: 'web-module:',
      slashes: true,
      hash: appPath,
      query: params,
    });
    logger.debug(`[WM] Loading page: ${full}`);
    win.loadURL(full);
  }

  /**
   * Adds browser window event listeners
   * 
   * @param {BrowserWindow} win Window to attach listeners to.
   * @param {boolean=} ignoreWindowSessionSettings
   */
  addWidowListeners(win, ignoreWindowSessionSettings=false) {
    win.addListener('closed', this[closedHandler]);
    if (!ignoreWindowSessionSettings) {
      win.addListener('move', this[movedHandler]);
      win.addListener('resize', this[resizedHandler]);
    }
    win.addListener('focus', this[focusedHandler]);
    win.once('ready-to-show', this[windowReadyHandler].bind(this, win));
    win.webContents.on('new-window', this[windowOpenHandler]);
  }

  /**
   * Finds window index position in windows array.
   *
   * @param {BrowserWindow} win Window to search
   * @return {number} Window position or `-1` if not found.
   */
  findWindowIndex(win) {
    const noId = win.isDestroyed();
    return this.windows.findIndex((item) => {
      if (item.isDestroyed()) {
        return win === item;
      }
      if (noId) {
        return false;
      }
      return item.id === win.id;
    });
  }

  /**
   * Reloads all not destroyed windows.
   */
  reloadWindows() {
    logger.debug('[WM] Reloading all windows.');
    const { windows } = this;
    for (let i = windows.length - 1; i >= 0; i--) {
      const win = windows[i];
      if (win.isDestroyed()) {
        this.windows.splice(i, 1);
        return;
      }
      win.reload();
    }
  }

  // 
  // Event handlers
  // 

  [windowOpenHandler]() {
    this.open();
  }

  /**
   * Handler for `toggle-devtools` event. Opens devtools on sender.
   *
   * @param {any} e The event emitted by the renderer process.
   */
  [toggleDevToolsHandler](e) {
    const win = /** @type BrowserWindow  */ (e.sender);
    win.webContents.toggleDevTools();
  }

  /**
   * A handler for a `settings-changed` from the renderer process. It informs other windows about the change.
   *
   * @param {any} e The event emitted by the renderer process.
   * @param {string} key
   * @param {any} value
   * @param {string} area
   */
  [settingHandler](e, key, value, area) {
    const win = /** @type BrowserWindow  */ (e.sender);
    this.notifyAll('settings-changed', {
      key,
      value,
      area,
    }, win);
  }

  /**
   * Handler for the `new-window` event emitted by the window object.
   * Opens new chrome tab with requested content.
   *
   * @param {Electron.IpcMainEvent} event Emitted event.
   * @param {string} openUrl Requested URL
   * @param {string} frameName
   */
  [popupHandler](event, openUrl, frameName) {
    if (frameName !== 'modal') {
      return;
    }
    event.preventDefault();
    shell.openExternal(openUrl);
  }

  /**
   * @param {*} e
   */
  [focusedHandler](e) {
    const win = /** @type Electron.BrowserWindow  */ (e.sender);
    this[lastFocusedSymbol] = win;
    const index = this[focusQueueSymbol].indexOf(win);
    if (index !== -1) {
      this[focusQueueSymbol].splice(index, 1);
    }
    this[focusQueueSymbol].unshift(win);
  }

  [resizedHandler](e) {
    const win = /** @type BrowserWindow  */ (e.sender);
    this.workspace.resizeHandler(win);
  }

  [movedHandler](e) {
    const win = /** @type BrowserWindow  */ (e.sender);
    this.workspace.moveHandler(win);
  }

  /**
   * Handler for the BrowserWindow `closed` event.
   * Removes the window from the windows array.
   *
   * @param {*} e Event emitted by the window.
   */
  [closedHandler](e) {
    const win = /** @type BrowserWindow */ (e.sender);
    if (this[lastFocusedSymbol] === win) {
      this[lastFocusedSymbol] = undefined;
    }
    const focusIndex = this[focusQueueSymbol].indexOf(win);
    if (focusIndex !== -1) {
      this[focusQueueSymbol].splice(focusIndex, 1);
    }
    const index = this.findWindowIndex(win);
    if (index === -1) {
      return;
    }
    this.windows.splice(index, 1);
    // const { welcomeWindow } = this;
    // this.welcomeWindow = undefined;
    // if (win !== welcomeWindow && !this.windows.length) {
    //   this.openWelcome();
    // }
  }

  /**
   * Handler for the "ready-to-show" event
   *
   * @param {BrowserWindow} win
   */
  [windowReadyHandler](win) {
    logger.debug('[WM] Window is ready to show');
    win.show();
  }

  /**
   * Handler for the window basic state info request.
   *
   * @param {Electron.IpcMainEvent} e Event emitted by the window.
   */
  [winContextInitHandler](e) {
    this.contextActions.registerDefaultActions(e.sender);
  }

  /**
   * @param {any} event
   * @param {string=} id
   */
  async [workspaceLocationHandler](event, id) {
    const loc = this.workspacesMap.get(id);
    if (loc) {
      return loc;
    }
    const contents = /** @type Electron.WebContents */ (event.sender);
    // - 1 so it will be compatible with old architecture
    const index = this.readWebContentsBrowserId(contents) - 1;
    let file = 'workspace';
    if (index) {
      file += `.${index}`;
    }
    file += '.json';
    return path.join(process.env.ARC_WORKSPACE_PATH, file);
  }

  /**
   * The handler to the request to change the current workspace location.
   * @param {any} event
   * @param {string} fileLocation
   */
  async [workspaceChangeLocationHandler](event, fileLocation) {
    const id = v4();
    this.workspacesMap.set(id, fileLocation);
    return id;
  }

  /**
   * Searches for the BrowserWindow id by its web contents id.
   * I expect the WebContents id equals to the BrowserWindow id but it is not documented
   * or explicitly stated so it searches for the browser window id.
   * 
   * @param {WebContents} contents
   * @returns {number}
   */
  readWebContentsBrowserId(contents) {
    const bw = this.windows.find((win) => win.webContents === contents);
    if (!bw) {
      return contents.id;
    }
    return bw.id;
  }
}
