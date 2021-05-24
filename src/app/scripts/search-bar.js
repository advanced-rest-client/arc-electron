/* eslint-disable no-unused-vars */
import { ApplicationPage } from '../ApplicationPage.js';
import { html } from '../../../web_modules/lit-html/lit-html.js';
import '../../../web_modules/@anypoint-web-components/anypoint-button/anypoint-button.js';
import '../../../web_modules/@anypoint-web-components/anypoint-input/anypoint-input.js';
import '../../../web_modules/@anypoint-web-components/anypoint-button/anypoint-icon-button.js';
import '../../../web_modules/@advanced-rest-client/arc-icons/arc-icon.js';

/** @typedef {import('lit-html').TemplateResult} TemplateResult */
/* global ipc, ThemeManager */

const contentSearchInputHandler = Symbol('contentSearchInputHandler');
const searchBarSuffixTemplate = Symbol('searchBarSuffixTemplate');
const keydownHandler = Symbol('keydownHandler');
const searchResultHandler = Symbol('searchResultHandler');

export class SearchBar extends ApplicationPage {
  constructor() {
    super();

    this.initObservableProperties(
      'searchBarQuery', 'searchBarCount', 'searchBarOrdinal'
    );
    /** 
     * @type {number}
     */
    this.searchBarCount = undefined;
    /** 
     * @type {number}
     */
    this.searchBarOrdinal = undefined;
    /** 
     * @type {string}
     */
    this.searchBarQuery = undefined;

    this[searchResultHandler] = this[searchResultHandler].bind(this);
  }

  async initialize() {
    ipc.on('search-bar-found-in-page', this[searchResultHandler]);
    await this.loadTheme();
    this.render();
  }

  /**
   * Loads the current theme.
   */
  async loadTheme() {
    const themeProxy = new ThemeManager();
    try {
      await themeProxy.loadApplicationTheme();
    } catch (e) {
      // this.logger.error(e);
    }
  }

  [searchResultHandler](e, matches, activeMatchOrdinal) {
    this.searchBarCount = matches;
    this.searchBarOrdinal = activeMatchOrdinal;
  }

  [contentSearchInputHandler](e) {
    const input = /** @type HTMLInputElement */ (e.target);
    const { value } = input;
    this.searchBarQuery = value;
    if (value) {
      ipc.send('search-bar-command', 'find', value);
    } else {
      ipc.send('search-bar-command', 'clear');
    }
  }

  /**
   * @param {KeyboardEvent} e
   */
  [keydownHandler](e) {
    if (e.code === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      this.close();
    } else if (e.code === 'Enter') {
      this.findNext();
    }
  }

  findNext() {
    const { searchBarQuery } = this;
    if (!searchBarQuery) {
      return;
    }
    const opts = {
      findNext: true,
      forward: true
    };
    ipc.send('search-bar-command', 'find', searchBarQuery, opts);
  }

  findPrevious() {
    const { searchBarQuery } = this;
    if (!searchBarQuery) {
      return;
    }
    const opts = {
      findNext: true,
      forward: false
    };
    ipc.send('search-bar-command', 'find', searchBarQuery, opts);
  }

  close() {
    window.close();
  }

  appTemplate() {
    const { searchBarQuery } = this;
    return html`
    <anypoint-input
      nolabelfloat
      outlined
      @input="${this[contentSearchInputHandler]}"
      @keydown="${this[keydownHandler]}"
    >
      ${this[searchBarSuffixTemplate]()}
      <label slot="label">Search text</label>
    </anypoint-input>
    <div class="controls">
      <anypoint-icon-button
        title="Previous"
        aria-label="Activate to highlight previous result"
        @click="${this.findPrevious}"
        ?disabled="${!searchBarQuery}"
      >
        <arc-icon icon="keyboardArrowUp"></arc-icon>
      </anypoint-icon-button>
      <anypoint-icon-button
        title="Next"
        aria-label="Activate to highlight next result"
        @click="${this.findNext}"
        ?disabled="${!searchBarQuery}"
      >
        <arc-icon icon="keyboardArrowDown"></arc-icon>
      </anypoint-icon-button>
      <anypoint-icon-button
        title="Close"
        aria-label="Activate to close search"
        @click="${this.close}"
      >
        <arc-icon icon="close" class="close-icon"></arc-icon>
      </anypoint-icon-button>
    </div>
    `;
  }

  /**
   * @returns {TemplateResult|string} The template for search bar counters, when has search results
   */
  [searchBarSuffixTemplate]() {
    const { searchBarQuery, searchBarCount=0, searchBarOrdinal=0 } = this;
    if (!searchBarQuery) {
      return '';
    }
    return html`<div slot="suffix" class="counters">${searchBarOrdinal}/${searchBarCount}</div>`;
  }
}

const page = new SearchBar();
page.initialize();
