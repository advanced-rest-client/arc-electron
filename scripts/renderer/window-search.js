const remote = require('electron').remote;
const ipcRenderer = require('electron').ipcRenderer;
/**
 * Class responsible to control search action in a window.
 */
class WindowSearchHelper {
  /**
   * @constructor
   */
  constructor() {
    this.win = remote.getCurrentWindow();
    this._onPageFoundHandler = this._onPageFoundHandler.bind(this);
    this._searchHandler = this._searchHandler.bind(this);
    this._searchNextHandler = this._searchNextHandler.bind(this);
    this._searchPreviousHandler = this._searchPreviousHandler.bind(this);
  }
  /**
   * Listens for events from the main script.
   *
   * @return {undefined}
   */
  listen() {
    this.win.webContents.on('found-in-page', this._onPageFoundHandler);
    ipcRenderer.on('search-bar-query-changed', this._searchHandler);
    ipcRenderer.on('search-bar-query-next', this._searchNextHandler);
    ipcRenderer.on('search-bar-query-previous', this._searchPreviousHandler);
  }
  /**
   * Performs the search action on the opened window.
   * @param {String} word Search term.
   * @param {Object} opts Options passed to the `webContents.findInPage()`
   * function.
   */
  search(word, opts) {
    if (!word) {
      this.win.webContents.stopFindInPage('clearSelection');
      return;
    }
    this.win.webContents.findInPage(word, opts);
  }

  /**
   * Handler for the `found-in-page` event dispatched from the
   * web contents of current window.
   * The method signals number of matches found and index of current
   * highlight.
   *
   * @param {Event} event Event dispatched by the web contents
   * @param {Object} detail Event details.
   */
  _onPageFoundHandler(event, detail) {
    ipcRenderer.send('search-bar-search-result',
      detail.matches, detail.activeMatchOrdinal);
  }
  /**
   * Handler for the search event.
   * @param {Event} e Event from the main page.
   * @param {String} query A search term to use with browser search.
   */
  _searchHandler(e, query) {
    if (this._lastSearch === query) {
      this._searchNextHandler();
      return;
    }
    this._lastSearch = query;
    let opts = {};
    this.search(query, opts);
  }
  /**
   * Event handler for search next.
   */
  _searchNextHandler() {
    let opts = {
      findNext: true,
      forward: true
    };
    this.search(this._lastSearch, opts);
  }
  /**
   * Event handler for search previous.
   */
  _searchPreviousHandler() {
    let opts = {
      findNext: true,
      forward: false
    };
    this.search(this._lastSearch, opts);
  }
}
exports.WindowSearchHelper = WindowSearchHelper;
