import { LitElement, html, css } from '../../web_modules/lit-element/lit-element.js';
import { keyboardArrowUp, keyboardArrowDown, close } from
  '../../web_modules/@advanced-rest-client/arc-icons/ArcIcons.js';
import '../../web_modules/@polymer/font-roboto-local/roboto.js';
import '../../web_modules/@anypoint-web-components/anypoint-button/anypoint-icon-button.js';
import '../../web_modules/@anypoint-web-components/anypoint-input/anypoint-input.js';

class SearchBar extends LitElement {
  static get styles() {
    return css`
    .container {
      display: flex;
      flex-direction: row;
      align-items: center;
      background-color: var(--search-bar-background-color, #fff);
      margin: 8px;
    }

    .container .counters {
      color: var(--search-bar-counters-color, #9E9E9E);
      font-size: 14px;
    }

    .controls {
      display: flex;
      flex-direction: row;
      align-items: center;
      margin-left: 8px;
      padding-left: 8px;
    }

    anypoint-icon-button {
      color: var(--search-bar-action-button-color, #616161);
      width: 36px;
      height: 36px;
    }

    anypoint-input {
      flex: 1;
      width: auto;
      margin: 0;
    }

    .icon {
      width: 24px;
      height: 24px;
      display: inline-block;
      fill: currentColor;
    }
    `;
  }

  static get properties() {
    return {
      value: { type: String },
      selected: { type: Number },
      searchCount: { type: Number },
    };
  }

  /**
   * @constructor
   */
  constructor() {
    super();
    this._searchCoundHandler = this._searchCoundHandler.bind(this);
    this._focusHandler = this._focusHandler.bind(this);
    this._keydownHandler = this._keydownHandler.bind(this);

    this.selected = 0;
    this.searchCount = 0;
  }

  get hasValue() {
    return !!this.value;
  }

  connectedCallback() {
    super.connectedCallback();
    this.loadBar();
    this.listen();
  }

  /**
   * Listens for the main script events.
   */
  listen() {
    /* global ipc */
    ipc.on('search-count', this._searchCoundHandler);
    ipc.on('focus-input', this._focusHandler);
    this.addEventListener('keydown', this._keydownHandler);
  }
  /**
   * Removes listeners for the main script events.
   */
  disconnectedCallback() {
    super.disconnectedCallback();
    ipc.removeListener('search-count', this._searchCoundHandler);
    ipc.removeListener('focus-input', this._focusHandler);
    this.removeEventListener('keydown', this._keydownHandler);
  }
  /**
   * Loads bar components.
   *
   * @return {Promise}
   */
  async loadBar() {
    /* global ArcPreferencesProxy, ThemeManager */
    const prefProxy = new ArcPreferencesProxy();
    const cnf = await prefProxy.load();
    const mgr = new ThemeManager();
    await mgr.loadTheme(cnf.theme);
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
    const { value } = this;
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
    this.searchCount = count;
    this.selected = selected;
  }
  /**
   * Focuses on the text input.
   */
  _focusHandler() {
    const i = this.shadowRoot.querySelector('anypoint-input');
    if (!i) {
      return;
    }
    i.inputElement.focus();
  }

  _inputHandler(e) {
    this.value = e.target.value;
    this.query();
  }

  _keydownHandler(e) {
    if (e.key === 'Escape') {
      this.close();
    } else if (e.key === 'Enter') {
      this.highlightNext();
    }
  }

  render() {
    return html`
    <div class="container">
      ${this._inputTemplate()}
      <div class="controls">
        ${this._controlsTemplate()}
      </div>
    </div>`;
  }

  _inputTemplate() {
    const {
      value,
      compatibility
    } = this;
    return html`
    <anypoint-input
      nolabelfloat
      .value="${value}"
      @input="${this._inputHandler}"
      autofocus
      ?compatibility="${compatibility}"
    >
      ${this._suffixTemplate()}
      <label slot="label">Search text</label>
    </anypoint-input>
    `;
  }

  _suffixTemplate() {
    if (!this.hasValue) {
      return '';
    }
    const {
      selected,
      searchCount
    } = this;
    return html`<div slot="suffix" class="counters">${selected}/${searchCount}</div>`;
  }

  _controlsTemplate() {
    const { hasValue, compatibility } = this;
    return html`
    <anypoint-icon-button
      title="Previous"
      aria-label="Activate to highlight previous result"
      @click="${this.highlightPrevious}"
      ?disabled="${!hasValue}"
      ?compatibility="${compatibility}"
    >
      <span class="icon">${keyboardArrowUp}</span>
    </anypoint-icon-button>
    <anypoint-icon-button
      title="Next"
      aria-label="Activate to highlight next result"
      @click="${this.highlightNext}"
      ?disabled="${!hasValue}"
      ?compatibility="${compatibility}"
    >
      <span class="icon">${keyboardArrowDown}</span>
    </anypoint-icon-button>
    <anypoint-icon-button
      title="Close"
      aria-label="Activate to close search"
      @click="${this.close}"
      ?compatibility="${compatibility}"
    >
      <span class="icon">${close}</span>
    </anypoint-icon-button>
    `;
  }
}
window.customElements.define('search-bar', SearchBar);
