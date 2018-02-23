const {BrowserWindow, dialog, ipcMain} = require('electron');
const path = require('path');
const url = require('url');
const {ArcSessionControl} = require('./session-control');
const {ArcSessionRecorder} = require('./arc-session-recorder');
const {ArcPreferences} = require('./arc-preferences');
/**
 * A class that manages opened app windows.
 */
class ArcWindowsManager {
  constructor(startupOptions) {
    this.startupOptions = startupOptions || {};
    this.windows = [];
    // Task manager window reference.
    this._tmWin = undefined;
    this.__windowClosed = this.__windowClosed.bind(this);
    this.__windowMoved = this.__windowMoved.bind(this);
    this.__windowResized = this.__windowResized.bind(this);
    this.__windowOpenedPopup = this.__windowOpenedPopup.bind(this);
    this._settingChangedHandler = this._settingChangedHandler.bind(this);
    this._prefs = new ArcPreferences(startupOptions.settingsFile);
    this.recorder = new ArcSessionRecorder();
  }
  // True if has at leas one window.
  get hasWindow() {
    return this.windows.length > 0;
  }

  listen() {
    ipcMain.on('window-reloading', this.__windowReloading.bind(this));
    ipcMain.on('new-window', this._windowOpenHandler.bind(this));
    ipcMain.on('toggle-devtools', this._toggleDevToolsHandler.bind(this));
    ipcMain.on('reload-app-required', this._reloadRequiredHandler.bind(this));
    ipcMain.on('settings-changed', this._settingChangedHandler);
  }

  _windowOpenHandler() {
    this.open();
  }

  _toggleDevToolsHandler(event) {
    event.sender.webContents.toggleDevTools();
  }

  _reloadRequiredHandler(event, message) {
    message = message || 'To complete this action reload the application.';
    const win = BrowserWindow.fromWebContents(event.sender);
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

  open(path) {
    var index = this.windows.length;
    var session = new ArcSessionControl(index);

    return session.restore()
    .then(data => {
      var win = this.__getNewWindow(index, data);
      win.__arcSession = session;
      this.__loadPage(win, path);
      // win.webContents.openDevTools();
      this.__attachListeners(win);
      this.windows.push(win);
      return this.recorder.record()
      .then(() => win);
    });
  }

  openTaskManager() {
    if (this._tmWin) {
      if (this._tmWin.isMinimized()) {
        this._tmWin.restore();
      }
      return this._tmWin.focus();
    }
    var win = new BrowserWindow({
      backgroundColor: '#00A2DF',
      webPreferences: {
        partition: 'persist:arc-task-manager'
      }
    });
    var dest = path.join(__dirname, '..', '..', 'task-manager.html');
    var full = url.format({
      pathname: dest,
      protocol: 'file:',
      slashes: true
    });
    win.loadURL(full);
    win.on('closed', () => {
      this._tmWin = null;
    });
    this._tmWin = win;
  }

  __getNewWindow(index, session) {
    var mainWindow = new BrowserWindow({
      width: session.size.width,
      height: session.size.height,
      x: session.position.x,
      y: session.position.y,
      backgroundColor: '#00A2DF',
      show: false,
      webPreferences: {
        partition: 'persist:arc-window',
        nativeWindowOpen: true
      }
    });
    mainWindow.__arcIndex = index;
    return mainWindow;
  }

  __loadPage(win, appPath) {
    appPath = appPath || '#/request/latest/0';
    if (appPath[0] === '/') {
      appPath = '#' + appPath;
    }
    var dest = path.join(__dirname, '..', '..', 'app.html');
    var full = url.format({
      pathname: dest,
      protocol: 'file:',
      slashes: true
    }) + appPath;
    win.loadURL(full);
  }

  __attachListeners(win) {
    win.addListener('closed', this.__windowClosed);
    win.addListener('move', this.__windowMoved);
    win.addListener('resize', this.__windowResized);
    win.once('ready-to-show', this.__readyShowHandler.bind(this));
    win.webContents.on('new-window', this.__windowOpenedPopup);
  }

  _findWindowImdex(win) {
    if (win.isDestroyed()) {
      return -1;
    }
    return this.windows.findIndex(item => {
      if (item.isDestroyed()) {
        return win === win;
      }
      return item.id === win.id;
    });
  }

  __windowClosed(e) {
    var index = this._findWindowImdex(e.sender);
    if (index === -1) {
      return;
    }
    this.windows.splice(index, 1);
  }

  __windowMoved(e) {
    var win = e.sender;
    var pos = win.getPosition();
    win.__arcSession.updatePosition(pos[0], pos[1]);
  }

  __windowResized(e) {
    var win = e.sender;
    var size = win.getSize();
    win.__arcSession.updateSize(size[0], size[1]);
  }

  __readyShowHandler(e) {
    e.sender.show();
    this._setupWindow(e.sender);
  }
  /**
   * Adds the `did-finish-load` event to reset the window when it's reloaded.
   */
  __windowReloading(e) {
    e.sender.webContents.once('did-finish-load', () => {
      this._setupWindow(e.sender);
    });
  }
  /**
   * Informs the window that it is ready to render the application.
   */
  _setupWindow(win) {
    if (this.startupOptions.workspaceFile) {
      win.send('set-workspace-file', this.startupOptions.workspaceFile);
    }
    if (this.startupOptions.settingsFile) {
      win.send('set-settings-file', this.startupOptions.settingsFile);
    }
    win.send('window-rendered');
  }

  __windowOpenedPopup(event, url, frameName, disposition, options) {
    if (frameName !== 'modal') {
      return;
    }
    event.preventDefault();
    Object.assign(options, {
      modal: true,
      parent: event.sender,
      width: 100,
      height: 100
    });
    event.newGuest = new BrowserWindow(options);
  }

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
   */
  _settingChangedHandler(event, key, value, area) {
    this.notifyAllBut('settings-changed', {
      key: key, 
      value: value, 
      area: area
    }, event.sender);
  }
}

exports.ArcWindowsManager = ArcWindowsManager;
