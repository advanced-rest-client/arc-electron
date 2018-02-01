const remote = require('electron').remote;

class WindowSearchHelper {
  constructor() {
    this.win = remote.getCurrentWindow();
    this._onPageFoundHandler = this._onPageFoundHandler.bind(this);
    this._searchHandler = this._searchHandler.bind(this);
    this._positionHandler = this._positionHandler.bind(this);
  }

  listen() {
    this.win.webContents.on('found-in-page', this._onPageFoundHandler);
    document.body.addEventListener('search-bar-input-changed', this._searchHandler);
    document.body.addEventListener('search-bar-search-position-changed',this._positionHandler);
  }

  search(word, opts) {
    if (!word) {
      return this.win.webContents.stopFindInPage('clearSelection');
    }
    this.win.webContents.findInPage(word, opts);
  }


  _onPageFoundHandler(event, detail) {
    var cnt = detail.matches;
    console.log('_onPageFoundHandler', detail);
    var ev = new CustomEvent('search-bar-search-mark-count', {
      bubbles: true,
      detail: {
        count: cnt
      }
    });
    document.body.dispatchEvent(ev);
  }

  _searchHandler(e) {
    e.stopPropagation();
    e.stopImmediatePropagation();
    console.log('_searchHandler', e.detail.value);
    this._lastPosition = 0;
    this._lastSearch = e.detail.value;
    var opts = {};
    this.search(e.detail.value, opts);
  }

  _positionHandler(e) {
    e.stopPropagation();
    e.stopImmediatePropagation();
    var newPos = e.detail.position;
    var opts = {
      findNext: true
    };
    if (newPos === this._lastPosition - 1) {
      opts.forward = false;
    } else {
      opts.forward = true;
    }
    this.search(this._lastSearch, opts);
  }
}
exports.WindowSearchHelper = WindowSearchHelper;
