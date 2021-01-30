/* eslint-disable no-unused-vars */
import { ApplicationPage } from '../ApplicationPage.js';
import { html } from '../../../web_modules/lit-html/lit-html.js';

export class DataMigrationDialog extends ApplicationPage {
  constructor() {
    super();

    this.initObservableProperties(
      'loadingStatus', 'error', 'stack'
    );

    this.loadingStatus = 'Checking the requirements...';
    this.error = false;
    this.stack = '';
  }

  initialize() {
    /** 
     * @param {MessageEvent} e
     */
    window.onmessage = (e) => {
      const { data } = e;
      console.log('DATA', data);
      if (data.loadingStatus) {
        this.loadingStatus = data.loadingStatus;
      } else if (data.error) {
        const info = typeof data.error === 'string' ? JSON.parse(data.error) : data.error;
        this.error = true;
        this.loadingStatus = info.message;
        this.stack = info.stack;
      }
    };
  }

  appTemplate() {
    const { error } = this;
    return error ? this.errorMessageTemplate() : this.loadingMessageTemplate();
  }

  loadingMessageTemplate() {
    const { loadingStatus } = this;
    return html`
    <div class="app-loader">
      <img src="../../assets/icon.iconset/icon_256x256.png" alt="ARC logo" width="256" height="256"/>
      <p class="message">Preparing something spectacular!</p>
      <p class="sub-message">${loadingStatus}</p>
    </div>
    `;
  }

  errorMessageTemplate() {
    const { loadingStatus, stack } = this;
    return html`
    <div class="app-loader error">
      <img src="../../assets/icon.iconset/icon_256x256.png" alt="ARC logo" width="256" height="256"/>
      <p class="message">Unthinkable happened!</p>
      <p class="help-message">Please, report an issue on the application GitHub page or contact us at <span class="selectable">arc@mulesoft.com</span> for assistance.</p>
      <p class="error-message">${loadingStatus}</p>
      <p class="error-stack">${stack}</p>
    </div>
    `;
  }
}

const page = new DataMigrationDialog();
page.initialize();
