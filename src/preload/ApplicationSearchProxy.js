/* eslint-disable no-unused-vars */
import { ipcRenderer } from 'electron';

export const search = Symbol('search');
export const resultHandler = Symbol('resultHandler');
export const messageHandler = Symbol('messageHandler');

/**
 * A proxy for the corresponding class defined in the `io` namespace.
 * Informs about search action.
 */
export class ApplicationSearchProxy {
  constructor() {
    /** 
     * The last query used with `search()`.
     */
    this.lastQuery = undefined;
  }

  listen() {
    ipcRenderer.on('search-bar-found-in-page', this[resultHandler].bind(this));
    window.addEventListener('message', this[messageHandler].bind(this));
  }

  /**
   * Depending on the situation, either performs a new search or moves to another position
   * @param {string|null} query The query to search for
   */
  search(query) {
    if (this.lastQuery === query) {
      this.searchNext();
      return;
    }
    this.lastQuery = query;
    const opts = {};
    this[search](query, opts);
  }

  searchNext() {
    const opts = {
      findNext: true,
      forward: true,
    };
    this[search](this.lastQuery, opts);
  }

  searchPrevious() {
    const opts = {
      findNext: true,
      forward: false,
    };
    this[search](this.lastQuery, opts);
  }

  /**
   * @param {string|null} query The query or null to stop the search
   * @param {Electron.FindInPageOptions=} opts Search options
   */
  [search](query, opts) {
    if (!query) {
      ipcRenderer.send('search-bar-clear');
      return;
    }
    ipcRenderer.send('search-bar-find', query, opts);
  }

  [resultHandler](e, matches, activeMatchOrdinal) {
    // console.log('Search result', e, matches, activeMatchOrdinal);
  }

  /**
   * @param {MessageEvent} e
   */
  [messageHandler](e) {
    const { data } = e;
    switch (data.action) {
      case 'search-bar-query': this.search(data.query); break;
      default:
    }
  }
}
