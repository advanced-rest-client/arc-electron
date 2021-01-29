import path from 'path';
import { screen } from 'electron';
import { ArcPreferences } from '../common/ArcPreferences.js';

/** @typedef {import('../types').ApplicationConfig} ApplicationConfig */
/** @typedef {import('../types').WindowsSessionSchema} WindowsSessionSchema */
/** @typedef {import('../types').WindowSession} WindowSession */
/** @typedef {import('electron').BrowserWindow} BrowserWindow */
/** @typedef {import('electron').Display} Display */

export const storeTimeout = Symbol('storeTimeout');

/**
 * This class stores opened windows position and size so it can be restored the next time the window is opened.
 * It is used by the WindowManager.
 */
export class WindowsPersistance extends ArcPreferences {
  constructor() {
    super(path.join(process.env.ARC_HOME, 'workspace', 'windows.json'));

    /**
     * Store data debounce timer.
     * By default it's 500 ms.
     * @type {number}
     */
    this.storeDebounce = 500;
  }

  /**
   * @param {WindowsSessionSchema} data
   * @param {number} id
   * @returns {WindowSession|null}
   */
  findWindow(data, id) {
    if (!data) {
      return null;
    }
    const { windows=[] } = data;
    if (!Array.isArray(windows)) {
      return null;
    }
    const result = windows.find((item) => item.id === id);
    if (!result) {
      return null;
    }
    return result;
  }

  /**
   * Restores previous stores window position or creates default values
   * @param {number} id
   * @return {Promise<WindowSession>}
   */
  async restoreWindowState(id) {
    const data = await this.load();
    const info = this.findWindow(data, id);
    if (!info) {
      return this.defaultWindowSession();
    }
    return this.readSafeWindowPosition(info);
  }

  /**
   * Callback to be called when a window has moved
   * @param {BrowserWindow} win
   */
  moveHandler(win) {
    const [x, y] = win.getPosition();
    this.setWindowPosition(win.id, x, y);
    if (this[storeTimeout]) {
      clearTimeout(this[storeTimeout]);
    }
    this[storeTimeout] = setTimeout(() => this.store(), this.storeDebounce);
  }

  /**
   * Updates window position info
   * @param {number} id
   * @param {number} x
   * @param {number} y
   */
  setWindowPosition(id, x, y) {
    const settings = /** @type WindowsSessionSchema */ (this.data);
    if (!Array.isArray(settings.windows)) {
      settings.windows = [];
    }
    const info = this.findWindow(settings, id);
    if (!info) {
      settings.windows.push({
        x, y, id,
      });
    } else {
      info.x = x;
      info.y = y;
    }
  }

  /**
   * Callback to be called when a window has been resized
   * @param {BrowserWindow} win
   */
  resizeHandler(win) {
    const [width, height] = win.getSize();
    this.setWindowSize(win.id, width, height);
    if (this[storeTimeout]) {
      clearTimeout(this[storeTimeout]);
    }
    this[storeTimeout] = setTimeout(() => this.store(), this.storeDebounce);
  }

  /**
   * Updates window size info
   * @param {number} id
   * @param {number} width
   * @param {number} height
   */
  setWindowSize(id, width, height) {
    const settings = /** @type WindowsSessionSchema */ (this.data);
    if (!Array.isArray(settings.windows)) {
      settings.windows = [];
    }
    const info = this.findWindow(settings, id);
    if (!info) {
      settings.windows.push({
        width, height, id,
      });
    } else {
      info.width = width;
      info.height = height;
    }
  }

  async defaultSettings() {
    return {
      windows: [],
    };
  }

  /**
   * @returns {WindowSession}
   */
  defaultWindowSession() {
    return {
      width: 1200,
      height: 800,
    };
  }

  /**
   * Checks whether the window position is still visible and returns
   * default position when not.
   * This may happen when a screen is removed from the device.
   * 
   * @TODO(pawel): When connecting a sound bar through an HDMI cable it is recognized as 
   * a "display". It looks like there's no way to tell a difference between this device 
   * and the actual display.
   * 
   * @param {WindowSession} state
   * @returns {WindowSession} state
   */
  readSafeWindowPosition(state) {
    const { x=0, y=0 } = state;
    const displays = screen.getAllDisplays();
    const fit = displays.some((display) => this.pointInDisplay(display, x, y));
    if (!fit) {
      return this.defaultWindowSession();
    }
    return state;
  }

  /**
   * Checks whether the point is inside a display
   * @param {Display} display
   * @param {number} x
   * @param {number} y
   * @returns {boolean}
   */
  pointInDisplay(display, x, y) {
    const { x:dx, y:dy, width, height } = display.bounds;
    if (x < dx || x > dx + width) {
      return false;
    }
    if (y < dy || y > dy + height) {
      return false;
    }
    return true;
  }
}
