/* eslint-disable no-unused-vars */
import { ApplicationPage } from '../ApplicationPage.js';
import { html } from '../../../web_modules/lit-html/lit-html.js';
import '../../../web_modules/@anypoint-web-components/anypoint-button/anypoint-button.js';
import '../../../web_modules/@anypoint-web-components/anypoint-input/anypoint-input.js';
import '../../../web_modules/@anypoint-web-components/anypoint-button/anypoint-icon-button.js';
import '../../../web_modules/@advanced-rest-client/arc-icons/arc-icon.js';

/** @typedef {import('lit-html').TemplateResult} TemplateResult */

const contentSearchInputHandler = Symbol('contentSearchInputHandler');
const searchBarSuffixTemplate = Symbol('searchBarSuffixTemplate');

export class SearchBar extends ApplicationPage {
  constructor() {
    super();

    this.initObservableProperties(
      'compatibility', 'searchBarQuery', 'searchBarCount', 'searchBarOrdinal'
    );

    this.compatibility = false;
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
  }

  initialize() {
  }

  [contentSearchInputHandler](e) {
    const input = /** @type HTMLInputElement */ (e.target);
    this.searchBarQuery = input.value;
    window.parent.postMessage({
      action: 'search-bar-query',
      query: input.value,
    }, '*');
  }

  appTemplate() {
    const { compatibility, searchBarQuery } = this;
    return html`
    <anypoint-input
      nolabelfloat
      outlined
      @input="${this[contentSearchInputHandler]}"
      ?compatibility="${compatibility}"
    >
      ${this[searchBarSuffixTemplate]()}
      <label slot="label">Search text</label>
    </anypoint-input>
    <div class="controls">
      <anypoint-icon-button
        title="Previous"
        aria-label="Activate to highlight previous result"
        @click="${this.highlightPrevious}"
        ?disabled="${!searchBarQuery}"
        ?compatibility="${compatibility}"
      >
        <arc-icon icon="keyboardArrowUp"></arc-icon>
      </anypoint-icon-button>
      <anypoint-icon-button
        title="Next"
        aria-label="Activate to highlight next result"
        @click="${this.highlightNext}"
        ?disabled="${!searchBarQuery}"
        ?compatibility="${compatibility}"
      >
        <arc-icon icon="keyboardArrowDown"></arc-icon>
      </anypoint-icon-button>
      <anypoint-icon-button
        title="Close"
        aria-label="Activate to close search"
        @click="${this.close}"
        ?compatibility="${compatibility}"
      >
        <arc-icon icon="close"></arc-icon>
      </anypoint-icon-button>
    </div>
    `;
  }

  /**
   * @returns {TemplateResult|string} The template for search bar counters, when has search results
   */
  [searchBarSuffixTemplate]() {
    const { searchBarQuery, searchBarCount, searchBarOrdinal } = this;
    if (!searchBarQuery) {
      return '';
    }
    return html`<div slot="suffix" class="counters">${searchBarOrdinal}/${searchBarCount}</div>`;
  }
}

const page = new SearchBar();
page.initialize();
