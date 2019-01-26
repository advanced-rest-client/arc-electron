const {BrowserWindow, ipcMain} = require('electron');
const path = require('path');
const url = require('url');

const instances = [];
/**
 * A class that is responsible to controll content
 * search behavior in the window.
 */
class ContentSearchService {
  /**
   * @constructor
   * @param {BrowserWindow} win A window from where the request came from.
   */
  constructor(win) {
    this.win = win;
    this.searchBar = undefined;

    this._resizeHandler = this._resizeHandler.bind(this);
    this._moveHandler = this._moveHandler.bind(this);
    this._closeHandler = this._closeHandler.bind(this);
    this._appCloseHandler = this._appCloseHandler.bind(this);
    this._searchChangedHandler = this._searchChangedHandler.bind(this);
    this._searchNextHandler = this._searchNextHandler.bind(this);
    this._searchPreviousHandler = this._searchPreviousHandler.bind(this);
    this._searchResultHandler = this._searchResultHandler.bind(this);

    ContentSearchService.addService(this);
  }
  /**
   * Event handler for menu actions.
   *
   * @param {String} action Menu action
   * @param {BrowserWindow} win Owner window
   */
  static searchRequested(action, win) {
    if (action !== 'application:find') {
      return;
    }
    if (win.webContents.getURL().indexOf('search-bar') !== -1) {
      // ctrl+f from search bar.
      return;
    }
    let srv = ContentSearchService.getService(win);
    if (srv && srv.isOpened()) {
      srv.focus();
      return;
    }
    if (!srv) {
      srv = new ContentSearchService(win);
    }
    srv.open();
  }
  /**
   * Finds existing instance of search service for a window.
   *
   * @param {BrowserWindow} win Instance of the BrowserWindow.
   * @return {ContentSearchService} Instance of the class or undefined.
   */
  static getService(win) {
    return instances.find((item) => item.win === win);
  }
  /**
   * Adds instance of `ContentSearchService` to the list of active instances.
   * It will do nothing if the instance already exists in the list.
   *
   * @param {ContentSearchService} srv Instance to add.
   * @return {undefined}
   */
  static addService(srv) {
    let exists = !!ContentSearchService.getService(srv.win);
    if (exists) {
      return;
    }
    instances.push(srv);
  }
  /**
   * Removes instance from cached instances
   * @param {ContentSearchService} srv Service instance.
   */
  static removeService(srv) {
    let index = instances.find((item) => item.win === srv.win);
    if (index === -1) {
      return;
    }
    instances.splice(index, 1);
  }
  /**
   * @return {Object} Bounds object for the window.
   */
  get searchBarBounds() {
    return {
      width: 400,
      height: 56
    };
  }
  /**
   * Opens the search window.
   */
  open() {
    const win = this._getWindow();
    this._loadUI(win);
    this._listenSearchWindow(win);
    this._listenAppWindow();
    this.searchBar = win;
    win.webContents.once('did-finish-load', () => {
      setTimeout(() => {
        this.focus();
      }, 200);
    });
  }
  /**
   * Creates a window to open.
   * @return {BrowserWindow} Created window.
   */
  _getWindow() {
    const preload = path.join(__dirname, '..', 'renderer', 'search-preload.js');
    const win = new BrowserWindow({
      backgroundColor: '#ffffff',
      show: false,
      frame: false,
      movable: false,
      parent: this.win,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: false,
        preload
      }
    });
    // win.webContents.openDevTools();
    this._positionWindow(win);
    return win;
  }
  /**
   * Positions the search window accodring to main window.
   * @param {BrowserWindow} win A window to be positioned.
   */
  _positionWindow(win) {
    let winBounds = this._computeBounds(this.searchBarBounds);
    win.setBounds(winBounds);
  }
  /**
   * Computes search window bounds object with position.
   *
   * @param {Object} winBounds Bounds object with window dimmensions.
   * @return {Object} Updated bounds object with new dimensions and position.
   */
  _computeBounds(winBounds) {
    let rect = this.win.getBounds();
    let maxRight = rect.width + rect.x;
    let x = maxRight - winBounds.width - 12; // padding
    let maxTop = rect.y + 32;
    winBounds.x = x;
    winBounds.y = maxTop;
    return winBounds;
  }
  /**
   * Loads search bar UI in the window.
   * @param {BrowserWindow} win An instance of the window object
   */
  _loadUI(win) {
    const dest = path.join(__dirname, '..', '..', '..', '..', 'src', 'search-bar.html');
    const full = url.format({
      pathname: dest,
      protocol: 'file:',
      slashes: true
    });
    win.loadURL(full);
  }
  /**
   * Checks if any window is currently opened.
   *
   * @return {Boolean} True if the search bar is currently opened.
   */
  isOpened() {
    return !!this.searchBar;
  }
  /**
   * Listens for relevant events from the renderer process.
   * @param {BrowserWindow} win Window to listen for events on
   */
  _listenSearchWindow(win) {
    win.once('close', () => {
      this._unlistenSearchWindow();
      this._unlistenAppWindow();
      this.win.webContents.send('search-bar-query-changed', '');
    });
    win.once('closed', () => {
      this.searchBar = undefined;
    });
    ipcMain.on('search-bar-close', this._closeHandler);
    ipcMain.on('search-bar-query', this._searchChangedHandler);
    ipcMain.on('search-bar-query-next', this._searchNextHandler);
    ipcMain.on('search-bar-query-previous', this._searchPreviousHandler);
    ipcMain.on('search-bar-search-result', this._searchResultHandler);
  }
  /**
   * Unlistens renderer events.
   */
  _unlistenSearchWindow() {
    ipcMain.removeListener('search-bar-close', this._closeHandler);
    ipcMain.removeListener('search-bar-query', this._searchChangedHandler);
    ipcMain.removeListener('search-bar-query-next', this._searchNextHandler);
    ipcMain.removeListener('search-bar-query-previous',
      this._searchPreviousHandler);
    ipcMain.removeListener('search-bar-search-result',
      this._searchResultHandler);
  }
  /**
   * Listens for application events from the main process.
   */
  _listenAppWindow() {
    this.win.on('resize', this._resizeHandler);
    this.win.on('move', this._moveHandler);
    this.win.on('close', this._appCloseHandler);
    ipcMain.on('window-reloading', this._appCloseHandler);
  }
  /**
   * Unlistens application events from the main process.
   */
  _unlistenAppWindow() {
    this.win.removeListener('resize', this._resizeHandler);
    this.win.removeListener('move', this._moveHandler);
    ipcMain.removeListener('window-reloading', this._appCloseHandler);
  }
  /**
   * Focuses mouse on the search bar.
   */
  focus() {
    if (!this.isOpened()) {
      return;
    }
    if (!this.searchBar.isVisible()) {
      this.searchBar.show();
    }
    // this.searchBar.focus();
    this.searchBar.webContents.send('focus-input');
  }
  /**
   * A handler for `move` event from the app window.
   * Repositiones the search bar window.
   */
  _moveHandler() {
    if (!this.isOpened()) {
      return;
    }
    this._positionWindow(this.searchBar);
  }
  /**
   * A handler for the `resize` event from the app window.
   * Repositiones the search bar window.
   */
  _resizeHandler() {
    if (!this.isOpened()) {
      return;
    }
    this._positionWindow(this.searchBar);
  }
  /**
   * Event handler for the application window close handler.
   * Removes this service from cache, closes search bar (if any)
   * amd removes window listeners.
   * @param {Event} e Event sent from the app window.
   */
  _appCloseHandler(e) {
    if (e.sender !== this.win.webContents) {
      return;
    }
    this.win.removeListener('close', this._appCloseHandler);
    ContentSearchService.removeService(this);
    if (this.isOpened()) {
      this.searchBar.close();
    }
  }
  /**
   * Handler for the close search bar event.
   * @param {Event} e Event sent from the search bar window.
   */
  _closeHandler(e) {
    if (e.sender !== this.searchBar.webContents) {
      return;
    }
    this.searchBar.close();
  }
  /**
   * Informs the view about search action.
   * @param {Event} e Event sent from the search bar window.
   * @param {String} query The search term.
   */
  _searchChangedHandler(e, query) {
    if (e.sender !== this.searchBar.webContents) {
      return;
    }
    this.win.webContents.send('search-bar-query-changed', query);
  }
  /**
   * A handler for search next action.
   * @param {Event} e Event sent from the search bar window.
   */
  _searchNextHandler(e) {
    if (e.sender !== this.searchBar.webContents) {
      return;
    }
    this.win.webContents.send('search-bar-query-next');
  }
  /**
   * A handler for search previous action.
   * @param {Event} e Event sent from the search bar window.
   */
  _searchPreviousHandler(e) {
    if (e.sender !== this.searchBar.webContents) {
      return;
    }
    this.win.webContents.send('search-bar-query-previous');
  }
  /**
   * A handler for search results event.
   * Informs the search bar about number of results available.
   * @param {Event} e Event sent from the search bar window.
   * @param {Number} count Search results count
   * @param {Number} selected Currently selected instance.
   */
  _searchResultHandler(e, count, selected) {
    if (e.sender !== this.win.webContents) {
      return;
    }
    this.searchBar.webContents.send('search-count', count, selected);
  }
}
exports.ContentSearchService = ContentSearchService;
