import { ipcMain } from 'electron';

export const findHandler = Symbol('findHandler');
export const clearHandler = Symbol('clearHandler');
export const foundInPageHandler = Symbol('foundInPageHandler');

/**
 * A service that performs a content search in the WebContents using Chrome APIs.
 */
export class ContentSearchService {
  constructor() {
    /** 
     * The map of find in page request IDs and the corresponding windows.
     * 
     * @type {{[key: number]: Electron.WebContents}}
     */
    this.requests = {};
    /** 
     * The list of WebContents being currently processed by this content search service.
     * @type {Electron.WebContents[]}
     */
    this.contents = [];
  }

  listen() {
    ipcMain.on('search-bar-find', this[findHandler].bind(this));
    ipcMain.on('search-bar-clear', this[clearHandler].bind(this));
  }

  /**
   * @param {any} e
   * @param {string} query
   * @param {Electron.FindInPageOptions=} opts
   */
  [findHandler](e, query, opts) {
    const contents = /** @type Electron.WebContents */ (e.sender);
    if (!this.contents.includes(contents)) {
      this.contents.push(contents);
      contents.on('found-in-page', this[foundInPageHandler].bind(this));
    }

    const request = contents.findInPage(query, opts);
    this.requests[request] = contents;
  }

  /**
   * @param {any} e
   */
  [clearHandler](e) {
    const contents = /** @type Electron.WebContents */ (e.sender);
    if (!this.contents.includes(contents)) {
      return;
    }
    const index = this.contents.findIndex((item) => item === contents);
    this.contents[index].stopFindInPage('clearSelection');
    this.contents[index].removeAllListeners('found-in-page');
    this.contents.splice(index, 1);
  }

  /**
   * @param {Electron.Event} event
   * @param {Electron.Result} detail
   */
  [foundInPageHandler](event, detail) {
    const { requestId, matches, activeMatchOrdinal } = detail;
    const contents = this.requests[requestId];
    if (!contents) {
      return;
    }
    delete this.requests[requestId];
    contents.send('search-bar-found-in-page', matches, activeMatchOrdinal);
  }
}
