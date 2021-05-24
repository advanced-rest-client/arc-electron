import { html, css, LitElement } from '../../../../web_modules/lit-element/lit-element.js';
import { AnypointDialogMixin } from '../../../../web_modules/@anypoint-web-components/anypoint-dialog/index.js';
import AnypointDialogStyles from '../../../../web_modules/@anypoint-web-components/anypoint-dialog/src/AnypointDialogInternalStyles.js';
import '../../../../web_modules/@anypoint-web-components/anypoint-button/anypoint-button.js';

export const closedHandler = Symbol('closedHandler');

export class ArcAlertDialogElement extends AnypointDialogMixin(LitElement) {
  static get styles() {
    return [
      AnypointDialogStyles,
      css`
      :host {
        background-color: #F44336;
      }

      :host > h2,
      :host > * {
        color: #fff !important;
      }

      .message {
        font-family: monospace;
      }

      anypoint-button {
        color: #fff;
      }
      `,
    ];
  }

  static get properties() {
    return {
      message: { type: String },
    };
  }

  constructor() {
    super();
    this.message = undefined;
    this.compatibility = false;
    this[closedHandler] = this[closedHandler].bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('overlay-closed', this[closedHandler]);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('overlay-closed', this[closedHandler]);
  }

  [closedHandler]() {
    this.parentNode.removeChild(this);
  }

  render() {
    return html`
    <h2>An error ocurred</h2>
    <p class="message">${this.message}</p>
    <div class="buttons">
      <anypoint-button data-dialog-confirm ?compatibility="${this.compatibility}">Dismiss</anypoint-button>
    </div>
    `;
  }
}
