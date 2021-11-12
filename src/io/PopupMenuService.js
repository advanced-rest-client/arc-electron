import { ipcMain } from 'electron';
import { logger } from './Logger.js';
import { ExternalResourcesManager } from './ExternalResourcesManager.js';

/** @typedef {import('./WindowsManager').WindowsManager} WindowsManager */

export const popupAppMenuHandler = Symbol('popupAppMenuHandler');
export const windowClosedHandler = Symbol('windowClosedHandler');
export const popupNavHandler = Symbol('popupNavHandler');
export const addListeners = Symbol('addListeners');
export const removeListeners = Symbol('removeListeners');
export const createWindow = Symbol('createWindow');
export const loadPage = Symbol('loadPage');

/**
 * Application menu by default is embedded in main application window.
 * User has an option to pop up menu to a new window. This class handles
 * events from the renderer process to make it possible.
 */
export class PopupMenuService {
  /**
   * @param {WindowsManager} wm
   */
  constructor(wm) {
    this.wm = wm;
    this.menuWindows = new Map();

    this[popupAppMenuHandler] = this[popupAppMenuHandler].bind(this);
    this[windowClosedHandler] = this[windowClosedHandler].bind(this);
    this[popupNavHandler] = this[popupNavHandler].bind(this);
  }

  listen() {
    logger.debug('Listening for menu popup events');
    ipcMain.on('popup-app-menu', this[popupAppMenuHandler]);
    ipcMain.on('popup-app-menu-nav', this[popupNavHandler]);
  }

  /**
   * Handler for `popup-app-menu` event dispatched by ARC windows.
   * @param {Event} e
   * @param {string} type Menu type
   * @param {object=} sizing `width` and `height`
   */
  [popupAppMenuHandler](e, type, sizing) {
    logger.debug('Handling menu popup event from app window.');
    if (this.menuWindows.has(type)) {
      logger.debug('Showing existing window.');
      const menu = this.menuWindows.get(type);
      menu.show();
      return;
    }
    this.createMenuWindow(type, sizing);
  }
  
  /**
   * Creates menu window object.
   * If the `type` already exists then nothing happens.
   * @param {string} type Menu type
   * @param {object=} sizing `width` and `height`
   */
  async createMenuWindow(type, sizing={}) {
    if (this.menuWindows.has(type)) {
      return;
    }
    logger.debug(`Creating menu popup window for type: ${type}`);
    const width = sizing.width ? sizing.width : 320;
    const height = sizing.height ? sizing.height : 800;
    const win = await this.wm.open({
      sizing: {
        width,
        height,
      },
      params: {
        type
      },
      // noMenu: true,
      page: 'popup-menu.html',
      preload: 'arc-preload.js',
    });
    this[addListeners](win);
    this.menuWindows.set(type, win);
    this.wm.notifyAll('popup-app-menu-opened', type);
  }

  /**
   * @param {Electron.BrowserWindow} bw 
   */
  [addListeners](bw) {
    bw.addListener('closed', this[windowClosedHandler]);
  }

   /**
   * @param {Electron.BrowserWindow} bw 
   */
  [removeListeners](bw) {
    bw.removeListener('closed', this[windowClosedHandler]);
  }

  /**
   * Handler for the BrowserWindow `closed` event.
   *
   * @param {Electron.Event} e Event emitted by the window.
   */
  [windowClosedHandler](e) {
    // @ts-ignore
    const win = /** @type BrowserWindow */ (e.sender);
    const entires = this.menuWindows.entries();
    let type;
    for (const [key, value] of entires) { 
      if (value === win) {
        type = key;
        break;
      }
    }
    if (!type) {
      return;
    }
    this[removeListeners](win);
    this.menuWindows.delete(type);
    this.wm.notifyAll('popup-app-menu-closed', type);
  }

  /**
   * Handler for an event dispatched by popup menu when navigation action was
   * performed.
   * @param {Event} e
   * @param {string} type Navigation type
   * @param {...string} detail Arguments
   */
  [popupNavHandler](e, type, ...detail) {
    logger.debug('Handling popup menu event from the menu.');
    if (type === 'help') {
      const manager = new ExternalResourcesManager();
      manager.openNavigationHelpTopic(detail[0]);
      return;
    }
    if (!this.wm.hasWindow) {
      logger.warn('Popup menu event handled without menu window registered.');
      return;
    }
    const win = this.wm.lastArcFocused;
    if (!win) {
      logger.warn('Unable to perform navigation. No active window found.');
      return;
    }
    logger.debug('Sending navigate event to the renderer process.');
    win.webContents.send('app-navigate', type, detail);
  }

  /**
   * Removes all generated menu windows.
   */
  clear() {
    logger.debug('Removing all menu popup windows.');
    for (const win of this.menuWindows.values()) {
      win.destroy();
    }
  }
  
  /**
   * Toggles entire menu window.
   */
  togglePopupMenu() {
    logger.debug('Toggling menu popup window.');
    const win = this.menuWindows.get('*');
    if (win) {
      win.destroy();
    } else {
      this.clear();
      this.createMenuWindow('*');
    }
  }
}
