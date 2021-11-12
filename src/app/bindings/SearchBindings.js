import { PlatformBindings, EventTypes, Events } from '../../../web_modules/index.js';

export class SearchBindings extends PlatformBindings {
  async initialize() {
    window.addEventListener(EventTypes.Search.find, this.findHandler.bind(this));
    window.addEventListener(EventTypes.Search.clear, this.clearHandler.bind(this));
    ArcEnvironment.ipc.on('search-bar-found-in-page', this.searchResultHandler.bind(this));
  }

  /**
   * @param {CustomEvent} e
   */
  findHandler(e) {
    const { query, options } = e.detail;
    ArcEnvironment.ipc.send('search-bar-command', 'find', query, options);
  }

  clearHandler() {
    ArcEnvironment.ipc.send('search-bar-command', 'clear');
  }

  searchResultHandler(e, matches, activeMatchOrdinal) {
    Events.Search.State.foundInPage(document.body, matches, activeMatchOrdinal);
  }
}
