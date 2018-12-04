const {BrowserWindow, ipcMain} = require('electron');
const path = require('path');
const url = require('url');
const log = require('./logger');
/**
 * Application menu by default is embedded in main application window.
 * User has an option to pop up menu to a new window. This class handles
 * events from the renderer process to make it possible.
 */
class AppMenuService {
  /**
   * @param {ArcEnvironment} app
   */
  constructor(app) {
    this.app = app;
    this.menuWindows = new Map();

    this._popupAppMenuHandler = this._popupAppMenuHandler.bind(this);
    this.__windowClosed = this.__windowClosed.bind(this);
    this._popupNavHandler = this._popupNavHandler.bind(this);
  }

  listen() {
    log.debug('Listening for menu popup events');
    ipcMain.on('popup-app-menu', this._popupAppMenuHandler);
    ipcMain.on('popup-app-menu-nav', this._popupNavHandler);
  }
  /**
   * Handler for `popup-app-menu` event dispatched by ARC windows.
   * @param {Event} e
   * @param {String} type Menu type
   * @param {?Object} sizing `width` and `height`
   */
  _popupAppMenuHandler(e, type, sizing) {
    log.debug('Handling menu popup event from app window.');
    if (this.menuWindows.has(type)) {
      log.debug('Showing existing window.');
      const menu = this.menuWindows.get(type);
      menu.show();
      return;
    }
    this.createMenuWindow(type, sizing);
  }
  /**
   * Creates menu window object.
   * If the `type` already exists then nothing happens.
   * @param {String} type Menu type
   * @param {Object} sizing `width` and `height`
   */
  createMenuWindow(type, sizing) {
    if (this.menuWindows.has(type)) {
      return;
    }
    log.debug('Creating menu popup window for type: ' + type);
    const bw = this.__getNewWindow(type, sizing);
    this.menuWindows.set(type, bw);
    this.__loadPage(type, bw);
    this.__attachListeners(bw);
    this.app.wm.notifyAll('popup-app-menu-opened', type);
  }

  /**
   * Creates new menu window.
   *
   * @param {String} type
   * @param {?Object} sizing
   * @return {BrowserWindow} Created window.
   */
  __getNewWindow(type, sizing) {
    const width = sizing && sizing.width ? sizing.width : 320;
    const height = sizing && sizing.height ? sizing.height : 800;
    const menuWindow = new BrowserWindow({
      width,
      height,
      backgroundColor: '#00A2DF',
      show: true,
      webPreferences: {
        partition: 'persist:arc-window',
        nativeWindowOpen: true,
        nodeIntegration: false,
        preload: path.join(__dirname, '..', 'renderer', 'app-menu-preload.js')
      }
    });
    menuWindow.setMenu(null);
    menuWindow.__menuType = type;
    return menuWindow;
  }
  /**
   * Creates application URL and loads app into the window.
   * @param {String} type
   * @param {BrowserWindow} bw
   */
  __loadPage(type, bw) {
    const dest = path.join(__dirname, '..', '..', 'src', 'arc-menu-window.html');
    const full = url.format({
      pathname: dest,
      protocol: 'file:',
      slashes: true,
      query: {
        type
      }
    });
    bw.loadURL(full);
  }

  __attachListeners(bw) {
    bw.addListener('closed', this.__windowClosed);
  }

  __dettachListeners(bw) {
    bw.removeListener('closed', this.__windowClosed);
  }
  /**
   * Handler for the BrowserWindow `closed` event.
   *
   * @param {Event} e Event emitted by the window.
   */
  __windowClosed(e) {
    const bw = e.sender;
    const type = bw.__menuType;
    this.__dettachListeners(bw);
    this.menuWindows.delete(type);
    this.app.wm.notifyAll('popup-app-menu-closed', type);
  }
  /**
   * Handler for an event dispatched by popup menu when navigation action was
   * performed.
   * @param {Event} e
   * @param {Object} detail Event detail
   */
  _popupNavHandler(e, detail) {
    log.debug('Handling popup menu event from the menu.');
    if (!this.app.wm.hasWindow) {
      log.warn('Popup menu event handled without menu window registered.');
      return;
    }
    let win = this.app.wm.lastFocused;
    if (!win) {
      win = this.app.wm.lastActive;
    }
    if (!win) {
      log.warn('Unable to perform navigation. No active window found.');
      return;
    }
    log.debug('Sending navigate event to the renderer process.');
    win.webContents.send('app-navigate', detail);
  }
  /**
   * Removes all generated menu windows.
   */
  clear() {
    log.debug('Removing all menu popup windows.');
    for (let win of this.menuWindows.values()) {
      win.destroy();
    }
  }
  /**
   * Toggles entitre menu window.
   */
  togglePopupMenu() {
    log.debug('Toggling menu popup window.');
    const win = this.menuWindows.get('*');
    if (win) {
      win.destroy();
    } else {
      this.clear();
      this.createMenuWindow('*');
    }
  }
}

module.exports.AppMenuService = AppMenuService;
