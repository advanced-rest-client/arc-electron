const {ArcPreferences} = require('./arc-preferences');
const path = require('path');
/**
 * A class responsible for managing window state.
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
  constructor(windowNumber) {
    super();
    this.id = windowNumber;
    this._file = path.join(this.userSettingsDir, 'sessions', windowNumber + '.json');
    // Session data
    this.data = undefined;

    this._defaultWidth = 1200;
    this._defaultHeight = 800;
  }
  /**
   * Restores information about window session.
   * If information is not available a default values are used.
   *
   * @return {Promise} Promise resolved to a data object. After calling this
   * method (and when it result) it's safe to access `this.data` directly.
   */
  restore() {
    return this.restoreFile(this._file)
    .then(data => this._processData(data))
    .catch(() => this._processData({}))
    .then(data => {
      this.data = data;
      return data;
    });
  }
  /**
   * Stores preferences for the window.
   *
   * @return {Promise} Promise resolved when preferences are stored.
   */
  store() {
    return this.storeFile(this._file, this.data);
  }
  /**
   * Updates width and height of the window.
   * This task is debounced so it's safe to call it more than once.
   *
   * @param {Number} width Width of the window.
   * @param {Number} height Heigth of the window.
   */
  updateSize(width, height) {
    this.data.size.width = width;
    this.data.size.height = height;
    this.debounce('size-update', function() {
      this.store();
    }, 200);
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
    this.data.position.x = x;
    this.data.position.y = y;
    this.debounce('position-update', function() {
      this.store();
    }, 200);
  }

  _processData(data) {
    var result = {
      size: this._readAppScreenSize(data),
      position: this._readAppScreenPosition(data)
    };
    return result;
  }

  _readAppScreenSize(data) {
    var result = {};
    if (data && data.size) {
      result.width = this._numberValue(data.size.width, this._defaultWidth);
      result.height = this._numberValue(data.size.height, this._defaultHeight);
    } else {
      result.width = this._defaultWidth;
      result.height = this._defaultHeight;
    }
    return result;
  }

  _readAppScreenPosition(data) {
    var result = {};
    if (data && data.position) {
      result.x = this._numberValue(data.position.x);
      result.y = this._numberValue(data.position.y);
    } else {
      result.x = undefined;
      result.y = undefined;
    }
    return result;
  }

  _numberValue(value, defaultValue) {
    if (!value && value !== 0) {
      return defaultValue;
    }
    value = Number(value);
    if (value !== value) {
      return defaultValue;
    }
    return value;
  }
}

exports.ArcSessionControl = ArcSessionControl;
