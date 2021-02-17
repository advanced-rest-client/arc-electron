import { ApplicationPage } from '../ApplicationPage.js';
import { html } from '../../../web_modules/lit-html/lit-html.js';
import '../../../web_modules/@polymer/font-roboto-local/roboto.js';
import '../../../web_modules/@anypoint-web-components/anypoint-dropdown-menu/anypoint-dropdown-menu.js';
import '../../../web_modules/@anypoint-web-components/anypoint-listbox/anypoint-listbox.js';
import '../../../web_modules/@anypoint-web-components/anypoint-item/anypoint-item.js';
import '../../../web_modules/@anypoint-web-components/anypoint-item/anypoint-item-body.js';
import '../../../web_modules/@anypoint-web-components/anypoint-button/anypoint-button.js';

/** @typedef {import('lit-html').TemplateResult} TemplateResult */

/* global PreferencesProxy, ThemeManager, logger, ipc */


class AnalyticsConsent extends ApplicationPage {
  settings = new PreferencesProxy();

  themeProxy = new ThemeManager();

  constructor() {
    super();

    this.selected = 0;
  }

  async initialize() {
    await this.loadTheme();
    this.render();
  }

  /**
   * Loads the current theme.
   */
  async loadTheme() {
    try {
      await this.themeProxy.loadApplicationTheme();
    } catch (e) {
      logger.error(e);
    }
  }

  selectionHandler(e) {
    this.selected = e.target.selected;
  }

  async saveState() {
    const cnf = await this.settings.read();
    cnf.privacy = cnf.privacy || {};
    cnf.privacy.telemetry = false;
    if (this.selected === 1) {
      cnf.privacy.exceptionsOnly = true;
    } else {
      cnf.privacy.exceptionsOnly = false;
    }
    if (this.selected === 0) {
      cnf.privacy.telemetry = true;
    }
    await this.settings.update('privacy.telemetry', cnf.privacy.telemetry);
    await this.settings.update('privacy.exceptionsOnly', cnf.privacy.exceptionsOnly);
    ipc.send('telemetry-set');
  }

  appTemplate() {
    return html`
    ${this.headerTemplate()}
    <div class="content">
      <main>
        <h2>Welcome to Advanced REST Client!</h2>
        <p class="intro">Your privacy is important to us. You can limit or completely disable anonymous usage statistics for the application.</p>
        <p>The analytics data are processed for usage analysis which helps us make design and development decisions. <b>We do not share this data with anyone.</b></p>
        <p>You can read our privacy statement in the <a target="_blank" href="https://docs.google.com/document/d/1BzrKQ0NxFXuDIe2zMA-0SZBNU0P46MHr4GftZmoLUQU/edit">Privacy policy</a> document.</p>

        <div class="selector">
          <anypoint-dropdown-menu fitPositionTarget class="options">
            <label slot="label">Select anonymous data collection level</label>
            <anypoint-listbox slot="dropdown-content" selected="${this.selected}" @selected="${this.selectionHandler}">
              <anypoint-item> 
                <anypoint-item-body twoline=""> 
                  <div>Limited usage statistics</div> 
                  <div secondary="">Opened screen names, few actions triggered, exceptions.</div> 
                </anypoint-item-body> 
              </anypoint-item>
              <anypoint-item> 
                <anypoint-item-body twoline=""> 
                  <div>Exceptions only</div> 
                  <div secondary="">Only collected when an exception occurs. No user data is included.</div> 
                </anypoint-item-body> 
              </anypoint-item>
              <anypoint-item> 
                <anypoint-item-body twoline=""> 
                  <div>No consent</div> 
                  <div secondary="">It makes us sad but we respect your decision.</div> 
                </anypoint-item-body> 
              </anypoint-item>
            </anypoint-listbox>
          </anypoint-dropdown-menu>
          <p class="secondary-info">You can always change it later in the application settings.</p>
        </div>

        <div class="action-button">
          <anypoint-button emphasis="high" @click="${this.saveState}">Save and open the application</anypoint-button>
        </div>
      </main>
    </div>
    `;
  }

  /**
   * @returns {TemplateResult|string} The template for the header
   */
  headerTemplate() {
    return html`
    <header>
      API Client by MuleSoft.
    </header>`;
  }
}
const page = new AnalyticsConsent();
page.initialize();
