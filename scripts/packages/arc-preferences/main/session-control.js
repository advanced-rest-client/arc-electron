const {ArcPreferences} = require('../lib/preferences');
/**
 * A class responsible for managing browser window state.
 *
 * Stored object format:
 *
 * ```
 * {
 *   "size": { // latest used window size
 *      "width": Number // width of the window
 *      "height": Number // height of the window
 *   },
 *   "position": {
 *      "x": Number,
 *      "y": Number
 *   }
 * }
 * ```
 */
class ArcSessionControl extends ArcPreferences {
  /**
   * @constructor
   * @param {?Number} windowNumber ID of the window opened for this session.
   * Default to `0`.
   */
  constructor(windowNumber) {
    if (!windowNumber) {
      windowNumber = 0;
    }
    super({
      filePath: 'sessions',
      appendFilePath: true,
      fileName: windowNumber + '.json'
    });
    this.id = windowNumber;
    this._defaultWidth = 1200;
    this._defaultHeight = 800;
    /**
     * Store data debounce timer.
     * By default it's 500 ms.
     * @type {Number}
     */
    this.storeDebounce = 500;
    /**
     * A reference to a BrowserWindow object that is being tracked.
     * @type {BrowserWindow}
     */
    this.window = undefined;
    this._movedHandler = this._movedHandler.bind(this);
    this._resizedHandler = this._resizedHandler.bind(this);
  }
  /**
   * Starts tracking a window for move and resize events to call corresponding
   * save functions.
   * Note, when the window is distroyed call `untrackWindow` or it will cause
   * a memory leak.
   * @param {BrowserWindow} win
   */
  trackWindow(win) {
    this.untrackWindow();
    this.window = win;
    win.addListener('move', this._movedHandler);
    win.addListener('resize', this._resizedHandler);
  }
  /**
   * Untracks events from currently tracked window.
   */
  untrackWindow() {
    if (!this.window) {
      return;
    }
    this.window.removeListener('move', this._movedHandler);
    this.window.removeListener('resize', this._resizedHandler);
    this.window = undefined;
  }

  /**
   * Stores current settings with a debouncer.
   */
  _storeDebounce() {
    if (this.__storingDebouncer) {
      return;
    }
    this.__storingDebouncer = true;
    setTimeout(() => {
      this.__storingDebouncer = false;
      this.store();
    }, this.storeDebounce);
  }

  /**
   * Updates width and height of the window.
   * This task is debounced so it's safe to call it more than once in a short
   * period of time.
   *
   * @param {Number} width Width of the window.
   * @param {Number} height Heigth of the window.
   */
  updateSize(width, height) {
    if (!this.__settings) {
      this.__settings = {};
    }
    if (!this.__settings.size) {
      this.__settings.size = {};
    }
    this.__settings.size.width = width;
    this.__settings.size.height = height;
    this._storeDebounce();
  }
  /**
   * Updates `x` and `y` position of the window.
   *
   * This task is debounced so it's safe to call it more than once.
   *
   * @param {Number} x The x position of the window on screen.
   * @param {Number} y The y position of the window on screen.
   */
  updatePosition(x, y) {
    if (!this.__settings) {
      this.__settings = {};
    }
    if (!this.__settings.position) {
      this.__settings.position = {};
    }
    this.__settings.position.x = x;
    this.__settings.position.y = y;
    this._storeDebounce();
  }
  /**
   * Overrides parent class `_processSettings` to ensure that values
   * are correct.
   * @param {Object} data Restored data
   * @return {Promise}
   */
  _processSettings(data) {
    const result = {
      size: this._readAppScreenSize(data),
      position: this._readAppScreenPosition(data)
    };
    return Promise.resolve(result);
  }
  /**
   * Reads application screen size from restored data. Setsa defaults
   * if any property is missing.
   *
   * @param {Object} data Restored data
   * @return {Object} Data to use
   */
  _readAppScreenSize(data) {
    const result = {};
    if (data && data.size) {
      result.width = this._numberValue(data.size.width, this._defaultWidth);
      result.height = this._numberValue(data.size.height, this._defaultHeight);
    } else {
      result.width = this._defaultWidth;
      result.height = this._defaultHeight;
    }
    return result;
  }
  /**
   * Reads application screen position from restored data. Setsa defaults
   * if any property is missing.
   *
   * @param {Object} data Restored data
   * @return {Object} Data to use
   */
  _readAppScreenPosition(data) {
    let result = {};
    if (data && data.position) {
      result.x = this._numberValue(data.position.x);
      result.y = this._numberValue(data.position.y);
    } else {
      result.x = undefined;
      result.y = undefined;
    }
    return result;
  }
  /**
   * Creates a numeric value from read option.
   * @param {String|Number} value Read value.
   * @param {Number} defaultValue The value if missing.
   * @return {Number} Numeric value.
   */
  _numberValue(value, defaultValue) {
    if (!value && value !== 0) {
      return defaultValue;
    }
    value = Number(value);
    if (value !== value) {
      return defaultValue;
    }
    if (value < 0) {
      return 0;
    }
    return value;
  }
  /**
   * Handler for the BrowserWindow `move` event.
   * Stores session value for window position.
   *
   * @param {Event} e Event emitted by the window.
   */
  _movedHandler(e) {
    const win = e.sender;
    const pos = win.getPosition();
    this.updatePosition(pos[0], pos[1]);
  }
  /**
   * Handler for the BrowserWindow `resize` event.
   * Stores session value for window position.
   *
   * @param {Event} e Event emitted by the window.
   */
  _resizedHandler(e) {
    const win = e.sender;
    const size = win.getSize();
    this.updateSize(size[0], size[1]);
  }
}
exports.ArcSessionControl = ArcSessionControl;
