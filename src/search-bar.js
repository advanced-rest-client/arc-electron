class SearchBarInit {
  constructor() {
    this._searchCoundHandler = this._searchCoundHandler.bind(this);
    this._focusHandler = this._focusHandler.bind(this);

    this.close = this.close.bind(this);
    this.query = this.query.bind(this);
    this.highlightNext = this.highlightNext.bind(this);
    this.highlightPrevious = this.highlightPrevious.bind(this);
  }
  /**
   * Returns the `<dom-bind>` template element.
   *
   * @return {HTMLElement} Instance of the `dom-bind` template.
   */
  get bar() {
    return document.getElementById('bar');
  }
  /**
   * Listens for the main script events.
   */
  listen() {
    /* global ipc */
    ipc.on('search-count', this._searchCoundHandler);
    ipc.on('focus-input', this._focusHandler);
  }
  /**
   * Removes listeners for the main script events.
   */
  unlisten() {
    ipc.removeListener('search-count', this._searchCoundHandler);
    ipc.removeListener('focus-input', this._focusHandler);
  }
  /**
   * Initializes search bar `<dom-bind>` properties and loads components.
   */
  initBar() {
    const bar = this.bar;
    bar.close = this.close;
    bar.query = this.query;
    bar.highlightNext = this.highlightNext;
    bar.highlightPrevious = this.highlightPrevious;
    bar.selected = 0;
    bar.searchCount = 0;
  }
  /**
   * Loads bar components.
   *
   * @return {Promise}
   */
  loadBar() {
    /* global ArcPreferencesProxy, ThemeManager */
    const prefProxy = new ArcPreferencesProxy();
    return prefProxy.load()
    .then((cnf) => {
      const mgr = new ThemeManager();
      return mgr.loadTheme(cnf.theme)
      // Theme is not a fatal error
      .catch(() => {});
    });
  }
  /**
   * Closes the search bar.
   */
  close() {
    ipc.send('search-bar-close');
  }
  /**
   * Sends the `search-bar-query` event to the main script
   * so the window search handler can perform search operation.
   */
  query() {
    const bar = this.bar;
    const value = bar.value;
    bar.hasValue = !!value;
    ipc.send('search-bar-query', value);
  }
  /**
   * Sends the `search-bar-query-next` event to the main script
   * so the window search handler can mark next search result.
   */
  highlightNext() {
    ipc.send('search-bar-query-next');
  }
  /**
   * Sends the `search-bar-query-previous` event to the main script
   * so the window search handler can mark previous search result.
   */
  highlightPrevious() {
    ipc.send('search-bar-query-previous');
  }
  /**
   * Handler for the `search-count` event from the main page.
   * Sets `searchCount` and `selected` properties on the search bar
   * template instance.
   *
   * @param {Event} event Event instance.
   * @param {Number} count Search results count
   * @param {Number} selected Currently selected instance.
   */
  _searchCoundHandler(event, count, selected) {
    const bar = this.bar;
    bar.searchCount = count;
    bar.selected = selected;
  }
  /**
   * Focuses on the text input.
   */
  _focusHandler() {
    const i = document.querySelector('paper-input');
    if (!i) {
      return;
    }
    i.inputElement.focus();
  }
}
const initScript = new SearchBarInit();
initScript.initBar();
initScript.loadBar();
initScript.listen();
