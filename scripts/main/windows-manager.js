const {BrowserWindow, dialog, ipcMain} = require('electron');
const path = require('path');
const url = require('url');
const {ArcSessionControl} = require('@advanced-rest-client/arc-electron-preferences/main');
const {ArcSessionRecorder} = require('./arc-session-recorder');
const {ContextActions} = require('./context-actions');
/**
 * A class that manages opened app windows.
 */
class ArcWindowsManager {
  /**
   * @param {Object} startupOptions Application startup object. See
   * `AppOptions` for more details.
   * @param {SourcesManager} sm
   */
  constructor(startupOptions, sm) {
    this.startupOptions = startupOptions || {};
    this.windows = [];
    // Task manager window reference.
    this._tmWin = undefined;
    this.__windowClosed = this.__windowClosed.bind(this);
    this.__windowMoved = this.__windowMoved.bind(this);
    this.__windowResized = this.__windowResized.bind(this);
    this.__windowFocused = this.__windowFocused.bind(this);
    this.__windowOpenedPopup = this.__windowOpenedPopup.bind(this);
    this.__contextMenuHandler = this.__contextMenuHandler.bind(this);
    this._settingChangedHandler = this._settingChangedHandler.bind(this);
    this.recorder = new ArcSessionRecorder();
    this.contextActions = new ContextActions();
    this.sourcesManager = sm;
    /**
     * Pointer to last focused window.
     * @type {BrowserWindow}
     */
    this._lastFocused = undefined;
  }
  /**
   * @return {Boolean} True if has at leas one window.
   */
  get hasWindow() {
    return this.windows.length > 0;
  }
  /**
   * @return {BrowserWindow|undefined} Reference to last focused browser window
   * or undefined if the window is destroyed or undefined.
   */
  get lastFocused() {
    if (!this._lastFocused) {
      return;
    }
    if (this._lastFocused.isDestroyed()) {
      this._lastFocused = undefined;
      return;
    }
    return this._lastFocused;
  }
  /**
   * @return {BrowserWindow} Returns reference to last created and still active
   * window object.
   */
  get lastActive() {
    const ws = this.windows;
    if (!ws || !ws.length) {
      return;
    }
    for (let i = ws.length; i >= 0; i--) {
      if (!ws[i].isDestroyed()) {
        return ws[i];
      }
    }
  }
  /**
   * Restores latest window is any present.
   */
  restoreLast() {
    const win = this.windows && this.windows.length &&
      this.windows[this.windows.length - 1];
    if (win) {
      if (win.isDestroyed()) {
        this.windows.pop();
        this.open();
      } else {
        win.show();
      }
    } else {
      this.open();
    }
  }
  /**
   * Listens for relevant for this class events from the renderer.
   */
  listen() {
    ipcMain.on('window-reloading', this.__windowReloading.bind(this));
    ipcMain.on('new-window', this._windowOpenHandler.bind(this));
    ipcMain.on('toggle-devtools', this._toggleDevToolsHandler.bind(this));
    ipcMain.on('reload-app-required', this._reloadRequiredHandler.bind(this));
    ipcMain.on('settings-changed', this._settingChangedHandler);
    ipcMain.on('window-state-request', this._winStateRequestHandler.bind(this));
  }
  /**
   * A handler for new window open event. Calls `open()` function.
   */
  _windowOpenHandler() {
    this.open();
  }
  /**
   * Handler for `toggle-devtools` event. Opens devtools on sender.
   *
   * @param {Event} e Event emmited by renderer process.
   */
  _toggleDevToolsHandler(e) {
    e.sender.webContents.toggleDevTools();
  }
  /**
   * Handler for the `reload-app-required` event emitted by renderer.
   * Displays "reload" dialog and reloads the app if required.
   *
   * @param {Event} e Event emmited by renderer process.
   * @param {?String} message Message to display to the user.
   */
  _reloadRequiredHandler(e, message) {
    message = message || 'To complete this action reload the application.';
    const win = BrowserWindow.fromWebContents(e.sender);
    dialog.showMessageBox(win, {
      type: 'info',
      buttons: ['Reload', 'Later'],
      defaultId: 0,
      cancelId: 1,
      title: 'Reload Advanced REST Client?',
      message: message,
    }, (response) => {
      if (response === 0) {
        this.reloadWindows();
      }
    });
  }
  /**
   * Notifies all opened windows with event data.
   *
   * @param {String} type Event type (channel name)
   * @param {?Array} args List of arguments.
   */
  notifyAll(type, args) {
    this.windows.forEach((win, index) => {
      if (win.isDestroyed()) {
        this.windows.splice(index, 1);
        return;
      }
      win.webContents.send(type, args);
    });
  }
  /**
   * Notifies all opened windows with event data
   * except for a window represented by a WebContents.
   *
   * @param {String} type Event type (channel name)
   * @param {?Array} args List of arguments.
   * @param {WebContents} wc Window that should not receive
   * notification.
   */
  notifyAllBut(type, args, wc) {
    this.windows.forEach((win, index) => {
      if (win.isDestroyed()) {
        this.windows.splice(index, 1);
        return;
      }
      if (win.webContents.id === wc.id) {
        return;
      }
      win.webContents.send(type, args);
    });
  }
  /**
   * Opens a new application window.
   *
   * @param {?String} path Application path to open (ARC's router path).
   * @return {Promise} Resolved promise when the window is ready.
   */
  open(path) {
    const index = this.windows.length;
    const session = new ArcSessionControl(index);
    return session.load()
    .then((data) => {
      const win = this.__getNewWindow(index, data);
      win.__arcSession = session;
      this.__loadPage(win, path);
      if (this.startupOptions.debug) {
        win.webContents.openDevTools();
      }
      this.__attachListeners(win);
      this.windows.push(win);
      return this.recorder.record()
      .then(() => win);
    });
  }
  /**
   * Opens task manager window. If the window is already created it tries to
   * brings it to front.
   */
  openTaskManager() {
    if (this._tmWin) {
      if (this._tmWin.isMinimized()) {
        this._tmWin.restore();
      }
      this._tmWin.focus();
      return;
    }
    const win = new BrowserWindow({
      backgroundColor: '#00A2DF',
      webPreferences: {
        partition: 'persist:arc-task-manager'
      }
    });
    const dest = path.join(__dirname, '..', '..', 'task-manager.html');
    const full = url.format({
      pathname: dest,
      protocol: 'file:',
      slashes: true
    });
    win.loadURL(full);
    win.on('closed', () => {
      this._tmWin = null;
    });
    win.setMenu(null);
    this._tmWin = win;
  }
  /**
   * Creates new Application window.
   *
   * @param {Number} index Index of the window.
   * @param {Object} session Session control data object.
   * @return {BrowserWindow} Created window.
   */
  __getNewWindow(index, session) {
    let mainWindow = new BrowserWindow({
      width: session.size.width,
      height: session.size.height,
      x: session.position.x,
      y: session.position.y,
      backgroundColor: '#00A2DF',
      show: false,
      webPreferences: {
        partition: 'persist:arc-window',
        nativeWindowOpen: true,
        nodeIntegration: false,
        preload: path.join(__dirname, '..', 'renderer', 'preload.js')
      }
    });
    mainWindow.__arcIndex = index;
    return mainWindow;
  }
  /**
   * Loads application for a path.
   *
   * @param {BrowserWindow} win Window to load the app to.
   * @param {String} appPath ARC internal routing path.
   */
  __loadPage(win, appPath) {
    appPath = appPath || '#/request/latest/0';
    if (appPath[0] === '/') {
      appPath = '#' + appPath;
    }
    win._startPath = appPath;
    const dest = path.join(__dirname, '..', '..', 'app.html');
    const full = url.format({
      pathname: dest,
      protocol: 'file:',
      slashes: true
    }) + appPath;
    win.loadURL(full);
  }
  /**
   * Creates a startup options info object to be passed to
   * starting application window.
   *
   * @param {Event} ev
   */
  _winStateRequestHandler(ev) {
    const contents = ev.sender;
    const win = this.windows.find((item) => {
      if (item.isDestroyed()) {
        return false;
      }
      return item.id === contents.id;
    });
    this.sourcesManager.getAppConfig()
    .then((opts) => {
      if (win) {
        opts.workspaceIndex = win.__arcIndex;
        this.contextActions.registerDefaultActions(win.webContents);
      } else {
        opts.workspaceIndex = 0;
      }
      contents.send('window-state-info', opts);
    });
  }
  /**
   * Attaches listeners to the window object.
   *
   * @param {BrowserWindow} win Window to attach listeners to.
   */
  __attachListeners(win) {
    win.addListener('closed', this.__windowClosed);
    win.addListener('move', this.__windowMoved);
    win.addListener('resize', this.__windowResized);
    win.addListener('focus', this.__windowFocused);
    win.once('ready-to-show', this.__readyShowHandler.bind(this));
    win.webContents.on('new-window', this.__windowOpenedPopup);
    win.webContents.on('arc-context-menu', this.__contextMenuHandler);
  }
  /**
   * Finds window index position in windows array.
   *
   * @param {BrowserWindow} win Window to search
   * @return {Number} Window position or `-1` if not found.
   */
  _findWindowImdex(win) {
    if (win.isDestroyed()) {
      return -1;
    }
    return this.windows.findIndex((item) => {
      if (item.isDestroyed()) {
        return win === item;
      }
      return item.id === win.id;
    });
  }
  /**
   * Handler for the BrowserWindow `closed` event.
   * Removes the window from the windows array.
   *
   * @param {Event} e Event emitted by the window.
   */
  __windowClosed(e) {
    if (this._lastFocused === e.sender) {
      this._lastFocused = undefined;
    }
    const index = this._findWindowImdex(e.sender);
    if (index === -1) {
      return;
    }
    this.windows.splice(index, 1);
  }
  /**
   * Handler for the BrowserWindow `move` event.
   * Stores session value for window position.
   *
   * @param {Event} e Event emitted by the window.
   */
  __windowMoved(e) {
    const win = e.sender;
    const pos = win.getPosition();
    win.__arcSession.updatePosition(pos[0], pos[1]);
  }
  /**
   * Handler for the BrowserWindow `resize` event.
   * Stores session value for window position.
   *
   * @param {Event} e Event emitted by the window.
   */
  __windowResized(e) {
    const win = e.sender;
    const size = win.getSize();
    win.__arcSession.updateSize(size[0], size[1]);
  }
  /**
   * Handler for the focus event on the BrowserWindow object.
   * Sets `_lastFocused` property.
   * @param {Event} e
   */
  __windowFocused(e) {
    this._lastFocused = e.sender;
  }
  /**
   * Handler for BrowserWindow `ready-to-show` event.
   * Passes startup options to the window and shows it.
   *
   * @param {Event} e Event emitted by the window.
   */
  __readyShowHandler(e) {
    e.sender.show();
  }
  /**
   * Adds the `did-finish-load` event to reset the window when it's reloaded.
   *
   * @param {Event} e Event emitted by the window.
   */
  __windowReloading(e) {
    const contents = e.sender;
    const win = this.windows.find((item) => {
      if (item.isDestroyed()) {
        return false;
      }
      return item.id === contents.id;
    });
    if (win) {
      delete win._startPath;
    }
  }
  /**
   * Handler for the `new-window` event emitted by the window object.
   * Opens new chrome tab with requested content.
   *
   * @param {Event} event Emitted event.
   * @param {String} url Requested URL
   * @param {String} frameName
   */
  __windowOpenedPopup(event, url, frameName/* , disposition, options*/) {
    if (frameName !== 'modal') {
      return;
    }
    event.preventDefault();
    // Object.assign(options, {
    //   modal: true,
    //   parent: event.sender,
    //   width: 100,
    //   height: 100
    // });
    // event.newGuest = new BrowserWindow(options);
    const {shell} = require('electron');
    shell.openExternal(url);
  }
  /**
   * Reloads all not destroyed wondows.
   */
  reloadWindows() {
    this.windows.forEach((win, index) => {
      if (win.isDestroyed()) {
        this.windows.splice(index, 1);
        return;
      }
      win.reload();
    });
  }
  /**
   * A handler for a `settigs-changed` from a renderer process.
   * It informs other windows about the change so all
   * windows can consume the same change.
   *
   * @param {Event} event
   * @param {String} key
   * @param {String|Number|Boolean|Object} value
   * @param {String} area
   */
  _settingChangedHandler(event, key, value, area) {
    this.notifyAllBut('settings-changed', {
      key: key,
      value: value,
      area: area
    }, event.sender);
  }

  __contextMenuHandler(event, params) {
    console.log(event, params);
  }
}

exports.ArcWindowsManager = ArcWindowsManager;
