import { ipcMain, BrowserWindow } from 'electron';

const findHandler = Symbol('findHandler');
const clearHandler = Symbol('clearHandler');
const foundInPageHandler = Symbol('foundInPageHandler');
const initializeSearchBar = Symbol('initializeSearchBar');
const positionWindow = Symbol('positionWindow');
const listenTargetEvents = Symbol('listenTargetEvents');
const unlistenTargetEvents = Symbol('unlistenTargetEvents');
const listenBarEvents = Symbol('listenBarEvents');
const unlistenBarEvents = Symbol('unlistenBarEvents');
const resizeHandler = Symbol('resizeHandler');
const moveHandler = Symbol('moveHandler');
const targetCloseHandler = Symbol('targetCloseHandler');
const barCloseHandler = Symbol('barCloseHandler');
const focusBarInput = Symbol('focusBarInput');
const targetReloadHandler = Symbol('targetReloadHandler');
const searchBarCommandHandler = Symbol('searchBarCommandHandler');

/** @typedef {import('./WindowsManager').WindowsManager} WindowsManager */

/**
 * A service that performs a content search in the WebContents using Chrome APIs.
 * 
 * Why is this class creating a new BrowserWindow?
 * 
 * When the search bar is included in the DOM it is also a part of the searched content. The search filed
 * gets highlighted and when the user is typing the input looses focus.
 * It is not enough to use iframe or (the current) web-view. Iframe is also being pare of the text search on
 * the page and the web-view element is basically a new browser window which requires using IPC but is currently 
 * not recommended by Electron authors to use.
 */
export class ContentSearchService {
  /**
   * @returns {object} Bounds object for the window.
   */
  get searchBarBounds() {
    return {
      width: 400,
      height: 56
    };
  }

  /**
   * @param {WindowsManager} windowsManager
   */
  constructor(windowsManager) {
    this.windowsManager = windowsManager;
    /** 
     * The map of find in page request IDs and the corresponding windows.
     * 
     * @type {{[key: number]: Electron.WebContents}}
     */
    this.requests = {};
    /** 
     * The list of WebContents being currently processed by this content search service.
     * @type {Electron.WebContents[]}
     */
    this.contents = [];

    /** 
     * @type {{ barWindow: BrowserWindow, targetWindow: BrowserWindow }[]}
     */
    this.map = [];

    this[resizeHandler] = this[resizeHandler].bind(this);
    this[moveHandler] = this[moveHandler].bind(this);
    this[targetCloseHandler] = this[targetCloseHandler].bind(this);
    this[barCloseHandler] = this[barCloseHandler].bind(this);
    this[targetReloadHandler] = this[targetReloadHandler].bind(this);
  }

  listen() {
    ipcMain.on('search-bar-command', this[searchBarCommandHandler].bind(this));
  }

  /**
   * Starts a search for a content window or focuses on the search button if the search bar is already opened.
   * @param {Electron.BrowserWindow} win
   */
  start(win) {
    const item = this.map.find((entry) => entry.targetWindow === win);
    if (item) {
      this[focusBarInput](item.barWindow);
    } else {
      this[initializeSearchBar](win);
    }
  }

  /**
   * Creates a new search bar and attaches it to the given windows
   * @param {Electron.BrowserWindow} targetWindow
   */
  [initializeSearchBar](targetWindow) {
    const options = { 
      ...this.windowsManager.createBaseWindowOptions('arc-preload.js'),
      frame: false,
      movable: false,
      parent: targetWindow,
      transparent: true,
      // backgroundColor: '#00ffffff',
      // hasShadow: false,
    };
    delete options.backgroundColor;
    const barWindow = new BrowserWindow(options);
    this.map.push({
      barWindow,
      targetWindow,
    });
    this[positionWindow](barWindow, targetWindow);
    this.windowsManager.loadPage(barWindow, 'search-bar.html');
    this[listenTargetEvents](targetWindow);
    this[listenBarEvents](barWindow);
    barWindow.webContents.once('did-finish-load', () => this[focusBarInput](barWindow));
    if (process.argv.includes('--dev')) {
      barWindow.webContents.openDevTools();
    }
  }

  /**
   * Positions the search bar window according to main window position.
   * 
   * @param {Electron.BrowserWindow} barWindow
   * @param {Electron.BrowserWindow} targetWindow
   */
  [positionWindow](barWindow, targetWindow) {
    const rect = targetWindow.getBounds();
    const winBounds = this.searchBarBounds;
    const maxRight = rect.width + rect.x;
    const x = maxRight - winBounds.width - 12; // padding
    const maxTop = rect.y + 26;
    winBounds.x = x;
    winBounds.y = maxTop;
    barWindow.setBounds(winBounds);
  }

  /**
   * Listens to the target window's move and resize events to reposition the corresponding search bar.
   * 
   * @param {Electron.BrowserWindow} targetWindow
   */
  [listenTargetEvents](targetWindow) {
    targetWindow.on('resize', this[resizeHandler]);
    targetWindow.on('move', this[moveHandler]);
    targetWindow.on('close', this[targetCloseHandler]);
    targetWindow.webContents.on('did-start-loading', this[targetReloadHandler]);
  }

  /**
   * Removes previously registered events.
   * 
   * @param {Electron.BrowserWindow} targetWindow
   */
  [unlistenTargetEvents](targetWindow) {
    targetWindow.removeListener('resize', this[resizeHandler]);
    targetWindow.removeListener('move', this[moveHandler]);
    targetWindow.removeListener('close', this[targetCloseHandler]);
    targetWindow.webContents.removeListener('did-start-loading', this[targetReloadHandler]);
  }

  /**
   * Listens to the search bar window events
   * 
   * @param {Electron.BrowserWindow} barWindow
   */
  [listenBarEvents](barWindow) {
    barWindow.on('close', this[barCloseHandler]);
  }

  /**
   * Removes previously registered search events/
   * 
   * @param {Electron.BrowserWindow} barWindow
   */
  [unlistenBarEvents](barWindow) {
    barWindow.removeListener('close', this[barCloseHandler]);
  }

  /**
   * A handler for `resize` event from the app window. Repositions the search bar window.
   * @param {any} e Event sent from the app window.
   */
  [resizeHandler](e) {
    const win = /** @type BrowserWindow  */ (e.sender);
    const item = this.map.find((entry) => entry.targetWindow === win);
    if (!item) {
      return;
    }
    this[positionWindow](item.barWindow, item.targetWindow);
  }

  /**
   * A handler for `move` event from the app window. Repositions the search bar window.
   * @param {any} e Event sent from the app window.
   */
  [moveHandler](e) {
    const win = /** @type BrowserWindow  */ (e.sender);
    const item = this.map.find((entry) => entry.targetWindow === win);
    if (!item) {
      return;
    }
    this[positionWindow](item.barWindow, item.targetWindow);
  }

  /**
   * Event handler for the application window close handler. Removes this service from cache,
   * closes search bar (if any) amd removes window listeners.
   * @param {any} e Event sent from the app window.
   */
  [targetCloseHandler](e) {
    const win = /** @type BrowserWindow  */ (e.sender);
    const index = this.map.findIndex((entry) => entry.targetWindow === win);
    if (index === -1) {
      return
    }
    const item = this.map[index];
    this.map.splice(index, 1);
    if (!item.barWindow.isDestroyed()) {
      item.barWindow.close();
    }
  }

  [barCloseHandler](e) {
    const win = /** @type BrowserWindow  */ (e.sender);
    const index = this.map.findIndex((entry) => entry.barWindow === win);
    if (index === -1) {
      return
    }
    const item = this.map[index];
    this.map.splice(index, 1);
    const { barWindow, targetWindow } = item;
    if (!this.contents.includes(targetWindow.webContents)) {
      const contentsIndex = this.contents.indexOf(targetWindow.webContents);
      this.contents.splice(contentsIndex, 1);
    }
    targetWindow.webContents.stopFindInPage('clearSelection');
    this[unlistenBarEvents](barWindow);
    this[unlistenTargetEvents](targetWindow); 
  }

  /**
   * Focuses on the input element of the search bar
   * 
   * @param {Electron.BrowserWindow} barWindow
   */
  [focusBarInput](barWindow) {
    if (barWindow.isDestroyed()) {
      return;
    }
    if (!barWindow.isVisible()) {
      barWindow.show();
    }
    barWindow.webContents.send('command', 'focus-input');
  }

  /**
   * @param {BrowserWindow} targetWindow
   * @param {BrowserWindow} barWindow
   * @param {string} query
   * @param {Electron.FindInPageOptions=} opts
   */
  [findHandler](targetWindow, barWindow, query, opts) {
    if (!this.contents.includes(targetWindow.webContents)) {
      this.contents.push(targetWindow.webContents);
      targetWindow.webContents.on('found-in-page', this[foundInPageHandler].bind(this));
    }
    
    const request = targetWindow.webContents.findInPage(query, opts);
    this.requests[request] = barWindow.webContents;
  }

  /**
   * @param {Electron.WebContents} targetContents
   */
  [clearHandler](targetContents) {
    const index = this.contents.findIndex((item) => item === targetContents);
    targetContents.stopFindInPage('clearSelection');
    targetContents.removeAllListeners('found-in-page');
    this.contents.splice(index, 1);
  }

  /**
   * @param {Electron.Event} event
   * @param {Electron.Result} detail
   */
  [foundInPageHandler](event, detail) {
    const { requestId, matches, activeMatchOrdinal } = detail;
    const barContents = this.requests[requestId];
    if (!barContents) {
      return;
    }
    delete this.requests[requestId];
    barContents.send('search-bar-found-in-page', matches, activeMatchOrdinal);
  }

  /**
   * @param {any} e
   * @param {...any} args
   */
  [searchBarCommandHandler](e, ...args) {
    const contents = /** @type Electron.WebContents */ (e.sender);
    const item = this.map.find((entry) => entry.barWindow.webContents === contents);
    if (!item) {
      return
    }
    const [command, ...rest] = args;
    switch (command) {
      case 'find': this[findHandler](item.targetWindow, item.barWindow, rest[0], rest[1]); break;
      case 'clear': this[clearHandler](item.targetWindow.webContents); break;
      case 'close': item.barWindow.close(); break;
      default:
    }
  }

  [targetReloadHandler](e) {
    const contents = /** @type Electron.WebContents */ (e.sender);
    const item = this.map.find((entry) => entry.targetWindow.webContents === contents);
    if (!item) {
      return;
    }
    item.barWindow.close();
  }
}
