const {BrowserWindow, ipcMain} = require('electron');
const path = require('path');
const url = require('url');
/**
 * Application menu by default is embedded in main application window.
 * User has an option to pop up menu to a new window. This class handles
 * events from the renderer process to make it possible.
 */
class AppMenuService {
  /**
   * @param {ArcWindowsManager} wm Window manager
   * @param {SourcesManager} sm
   */
  constructor(wm, sm) {
    this.wm = wm;
    this.sourcesManager = sm;
    this.menuWindows = new Map();

    this._popupAppMenuHandler = this._popupAppMenuHandler.bind(this);
    this.__windowClosed = this.__windowClosed.bind(this);
    this._popupNavHandler = this._popupNavHandler.bind(this);
  }

  listen() {
    ipcMain.on('popup-app-menu', this._popupAppMenuHandler);
    ipcMain.on('popup-app-menu-nav', this._popupNavHandler);
  }

  _popupAppMenuHandler(e, type, sizing) {
    if (this.menuWindows.has(type)) {
      const menu = this.menuWindows.get(type);
      menu.show();
      return;
    }
    this.createMenuWindow(type, sizing);
  }

  createMenuWindow(type, sizing) {
    if (this.menuWindows.has(type)) {
      return;
    }
    this.sourcesManager.getAppConfig()
    .then((opts) => {
      const bw = this.__getNewWindow(type, sizing);
      this.menuWindows.set(type, bw);
      const importFile = path.join(opts.importDir, 'import-app-menu.html');
      this.__loadPage(type, bw, opts.themeFile, importFile);
      this.__attachListeners(bw);
    });
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
    const mainWindow = new BrowserWindow({
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
    mainWindow.__menuType = type;
    return mainWindow;
  }
  /**
   * Creates application URL and loads app into the window.
   * @param {String} type
   * @param {BrowserWindow} bw
   * @param {String} themeFile
   * @param {String} importFile
   */
  __loadPage(type, bw, themeFile, importFile) {
    const dest = path.join(__dirname, '..', '..', 'src',
      'arc-menu-window.html');
    const full = url.format({
      pathname: dest,
      protocol: 'file:',
      slashes: true,
      query: {
        type,
        themeFile,
        importFile
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
    this.__dettachListeners(bw);
    this.menuWindows.delete(bw.__menuType);
  }

  _popupNavHandler(e, detail) {
    if (!this.wm.hasWindow()) {
      return;
    }
  }
}

module.exports.AppMenuService = AppMenuService;
