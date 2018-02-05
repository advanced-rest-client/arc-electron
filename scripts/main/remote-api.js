const log = require('electron-log');
const {BrowserWindow, ipcMain} = require('electron');
const {ArcBase} = require('./arc-base');
/**
 * A class responsible for handling remote API operations.
 */
class RemoteApi extends ArcBase {
  /**
   * @param {ArcWindowsManager} wm Window manager
   */
  constructor(wm) {
    super();
    this.wm = wm;
  }
  /**
   * Returns focused, first available or newly created window (in that order).
   * New window is started when there's no winow opened.
   *
   * @return {Promise} Promise resolved to a BrowserWindow object.
   */
  getActiveWindow() {
    log.info('Getting active window...');
    var win = BrowserWindow.getFocusedWindow();
    if (win) {
      return Promise.resolve(win);
    }
    log.info('Focused window not found. Getting any first window.');
    var wins = BrowserWindow.getAllWindows();
    if (wins && wins.length) {
      return Promise.resolve(wins[0]);
    }
    log.info('No windows found. Creating a window.');
    return this.wm.open();
  }

  /**
   * Allows to update a request object in active window and specific tab.
   * By defaulty currently selected tab is used.
   * If there's no winowd new one is be created. If any window isn't focused
   * first window is used.
   *
   * @param {Object} requestObj ARC request object (url, method, headers, payload)
   * @param {?Number} tab Tab index in the window.
   * @return {Promise} Promise resolved when the command was sent to the window.
   */
  updateRequest(requestObj, tab) {
    log.log('RemoteApi::updateRequest::tab:', tab);
    return this.getActiveWindow()
    .then(win => {
      log.info('Updating request in active window. Update tab is', tab);
      win.webContents.send('request-action', 'update-request', requestObj, tab);
    });
  }

  /**
   * Opens a new tab currently focused window or first window of the list of
   * opened windows, or creates a new window if can't determine current window.
   *
   * @return {Promise} Promise resolved when command was sent to window
   */
  newTab() {
    return this.getActiveWindow()
    .then(win => {
      win.webContents.send('request-action', 'new-tab');
    });
  }
  /**
   * Returns a number of tabs for given window index.
   * Currently focused or first window is used if the index is not provided.
   *
   * @param {?Number} windowIndex The index of the window
   * @return {Promise} Promise resolved to number of tabs.
   */
  getTabsCount(windowIndex) {
    var p;
    if (typeof windowIndex === 'number') {
      let win = BrowserWindow.getAllWindows()[windowIndex];
      if (!win) {
        return Promise.reject('Window for given index does not exists');
      }
      p = Promise.resolve(win);
    } else {
      p = this.getActiveWindow();
    }
    return p
    .then(win => this.getTabsCountForWindow(win));
  }
  /**
   * Returns a number of tabs for given window object.
   *
   * @param {BrowserWindow} win The window object
   * @return {Promise} Promise resolved to number of tabs.
   */
  getTabsCountForWindow(win) {
    var id = this.nextIpcRequestId();
    const p = this.appendPromise(id);
    ipcMain.once('current-tabs-count', this.ipcPromiseCallback);
    win.webContents.send('command', 'get-tabs-count', id);
    return p;
  }

  /**
   * Sets a tab active for given window.
   * Active window is used if the index is not provided.
   *
   * @param {Number} tabIndex Index of the tab to set it active.
   * @param {?Number} windowIndex The index of the window
   * @return {Promise} Promise resolved when command was send.
   */
  activateTab(tabIndex, windowIndex) {
    var p;
    if (typeof windowIndex === 'number') {
      let win = BrowserWindow.getAllWindows()[windowIndex];
      if (!win) {
        return Promise.reject('Window for given index does not exists');
      }
      p = Promise.resolve(win);
    } else {
      p = this.getActiveWindow();
    }
    return p
    .then(win => this.activateTabForWindow(tabIndex, win));
  }

  activateTabForWindow(tabIndex, win) {
    var id = this.nextIpcRequestId();
    const p = this.appendPromise(id);
    ipcMain.once('tab-activated', this.ipcPromiseCallback);
    win.webContents.send('command', 'activate-tab', id, tabIndex);
    return p;
  }

  getRequest(tabIndex, windowIndex) {
    var p;
    if (typeof windowIndex === 'number') {
      let win = BrowserWindow.getAllWindows()[windowIndex];
      if (!win) {
        return Promise.reject('Window for given index does not exists');
      }
      p = Promise.resolve(win);
    } else {
      p = this.getActiveWindow();
    }
    return p
    .then(win => this.getRequestForWindow(tabIndex, win));
  }

  getRequestForWindow(tabIndex, win) {
    var id = this.nextIpcRequestId();
    const p = this.appendPromise(id);
    ipcMain.once('request-data', this.ipcPromiseCallback);
    win.webContents.send('command', 'get-request-data', id, tabIndex);
    return p;
  }
}
exports.RemoteApi = RemoteApi;
