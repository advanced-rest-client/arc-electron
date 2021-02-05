import fs from 'fs-extra';
import path from 'path';
import url from 'url';
import { BrowserWindow, ipcMain, app } from 'electron';
import { AppHostname, MainWindowPersist } from '../../common/Constants.js';
import { logger } from '../Logger.js';

/** @typedef {import('../WindowsManager').WindowsManager} WindowsManager */

/**
 * This class moves data from old ARC installation to new one.
 * 
 * In ARC < 16 the renderer process was running from the `file:` scheme and without a hostname.
 * ARC 16 >= 16 runs from the `web-module:` protocol and `advanced-rest-client` host name. The downside of this change 
 * is that the origin has changed and all data sha to be moved from the old origin to the new one.
 */
export class DataStore {

  /**
   * @param {WindowsManager} vm
   */
  constructor(vm) {
    this.vm = vm;
    this._noDataHandler = this._noDataHandler.bind(this);
    this._serverDataHandler = this._serverDataHandler.bind(this);
    this._reportedReady = this._reportedReady.bind(this);
    this._receiverReady = this._receiverReady.bind(this);
    this._errorHandler = this._errorHandler.bind(this);
    this.lockFile = path.join(process.env.ARC_HOME, '.db-moved-hostname.lock');
    this.migrationExport = path.join(app.getPath('temp'), '.migrate-data');
    ipcMain.on('server-db-no-data', this._noDataHandler);
    ipcMain.on('server-db-finished', this._serverDataHandler);
    ipcMain.on('data-transport-ready', this._reportedReady);
    ipcMain.on('data-importer-finished', this._receiverReady);
    ipcMain.on('db-error', this._errorHandler);
  }

  async ensureDataUpgraded() {
    const lockExists = await fs.pathExists(this.lockFile);
    if (lockExists) {
      return undefined;
    }
    await this.showDataUpgradeDialog();
    const serverWindow = this.getBrowserWindow();
    this.openServerWindow(serverWindow);
    this.server = serverWindow;
    
    return new Promise((resolve) => {
      this.resolve = resolve;
    });
  }

  async showDataUpgradeDialog() {
    return new Promise((resolve) => {
      const win = this.vm.createWindow({
        height: undefined,
        width: undefined,
        x: undefined,
        y: undefined,
      });
      win.setMenu(null);
      win.once('ready-to-show', () => {
        win.show();
      });
      win.once('show', () => resolve());
      this.vm.loadPage(win, 'data-migration.html');
      this.loader = win;
    });
  }

  async runImporterWindow() {
    return new Promise((resolve) => {
      const win = this.getBrowserWindow();
      this.openReceiverWindow(win);
      win.once('ready-to-show', () => {
        resolve();
      });
      this.receiver = win;
    });
  }

  /**
   * @param {BrowserWindow} bw
   */
  openServerWindow(bw) {
    const dest = path.join(__dirname, 'db-server.html');
    const full = url.format({
      pathname: dest,
      protocol: 'file:',
      slashes: true,
    });
    bw.loadURL(full);
    bw.webContents.openDevTools();
  }

  /**
   * @param {BrowserWindow} bw
   */
  openReceiverWindow(bw) {
    const full = url.format({
      hostname: AppHostname,
      pathname: `/io/defaults/db-receiver.html`,
      protocol: 'web-module:',
      slashes: true,
    });
    bw.loadURL(full);
    bw.webContents.openDevTools();
  }

  getBrowserWindow() {
    const options = /** @type Electron.BrowserWindowConstructorOptions */({
      show: false,
      frame: false,
      closable: false,
      webPreferences: {
        partition: MainWindowPersist,
        nodeIntegration: true,
        contextIsolation: false,
      },
    });
    return new BrowserWindow(options);
  }

  _reportedReady(e, type) {
    if (type === 'server') {
      setTimeout(() => {
        this.server.webContents.send('server-start', this.migrationExport);
      }, 1000);
    } else if (type === 'receiver') {
      setTimeout(() => {
        this.receiver.webContents.send('receiver-start', this.migrationExport);
      }, 1000);
    }
  }

  async _receiverReady() {
    this.afterFinish();
    this.receiver.close();
    this.receiver = undefined;
  }

  _noDataHandler() {
    this.afterFinish();
    this.server.close();
    this.server = undefined;
  }

  _errorHandler(e, message, stack) {
    logger.error(message);
    logger.error(stack);
    const info = {
      message, stack
    };
    const data = JSON.stringify(info);
    this.loader.webContents.executeJavaScript(`window.postMessage({error: ${data}})`);
  }

  async _serverDataHandler() {
    this.loader.webContents.executeJavaScript('window.postMessage({loadingStatus: "Migrating data stores."})');

    this.runImporterWindow();
    this.server.close();
    this.server = undefined;
  }

  async afterFinish() {
    ipcMain.removeAllListeners('server-db-no-data');
    ipcMain.removeAllListeners('server-db-finished');
    ipcMain.removeAllListeners('data-transport-ready');
    ipcMain.removeAllListeners('data-receiver-ready');
    ipcMain.removeAllListeners('db-error');

    await fs.writeFile(this.lockFile, 'Do not remove this file. Removing it may cause inconsistency in the data store.');
    const tmpExists = await fs.pathExists(this.migrationExport);
    if (tmpExists) {
      await fs.remove(this.migrationExport);
    }
    this.resolve();
  }
}
