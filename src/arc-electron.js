import {PolymerElement} from '../../web_modules/@polymer/polymer/polymer-element.js';
import {html} from '../../web_modules/@polymer/polymer/lib/utils/html-tag.js';
import {ArcAppMixin} from '../web_modules/@advanced-rest-client/arc-app-mixin/arc-app-mixin.js';
import {afterNextRender} from '../web_modules/@polymer/polymer/lib/utils/render-status.js';
import {Jexl} from '../web_modules/jexl/lib/Jexl.js';
import '../web_modules/@polymer/polymer/lib/elements/custom-style.js';
import '../web_modules/@polymer/paper-icon-button/paper-icon-button.js';
import '../web_modules/@advanced-rest-client/arc-icons/arc-icons.js';
import '../web_modules/@advanced-rest-client/arc-menu/arc-menu.js';
import '../web_modules/@polymer/paper-icon-button/paper-icon-button.js';
import '../web_modules/@polymer/paper-item/paper-icon-item.js';
import '../web_modules/@polymer/iron-icon/iron-icon.js';
import '../web_modules/@polymer/iron-flex-layout/iron-flex-layout.js';
import '../web_modules/@polymer/iron-pages/iron-pages.js';
import '../web_modules/@polymer/app-route/app-location.js';
import '../web_modules/@polymer/app-route/app-route.js';
import '../web_modules/@polymer/app-layout/app-drawer-layout/app-drawer-layout.js';
import '../web_modules/@polymer/app-layout/app-drawer/app-drawer.js';
import '../web_modules/@polymer/app-layout/app-header-layout/app-header-layout.js';
import '../web_modules/@polymer/app-layout/app-header/app-header.js';
import '../web_modules/@polymer/app-layout/app-toolbar/app-toolbar.js';
import '../web_modules/@advanced-rest-client/arc-models/project-model.js';
import '../web_modules/@advanced-rest-client/arc-models/rest-api-model.js';
import '../web_modules/@advanced-rest-client/arc-models/host-rules-model.js';
import '../web_modules/@advanced-rest-client/arc-models/request-model.js';
import '../web_modules/@advanced-rest-client/arc-models/auth-data-model.js';
import '../web_modules/@advanced-rest-client/arc-models/url-history-model.js';
import '../web_modules/@advanced-rest-client/arc-models/websocket-url-history-model.js';
import '../web_modules/@advanced-rest-client/arc-models/variables-model.js';
import '../web_modules/@advanced-rest-client/arc-models/url-indexer.js';
import '../web_modules/@advanced-rest-client/response-history-saver/response-history-saver.js';
import '../web_modules/@advanced-rest-client/arc-data-export/arc-data-export.js';
import '../web_modules/@advanced-rest-client/arc-data-import/arc-data-import.js';
import '../web_modules/@polymer/paper-toast/paper-toast.js';
import '../web_modules/@advanced-rest-client/authorization-data-saver/authorization-data-saver.js';
import '../web_modules/@advanced-rest-client/variables-manager/variables-manager.js';
import '../web_modules/@advanced-rest-client/variables-evaluator/variables-evaluator.js';
import '../web_modules/@advanced-rest-client/arc-definitions/arc-definitions.js';
import '../web_modules/@advanced-rest-client/app-analytics/app-analytics.js';
import '../web_modules/@advanced-rest-client/app-analytics/app-analytics-custom.js';
import '../web_modules/@advanced-rest-client/arc-messages-service/arc-messages-service.js';
import '../web_modules/@advanced-rest-client/arc-info-messages/arc-info-messages.js';
import '../web_modules/@polymer/paper-styles/typography.js';
import '../web_modules/@polymer/paper-styles/color.js';
import '../web_modules/@polymer/paper-button/paper-button.js';
import '../web_modules/@polymer/paper-toggle-button/paper-toggle-button.js';
import '../web_modules/@advanced-rest-client/uuid-generator/uuid-generator.js';
import '../web_modules/@polymer/paper-item/paper-item.js';
import '../web_modules/@polymer/paper-item/paper-item-body.js';
import '../web_modules/@polymer/paper-tabs/paper-tabs.js';
import '../web_modules/@polymer/paper-tabs/paper-tab.js';
import '../web_modules/@advanced-rest-client/request-hooks-logic/request-hooks-logic.js';
import '../web_modules/@advanced-rest-client/arc-request-logic/arc-request-logic.js';
import '../web_modules/@advanced-rest-client/oauth-authorization/oauth1-authorization.js';
import '../web_modules/@advanced-rest-client/environment-selector/environment-selector.js';
import '../web_modules/@advanced-rest-client/arc-request-workspace/arc-request-workspace.js';
import '../web_modules/@polymer/iron-media-query/iron-media-query.js';
import '../web_modules/@advanced-rest-client/saved-request-editor/saved-request-editor.js';
import '../web_modules/@advanced-rest-client/saved-request-detail/saved-request-detail.js';
import '../web_modules/@advanced-rest-client/bottom-sheet/bottom-sheet.js';
import '../web_modules/@advanced-rest-client/http-code-snippets/http-code-snippets.js';
import '../web_modules/@advanced-rest-client/arc-electron-experiment-settings/arc-electron-experiment-settings.js';
import '../web_modules/@api-components/api-candidates-dialog/api-candidates-dialog.js';
import '../web_modules/@advanced-rest-client/arc-onboarding/arc-onboarding.js';
import './electron-http-transport/electron-http-transport.js';
window.Jexl = Jexl;
/* eslint-disable max-len */
/**
 * Main component for ARC electron app.
 *
 * @appliesMixin ArcAppMixin
 */
class ArcElectron extends ArcAppMixin(PolymerElement) {
  static get template() {
    return html`<style>
    :host {
      display: block;
      -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
      @apply --layout-fit;
      --app-drawer-width: 320px;
    }

    [hidden] {
      display: none !important;
    }

    .mainPages {
      padding: 0px 24px;
      box-sizing: border-box;
    }

    .mainPages,
    .mainPages > * {
      background-color: var(--primary-background-color, #fff);
    }

    .mainPages {
      min-height: 100%;
    }

    .mainPages > * {
      min-height: calc(100vh - 64px);
      box-sizing: border-box;
      padding: 4px;
    }

    .mainPages,
    app-header {
      border-left: 1px var(--arc-layout-divider-color, #BDBDBD) solid;
    }

    app-header {
      /* To ensure that dialogs and overlay are rendered properly. */
      /* z-index: 0; */
      /* Above doesn't work as any overlay placed in the toolbar won't be visible */
    }

    google-drive-browser {
      height: calc(100vh - 64px);
    }

    apic-electron {
      padding-top: 24px;
    }

    app-toolbar {
      background-color: var(--arc-toolbar-background-color);
      color: var(--arc-toolbar-color);
    }

    .env-container {
      @apply --layout-horizontal;
      @apply --layout-center;
      @apply --arc-font-body1;
      color: var(--arc-env-container-color);
    }

    environment-selector {
      margin-left: 8px;
      max-width: 120px;
      --paper-input-container-input-color: var(--arc-toolbar-environment-selector-input-color);
    }

    .api-version-selector {
      --paper-input-container-input-color: var(--arc-toolbar-api-version-selector-color);
      --paper-input-container-color: var(--arc-toolbar-api-version-selector-label-color);
    }

    .var-panel {
      max-width: calc(100vw - var(--app-drawer-width, 0) - 32px);
      max-height: calc(100vh - 64px - 32px);
      background-color: var(--arc-toolbar-variables-panel-background, #fff);
      color: var(--arc-toolbar-variables-panel-color);
    }

    arc-info-messages {
      min-width: 320px;
      position: relative;
      background-color: white;
      padding: 0 12px;
      box-sizing: border-box;
    }

    arc-menu {
      color: var(--arc-menu-color);
      width: 320px;
      background-color: var(--arc-menu-background-color, #fff);
      --paper-item-body-secondary-color: var(--arc-menu-paper-item-body-secondary-color);
      --paper-item: {
        border-left: none;
        border-right: none;
        padding: 0 15px;
      }
    }

    .api-navigation {
      width: 320px;
      height: 100%;
      color: var(--arc-menu-color);
      background-color: var(--arc-menu-background-color, #fff);
      --paper-tab-content-unselected_-_color: var(--arc-menu-tabs-color-unselected);
    }

    api-navigation,
    .api-navigation-loader {
      height: calc(100vh - 72px);
      background-color: var(--arc-menu-background-color, inherit);
      --paper-tab-content-unselected_-_color: var(--arc-menu-tabs-color-unselected);
    }

    .api-navigation-loader {
      @apply --layout-vertical;
      @apply --layout-center;
    }

    .powered-by {
      padding: 12px 0px;
      border-top: 1px rgba(0,0,0,0.24) solid;
      margin: 8px 12px 0 12px;
    }

    a img {
      text-underline: none;
    }

    a.attribution {
      display: inline-block;
      width: 177px;
      margin-left: 24px;
      fill: var(--arc-menu-color);
    }

    .nav-action-button {
      background-color: var(--arc-toolbar-action-button-background-color, #fff);
    }

    paper-icon-button[active] {
      color: var(--arc-toolbar-paper-icon-button-active-color, var(--accent-color));
    }

    .nav-notification-button {
      @apply --navigation-notification-button;
    }

    .nav-notification-button:hover {
      @apply --navigation-notification-button-hover;
    }

    .nav-notification-button[active] {
      @apply --navigation-notification-button-active;
    }

    .toolbar-button {
      background-color: var(--arc-toolbar-button-background-color, #fff);
      color: var(--arc-toolbar-button-color, inherit);
    }

    app-drawer-layout:not([narrow]) [drawer-toggle] {
      display: none;
    }

    app-drawer {
      z-index: 0;
    }

    :host([narrow-layout]) app-drawer {
      z-index: 1;
    }

    .info-center-drawer {
      --app-drawer-width: 640px;
      z-index: 1;
      text-align: left;
    }
    </style>
    <!-- Database support -->
    <auth-data-model></auth-data-model>
    <project-model></project-model>
    <rest-api-model></rest-api-model>
    <host-rules-model></host-rules-model>
    <url-history-model></url-history-model>
    <request-model id="requestModel"></request-model>
    <authorization-data-saver></authorization-data-saver>
    <websocket-url-history-model></websocket-url-history-model>
    <variables-model></variables-model>
    <url-indexer></url-indexer>
    <!-- Data import / export -->
    <arc-data-export app-version="[[appVersion]]" electron-cookies></arc-data-export>
    <arc-data-import></arc-data-import>
    <!-- Request logic -->
    <oauth1-authorization></oauth1-authorization>
    <arc-request-logic variables-disabled="[[_computeVariablesDisabled(config.systemVariablesEnabled, config.appVariablesEnabled)]]" jexl-path="Jexl"></arc-request-logic>
    <request-hooks-logic></request-hooks-logic>
    <template is="dom-if" if="[[historyEnabled]]" restamp="true">
      <response-history-saver></response-history-saver>
    </template>
    <electron-http-transport follow-redirects$=[[config.followRedirects]] request-timeout$="[[config.requestDefaultTimeout]]" native-transport$="[[config.nativeTransport]]" validate-certificates$="[[config.validateCertificates]]" sent-message-limit$="[[config.sentMessageLimit]]"></electron-http-transport>
    <variables-manager system-variables="[[sysVars]]" sys-variables-disabled="[[_computeVarDisabled(config.systemVariablesEnabled)]]" app-variables-disabled="[[_computeVarDisabled(config.appVariablesEnabled)]]"></variables-manager>
    <variables-evaluator no-before-request jexl-path="Jexl"></variables-evaluator>
    <!-- Info center -->
    <arc-messages-service platform="electron" on-unread-changed="_unreadMessagesChanged" messages="{{appMessages}}" id="msgService"></arc-messages-service>
    <!-- Application views -->
    <app-drawer-layout fullbleed narrow="{{narrowLayout}}" force-narrow="[[appMenuDisabled]]" responsive-width="980px">
      <app-drawer slot="drawer" align="start">
        <template is="dom-if" if="[[isApiConsole]]">
          <div class="api-navigation">
            <api-navigation aware="apic" summary endpoints-opened hidden$="[[apiProcessing]]" selected="[[apiSelected]]" selected-type="[[apiSelectedType]]"></api-navigation>
            <template is="dom-if" if="[[apiProcessing]]">
              <div class="api-navigation-loader">
                <p>Loading the API</p>
              </div>
            </template>
            <div class="powered-by">
              <a href="https://github.com/mulesoft/api-console" class="attribution" target="_blank">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 818.9 148">
                  <defs><style>.cls-1{}.cls-2{font-size:60px;font-family:OpenSans, Open Sans;}</style></defs><path class="cls-1" d="M436.08,12.57a61.79,61.79,0,1,0,62.08,61.79A62,62,0,0,0,436.08,12.57Zm0,118.8a56.63,56.63,0,1,1,56.63-56.63A56.63,56.63,0,0,1,436.09,131.36Z"/><path class="cls-1" d="M420.34,102.08a28.4,28.4,0,0,1-15.87-25.84,29.25,29.25,0,0,1,4.89-16.29l20.42,30.43h12.34l20.42-30.43a29.25,29.25,0,0,1,4.89,16.29,28.55,28.55,0,0,1-14,24.87l3.93,15.06a46.47,46.47,0,0,0,2.45-81.29L436.08,71.47,412.6,34.75A46.47,46.47,0,0,0,416.45,117Z"/><polygon class="cls-1" points="544.97 80.8 529.71 48.31 521.79 48.31 521.79 100.53 529.71 100.53 529.71 65.62 542.03 91.08 547.9 91.08 559.93 65.62 559.93 100.53 567.85 100.53 567.85 48.31 559.93 48.31 544.97 80.8"/><path class="cls-1" d="M597.61,86c0,5.73-3.53,8.29-7.7,8.29s-7.48-2.5-7.48-8.29V63.34h-7.48V87.11c0,4.19.88,7.71,3.74,10.5a12.93,12.93,0,0,0,9.17,3.37,13.28,13.28,0,0,0,9.9-4.18v3.74h7.34V63.34h-7.48Z"/><path class="cls-1" d="M619.75,89.83V48.31h-7.48v42c0,5.51,3.08,10.27,10.2,10.27h4.62V94.16h-3.3C620.77,94.16,619.75,92.68,619.75,89.83Z"/><path class="cls-1" d="M645.07,62.91c-9.54,0-15.77,7-15.77,19,0,14.16,7.41,19.07,16.73,19.07,6.53,0,10.12-2,13.93-5.79L655.2,90.7a11.08,11.08,0,0,1-9,3.81c-6.09,0-9.46-4-9.46-10.41h24.13V80.8C660.85,70.24,655.05,62.91,645.07,62.91Zm-8.36,16a11.79,11.79,0,0,1,1-5.06,7.77,7.77,0,0,1,7.41-4.69,7.66,7.66,0,0,1,7.34,4.69,11.62,11.62,0,0,1,1,5.06Z"/><path class="cls-1" d="M697.78,74.93c-2.2-2-4.91-3.15-9.76-3.89l-5.94-.88a11.67,11.67,0,0,1-5.87-2.42,6.24,6.24,0,0,1-2-4.84c0-4.62,3.37-8.15,9.54-8.15,4.4,0,8.14,1,11.37,4l5.06-5c-4.47-4.18-9.31-5.94-16.21-5.94-10.86,0-17.46,6.23-17.46,15.33,0,4.25,1.25,7.55,3.82,10,2.27,2.12,5.64,3.59,9.9,4.18l6.16.89c3.09.44,4.4,1,5.73,2.2a7,7,0,0,1,2.05,5.43c0,5.06-4,8-10.78,8-5.36,0-9.54-1.17-13.35-5l-5.28,5.21c5,5.06,10.64,6.9,18.48,6.9C694.18,101,702,95.25,702,85.65,702,81.16,700.63,77.43,697.78,74.93Z"/><path class="cls-1" d="M721.76,62.91a14.88,14.88,0,0,0-11.08,4.4c-3.52,3.66-4.4,8.36-4.4,14.6s.88,11,4.4,14.67a14.88,14.88,0,0,0,11.08,4.4,15,15,0,0,0,11.15-4.4c3.52-3.66,4.4-8.36,4.4-14.67s-.88-10.94-4.4-14.6A15,15,0,0,0,721.76,62.91Zm5.5,29.19a7.65,7.65,0,0,1-5.5,2.2,7.44,7.44,0,0,1-5.42-2.2c-2.28-2.27-2.57-6.17-2.57-10.2s.29-7.92,2.57-10.2a7.39,7.39,0,0,1,5.42-2.13,7.6,7.6,0,0,1,5.5,2.13c2.27,2.27,2.57,6.16,2.57,10.2S729.54,89.83,727.27,92.1Z"/><path class="cls-1" d="M744.88,58.29V64h-4.26v5.73h4.26v30.81h7.48V69.73h7.41V64h-7.41V58.65c0-2.71,1.31-4.33,4.1-4.33h3.31V47.94h-4.7C748.1,47.94,744.88,52.93,744.88,58.29Z"/><path class="cls-1" d="M776.12,52.71h-7.48V64h-4.26v5.73h4.26V90.19c0,5.36,3.22,10.35,10.19,10.35h4.47V94.16h-3.08c-2.78,0-4.11-1.62-4.11-4.33V69.73h7.19V64h-7.19Z"/><path class="cls-1" d="M792.58,58.48a4,4,0,0,0-2.14-2.11,4.11,4.11,0,0,0-3.11,0,4.07,4.07,0,0,0-1.29.84,4,4,0,0,0-.87,1.26,3.86,3.86,0,0,0-.32,1.58,3.94,3.94,0,0,0,.32,1.6,4,4,0,0,0,.87,1.28,4,4,0,0,0,1.29.84,4.19,4.19,0,0,0,3.11,0,3.92,3.92,0,0,0,1.28-.84,4.1,4.1,0,0,0,.87-1.28,4,4,0,0,0,.32-1.6A3.86,3.86,0,0,0,792.58,58.48Zm-.66,2.94a3.34,3.34,0,0,1-.7,1.09,3.25,3.25,0,0,1-1,.72,3.19,3.19,0,0,1-1.3.26,3.24,3.24,0,0,1-2.36-1,3.35,3.35,0,0,1-.7-1.09,3.64,3.64,0,0,1-.25-1.37,3.54,3.54,0,0,1,.25-1.34,3.26,3.26,0,0,1,3.06-2.06,3.21,3.21,0,0,1,1.3.26,3.26,3.26,0,0,1,1.74,1.8,3.52,3.52,0,0,1,.25,1.34A3.62,3.62,0,0,1,791.92,61.42Z"/><path class="cls-1" d="M790.42,60a1.14,1.14,0,0,0,.35-.93,1.23,1.23,0,0,0-.4-1,1.92,1.92,0,0,0-1.24-.33h-1.81v4.68H788v-2h.77l1.28,2h.78l-1.34-2.07A1.59,1.59,0,0,0,790.42,60Zm-1.61-.19H788V58.32h1l.37,0a1,1,0,0,1,.33.1.63.63,0,0,1,.24.21A.68.68,0,0,1,790,59a.79.79,0,0,1-.1.43.61.61,0,0,1-.27.23,1.19,1.19,0,0,1-.39.09Z"/><text class="cls-2" transform="translate(19 91.93)">Powered by</text></svg>
              </a>
            </div>
          </div>
        </template>
        <template is="dom-if" if="[[!isApiConsole]]">
          <arc-menu
            rest-api
            draggable-enabled="[[config.draggableEnabled]]"
            allow-popup="[[popupMenuExperimentEnabled]]"
            list-type="[[config.viewListType]]"
            history-enabled="[[historyEnabled]]"
            hide-history="[[menuConfig.hideHistory]]"
            hide-saved="[[menuConfig.hideSaved]]"
            hide-projects="[[menuConfig.hideProjects]]"
            hide-apis="[[menuConfig.hideApis]]"
            on-popup-menu="_popupMenuHandler"></arc-menu>
        </template>
      </app-drawer>
      <app-drawer slot="drawer" align="end" opened="{{messageCenterOpened}}" class="info-center-drawer">
        <arc-info-messages messages="[[appMessages]]" on-close="closeInfoCenter"></arc-info-messages>
      </app-drawer>
      <app-header-layout has-scrolling-region id="scrollingRegion">
        <app-header slot="header" fixed shadow scroll-target="scrollingRegion">
          <app-toolbar>
            <paper-icon-button icon="arc:menu" drawer-toggle title="Toggle application menu"  hidden$="[[appMenuDisabled]]"></paper-icon-button>
            <template is="dom-if" if="[[renderBackButton]]">
              <paper-icon-button icon="arc:arrow-back" on-click="_backHandler" title="Go back to main screen"></paper-icon-button>
            </template>
            <div main-title></div>
            <template is="dom-if" if="[[newMessages]]">
              <paper-icon-button class="nav-notification-button" icon="arc:info-outline" on-click="openInfoCenter" toggles active="[[messageCenterOpened]]" title="See what's new in the app"></paper-icon-button>
            </template>
            <template is="dom-if" if="[[hasAppUpdate]]">
              <paper-icon-button icon="arc:file-download" class="nav-notification-button" on-click="updateInstall" title="Restart and install update"></paper-icon-button>
            </template>
            <!-- API console related toolbar options -->
            <template is="dom-if" if="[[isApiConsole]]">
              <template is="dom-if" if="[[!apiIsSaved]]">
                <template is="dom-if" if="[[canSaveApi]]">
                  <paper-button class="toolbar-button" raised on-click="_saveApi">Save API</paper-button>
                </template>
              </template>
              <template is="dom-if" if="[[apiIsSaved]]">
                <template is="dom-if" if="[[apiMultiVersionVersion]]">
                  <paper-dropdown-menu label="API version" class="api-version-selector">
                    <paper-listbox id="apiVersionSelector" slot="dropdown-content" selected="[[apiVersion]]" attr-for-selected="data-version" on-selected-changed="_apiVersionMenuChanged">
                      <template is="dom-repeat" items="[[apiVersions]]">
                        <paper-item data-version$="[[item]]">[[item]]</paper-item>
                      </template>
                    </paper-listbox>
                  </paper-dropdown-menu>
                </template>

                <template is="dom-if" if="[[!apiVersionSaved]]">
                  <template is="dom-if" if="[[canSaveApi]]">
                    <paper-button class="toolbar-button" raised on-click="_saveApi">Save API version</paper-button>
                  </template>
                </template>

                <paper-menu-button vertical-align="top" horizontal-align="auto">
                  <paper-icon-button icon="arc:more-vert" slot="dropdown-trigger"></paper-icon-button>
                  <paper-listbox slot="dropdown-content" on-selected-changed="_apiActionMenuChanged">
                    <paper-item data-action="delete">Delete API</paper-item>
                    <template is="dom-if" if="[[apiMultiVersionVersion]]">
                      <paper-item data-action="delete-version">Delete version</paper-item>
                    </template>
                    <!-- <paper-item data-action="save-oas">Save as OAS</paper-item>
                    <paper-item data-action="save-raml">Save as RAML</paper-item> -->
                    <!-- <paper-item data-action="upload-exchange">Upload to Exchange</paper-item> -->
                  </paper-listbox>
                </paper-menu-button>
              </template>
            </template>
            <!-- Environment toolbar controls -->
            <template is="dom-if" if="[[!isApiConsole]]">
              <div class="env-container">
                <span class="env-label">Environment:</span>
                <environment-selector no-label-float></environment-selector>
                <paper-icon-button
                  class="var-info-button"
                  id="varToggleButton"
                  icon="arc:info-outline"
                  title="Open variables list"
                  active="{{_variablesOverlayOpened}}"
                  toggles></paper-icon-button>
                <variables-preview-overlay
                  class="var-panel"
                  position-target="[[_variablesButton]]"
                  dynamic-align
                  horizontal-align="auto"
                  vertical-align="auto"
                  vertical-offset="44"
                  on-open-variables-editor="_variablesOpenRequest"
                  on-iron-overlay-closed="_variablesPreviewClosed"
                  opened="[[_variablesOverlayOpened]]"
                  masked-values></variables-preview-overlay>
              </div>
            </template>
          </app-toolbar>
        </app-header>

        <iron-pages class="mainPages" attr-for-selected="data-route" selected-attribute="opened" selected="[[page]]">
          <arc-request-workspace
            data-route="request"
            id="workspace"
            draggable-enabled="[[config.draggableEnabled]]"
            oauth2-redirect-uri="[[_oauth2redirectUri]]"
            ignore-content-on-get="[[config.ignoreContentOnGet]]"
            narrow="[[narrow]]"
            on-open-web-url="_openWebUrlHandler"></arc-request-workspace>
          <websocket-panel data-route="socket"></websocket-panel>
          <history-panel data-route="history" list-type="[[config.viewListType]]"></history-panel>
          <saved-requests-panel data-route="saved" list-type="[[config.viewListType]]"></saved-requests-panel>
          <import-panel
            data-route="data-import"
            access-token="[[driveAccessToken]]"></import-panel>
          <export-panel data-route="data-export"></export-panel>
          <arc-settings-panel data-route="settings">
            <arc-electron-experiment-settings popup-menu-experiment-enabled="{{popupMenuExperimentEnabled}}" data-title="Experiments"></arc-electron-experiment-settings>
          </arc-settings-panel>
          <about-arc-electron data-route="about" app-version="[[appVersion]]"></about-arc-electron>
          <project-details data-route="project" id="projectDetails"></project-details>
          <google-drive-browser
            data-route="drive"
            access-token="[[driveAccessToken]]"
            on-drive-file-picker-data="_openDriveRequest"></google-drive-browser>
          <cookie-manager data-route="cookie-manager"></cookie-manager>
          <apic-electron
            data-route="api-console"
            data-page="docs"
            aware="apic"
            id="apic"
            selected="[[apiSelected]]"
            selected-type="[[apiSelectedType]]"
            handle-navigation-events
            inline-methods
            narrow="[[narrow]]"
            redirect-uri="[[_oauth2redirectUri]]"
            scroll-target="[[_scrollTarget]]"
            saved="{{apiIsSaved}}"
            versions="{{apiVersions}}"
            api-version="{{apiVersion}}"
            can-save="{{canSaveApi}}"
            version-saved="{{apiVersionSaved}}"
            multi-version="{{apiMultiVersionVersion}}"
            api-processing="{{apiProcessing}}"></apic-electron>
          <rest-apis-list-panel data-route="rest-projects" render-explore></rest-apis-list-panel>
          <exchange-search-panel
            data-route="exchange-search"
            scroll-target="[[_scrollTarget]]"
            anypoint-auth
            columns="auto"
            exchange-redirect-uri="https://auth.advancedrestclient.com/oauth-popup.html"
            exchange-client-id="59KaqF90hLgZMJec"
            force-oauth-events></exchange-search-panel>
          <host-rules-editor data-route="hosts-rules"></host-rules-editor>
          <themes-panel data-route="themes-panel" add-enabled></themes-panel>
        </iron-pages>
      </app-header-layout>
    </app-drawer-layout>
    <iron-media-query query="(max-width: 700px)" query-matches="{{narrow}}"></iron-media-query>
    <!-- Components loded lazily -->
    <variables-drawer-editor id="environmentsDrawer" with-backdrop></variables-drawer-editor>
    <!-- Google Analytics -->
    <template is="dom-if" if="[[telemetry]]" restamp="true">
      <app-analytics tracking-id="UA-18021184-6" app-name="ARC-electon" app-id="[[appId]]" app-version="[[appVersion]]" data-source="electron-app">
        <template is="dom-repeat" items="[[gaCustomMetrics]]">
          <app-analytics-custom type="metric" index="[[item.index]]" value="[[item.value]]"></app-analytics-custom>
        </template>
        <template is="dom-repeat" items="[[gaCustomDimensions]]">
          <app-analytics-custom type="dimension" index="[[item.index]]" value="[[item.value]]"></app-analytics-custom>
        </template>
      </app-analytics>
      <app-analytics tracking-id="UA-18021184-14" app-name="ARC-electon" app-id="[[appId]]" app-version="[[appVersion]]" data-source="electron-app">
        <template is="dom-repeat" items="[[gaCustomMetrics]]">
          <app-analytics-custom type="metric" index="[[item.index]]" value="[[item.value]]"></app-analytics-custom>
        </template>
        <template is="dom-repeat" items="[[gaCustomDimensions]]">
          <app-analytics-custom type="dimension" index="[[item.index]]" value="[[item.value]]"></app-analytics-custom>
        </template>
      </app-analytics>
      <app-analytics tracking-id="UA-71458341-2" app-name="ARC-electon" app-id="[[appId]]" app-version="[[appVersion]]" data-source="electron-app">
        <template is="dom-repeat" items="[[gaCustomMetrics]]">
          <app-analytics-custom type="metric" index="[[item.index]]" value="[[item.value]]"></app-analytics-custom>
        </template>
        <template is="dom-repeat" items="[[gaCustomDimensions]]">
          <app-analytics-custom type="dimension" index="[[item.index]]" value="[[item.value]]"></app-analytics-custom>
        </template>
      </app-analytics>
    </template>
    <arc-license-dialog></arc-license-dialog>
    <api-candidates-dialog></api-candidates-dialog>
    <arc-onboarding></arc-onboarding>
    <paper-toast id="errorToast" duration="5000"></paper-toast>`;
  }

  static get properties() {
    return {
      /**
       * A reference to the variables open button.
       * @type {String}
       */
      _variablesButton: Object,
      /**
       * A logger
       */
      log: {
        type: Object,
        value: function() {
          /* global log */
          return log;
        }
      },
      /**
       * When true it is rendering API console view.
       */
      isApiConsole: {type: Boolean, value: false, readOnly: true},
      /**
       * System variables
       */
      sysVars: {
        type: Object,
        value: function() {
          return process.env;
        }
      },
      _variablesOverlayOpened: {
        type: Boolean,
        observer: '_varsOverlayChanged'
      },

      appMenuDisabled: {
        type: Boolean,
        reflectToAttribute: true,
        computed: '_computeAppMenuDisabled(menuConfig.*)',
      },
      /**
       * Computed value. When `true` it renders `back` button instead of menu.
       * @type {Boolean}
       */
      renderBackButton: {
        type: Boolean,
        value: false,
        computed: '_computeRenderBackButton(page)'
      },
      /**
       * Automatically set via media queries.
       * When set it renders narrow wiew.
       * This also affects API console.
       */
      narrow: {
        type: Boolean
      },
      /**
       * Currently opened application screen
       * @type {String}
       */
      page: {type: String, value: 'request', observer: '_pageChanged'},
      /**
       * Set by API console wrapper. WHen set the API is being processed.
       */
      apiProcessing: Boolean,
      apiSelected: String,
      apiSelectedType: String,
      /**
       * Received from layout elements narrow state.
       */
      narrowLayout: {
        type: Boolean,
        reflectToAttribute: true
      },
      /**
       * When set the infor center drawer is opened.
       */
      messageCenterOpened: Boolean,
      /**
       * OAuth 2 redirect URI to be used when authorizing the request.
       */
      _oauth2redirectUri: {
        type: String,
        computed: '_computeRedirectUri(config.oauth2redirectUri)'
      }
    };
  }

  constructor() {
    super();
    this._openExternalHandler = this._openExternalHandler.bind(this);
    this._copyContentHandler = this._copyContentHandler.bind(this);
    this._apiDataHandler = this._apiDataHandler.bind(this);
    this._processStartHandler = this._processStartHandler.bind(this);
    this._processStopHandler = this._processStopHandler.bind(this);
    this._processErrorHandler = this._processErrorHandler.bind(this);
    this._exchangeAssetHandler = this._exchangeAssetHandler.bind(this);
    this.openWorkspace = this.openWorkspace.bind(this);
  }

  static get observers() {
    return [
      '_routeDataChanged(page, routeParams.*)'
    ];
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('open-external-url', this._openExternalHandler);
    window.addEventListener('content-copy', this._copyContentHandler);
    window.addEventListener('process-loading-start', this._processStartHandler);
    window.addEventListener('process-loading-stop', this._processStopHandler);
    window.addEventListener('process-error', this._processErrorHandler);
    window.addEventListener('api-data-ready', this._apiDataHandler);
    this.addEventListener('process-exchange-asset-data', this._exchangeAssetHandler);
    this.addEventListener('request-workspace-append', this.openWorkspace);
    window.addEventListener('workspace-open-project-requests', this.openWorkspace);
    afterNextRender(this, () => {
      this._variablesButton = this.shadowRoot.querySelector('#varToggleButton');
      this._scrollTarget = this.$.scrollingRegion.$.contentContainer;
    });
  }

  _routeDataChanged(page, changeRecord) {
    const params = changeRecord.base;
    switch (page) {
      case 'request':
        this._setupRequest(params);
        break;
      case 'project':
        this._setupProject(params);
        break;
      case 'api-console':
        this._setupApiConsole(params);
        break;
    }
  }

  /**
   * Loads a page component when page changes.
   * @param {String} page Current page
   */
  _pageChanged(page) {
    let id;
    let path;
    let scope;
    history.pushState({page}, null, '#' + page);
    switch (page) {
      case 'request':
        id = 'arc-request-workspace';
        path = 'arc-request-workspace/arc-request-workspace';
        scope = '@advanced-rest-client';
        break;
      case 'project':
        id = 'project-details';
        path = 'project-details/project-details';
        scope = '@advanced-rest-client';
        break;
      case 'hosts-rules':
        id = 'host-rules-editor';
        path = 'host-rules-editor/host-rules-editor';
        scope = '@advanced-rest-client';
        break;
      case 'cookie-manager':
        id = 'cookie-manager';
        path = 'cookie-manager/cookie-manager';
        scope = '@advanced-rest-client';
        break;
      case 'settings':
        id = 'arc-settings-panel';
        path = 'arc-settings-panel/arc-settings-panel';
        scope = '@advanced-rest-client';
        break;
      case 'about':
        id = 'about-arc-electron';
        path = 'about-arc-electron/about-arc-electron';
        scope = '@advanced-rest-client';
        break;
      case 'socket':
        id = 'websocket-panel';
        path = 'websocket-panel/websocket-panel';
        scope = '@advanced-rest-client';
        break;
      case 'exchange-search':
        id = 'exchange-search-panel';
        path = 'exchange-search-panel/exchange-search-panel';
        scope = '@advanced-rest-client';
        break;
      case 'api-console':
        return this._loadApic()
        .catch((cause) => console.warn(cause));
        // id = 'api-console';
        // path = 'api-console/api-console';
        // break;
      case 'drive':
        id = 'google-drive-browser';
        path = 'google-drive-browser/google-drive-browser';
        scope = '@advanced-rest-client';
        break;
      case 'data-import':
        id = 'import-panel';
        path = 'import-panel/import-panel';
        scope = '@advanced-rest-client';
        break;
      case 'data-export':
        id = 'export-panel';
        path = 'export-panel/export-panel';
        scope = '@advanced-rest-client';
        break;
      case 'rest-projects':
        id = 'rest-apis-list-panel';
        path = 'rest-apis-list-panel/rest-apis-list-panel';
        scope = '@advanced-rest-client';
        break;
      case 'history':
        id = 'history-panel';
        path = 'history-panel/history-panel';
        scope = '@advanced-rest-client';
        break;
      case 'saved':
        id = 'saved-requests-panel';
        path = 'saved-requests-panel/saved-requests-panel';
        scope = '@advanced-rest-client';
        break;
      case 'themes-panel':
        id = 'themes-panel';
        path = 'themes-panel/themes-panel';
        scope = '@advanced-rest-client';
        break;
      default:
        console.error(`The base route ${page} is not recognized`);
        return;
    }
    const cls = window.customElements.get(id);
    if (cls) {
      return;
    }
    this._loadComponent(path, scope)
    .catch((cmp) => this._reportComponentLoadingError(cmp));
  }

  initApplication() {
    afterNextRender(this, () => this.initSettings({}));
    afterNextRender(this, () => this.updateStyles({}));
    afterNextRender(this, () => this._requestAuthToken(false));
    const hash = location.hash.substr(1);
    if (hash) {
      this.page = hash;
    }
  }

  _setupRequest(params) {
    if (!params) {
      return;
    }
    const {id, type} = params;
    if (!type || !this.$.workspace.addEmptyRequest) {
      this.log.info('arc-electron(app)::_setupRequest::Missing use case implementation?');
      return;
    }
    if (!type || type === 'new') {
      if (this.$.workspace.addEmptyRequest) {
        this.$.workspace.addEmptyRequest();
      } else {
        this.log.info('arc-electron(app)::_setupRequest::Missing use case implementation?');
      }
      return;
    }
    if (params.type === 'latest' || !params.id) {
      return;
    }
    this.$.requestModel.read(type, id)
    .then((request) => {
      const index = this.$.workspace.findRequestIndex(request._id);
      if (index === -1) {
        this.$.workspace.appendRequest(request);
      } else {
        this.$.workspace.updateRequestObject(request, index);
        this.$.workspace.selected = index;
      }
    })
    .catch((cause) => {
      this.log.warn('Restoring request:', cause);
    });
  }

  _setupProject(params) {
    if (!params) {
      return;
    }
    this.$.projectDetails.projectId = params.id;
  }

  _setupApiConsole(params) {
    if (!params) {
      return;
    }
    const {id, version} = params;
    if (!id) {
      return;
    }
    return this._loadApic()
    .then(() => {
      this.apiSelected = undefined;
      this.apiSelectedType = undefined;
      this._setIsApiConsole(true);
      this.apiProcessing = true;
      return this.$.apic.open(id, version);
    })
    .then(() => {
      this.apiSelected = 'summary';
      this.apiSelectedType = 'summary';
    })
    .catch((cause) => {
      this.apiProcessing = false;
      this._setIsApiConsole(false);
      this.notifyError(cause.message);
    });
  }
  /**
   * The overlay is not included by default in the view so it loads the
   * component first and then renders it. Subsequent opens do not require
   * inluding the comonent.
   *
   * @param {Boolean} val
   */
  _varsOverlayChanged(val) {
    if (val && !window.customElements.get('variables-preview-overlay')) {
      this._loadComponent('variables-preview-overlay/variables-preview-overlay', '@advanced-rest-client')
      .catch((cmp) => this._reportComponentLoadingError(cmp));
    }
  }

  _variablesOpenRequest(e) {
    e.stopPropagation();
    this._variablesOverlayOpened = false;
    this._loadComponent('variables-drawer-editor/variables-drawer-editor', '@advanced-rest-client')
    .then(() => {
      this.$.environmentsDrawer.opened = true;
    })
    .catch((cmp) => this._reportComponentLoadingError(cmp));
  }

  _variablesPreviewClosed() {
    if (this._variablesOverlayOpened) {
      this._variablesOverlayOpened = false;
    }
  }
  /**
   * Loads `web-url-input` component and runs it to ask the user for the URL
   * to open in session window. Cookies recorded in the window are becomming
   * requests session cookies.
   */
  openWebUrl() {
    if (this.page !== 'request') {
      this.page = 'request';
    }
    this.workspace.openWebUrlInput();
  }

  _openWebUrlHandler(e) {
    ipc.send('open-web-url', e.detail.url, e.detail.purpose);
  }

  _requestAuthToken(interactive, scope) {
    if (this.__requestingToken) {
      return;
    }
    this.__requestingToken = true;
    /* global ipc */
    ipc.send('oauth-2-get-token', {
      interactive: interactive,
      scopes: scope
    });
    const context = this;
    let rejected;
    function resolved(sender, token) {
      const tokenValue = token ? token.accessToken : undefined;
      context.__requestingToken = false;
      ipc.removeListener('oauth-2-token-ready', resolved);
      ipc.removeListener('oauth-2-token-error', rejected);
      context.dispatchEvent(new CustomEvent('google-signin-success', {
        composed: true,
        cancelable: true,
        bubbles: true,
        detail: {
          scope: scope,
          token: tokenValue
        }
      }));
      context.driveAccessToken = tokenValue;
    }
    rejected = function() {
      context.__requestingToken = false;
      ipc.removeListener('oauth-2-token-ready', resolved);
      ipc.removeListener('oauth-2-token-error', rejected);
      context.dispatchEvent(new CustomEvent('google-signout', {
        composed: true,
        cancelable: true,
        bubbles: true,
        detail: {
          scope: scope
        }
      }));
    };
    ipc.on('oauth-2-token-ready', resolved);
    ipc.on('oauth-2-token-error', rejected);
  }
  /**
   * Sets `newMessages` propert depending if messaging service detected
   * new messages.
   *
   * @param {CustomEvent} e
   */
  _unreadMessagesChanged(e) {
    const state = !!(e.detail.value && e.detail.value.length > 0);
    this.set('newMessages', state);
  }
  /**
   * Opens the info center drawwer.
   */
  openInfoCenter() {
    this.messageCenterOpened = !this.messageCenterOpened;
    if (this.messageCenterOpened) {
      this.$.msgService.readMessages();
      window.setTimeout(() => {
        this.$.msgService.unread.forEach((item, i) => {
          this.$.msgService.set(['unread', i, 'read'], 1);
        });
      }, 4000);
    }
  }
  /**
   * Closes the info center drawwer.
   */
  closeInfoCenter() {
    this.messageCenterOpened = false;
  }
  /**
   * Handles `open-external-url` event from ARC components.
   * @param {CustomEvent} e
   */
  _openExternalHandler(e) {
    e.preventDefault();
    /* global ipcRenderer */
    ipcRenderer.send('open-external-url', e.detail.url);
  }
  /**
   * Handles new window open request.
   */
  onNewWindow() {
    ipcRenderer.send('new-window');
  }
  /**
   * Handles `clipboard-copy` event from ARC components.
   * The `clipboard` api is loaded in the preload script.
   *
   * @param {CustomEvent} e
   */
  _copyContentHandler(e) {
    /* global clipboard */
    clipboard.writeText(e.detail.value);
    e.preventDefault();
  }
  /**
   * Installs pading update.
   */
  updateInstall() {
    ipcRenderer.send('install-update');
  }

  _apiDataHandler(e) {
    const {model, type} = e.detail;
    this._setApiData(model, type.type)
    .then(() => {
      this._dispatchNavigate({
        base: 'api-console'
      });
    });
  }

  _exchangeAssetHandler(e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    const asset = e.detail;
    let file;
    const types = ['fat-raml', 'raml', 'oas'];
    for (let i = 0, len = asset.files.length; i < len; i++) {
      if (types.indexOf(asset.files[i].classifier) !== -1) {
        file = asset.files[i];
        break;
      }
    }
    if (!file || !file.externalLink) {
      this.notifyError('RAML data not found in the asset.');
      return;
    }
    return this._loadApic()
    .then(() => this._dispatchExchangeApiEvent(file))
    .then((e) => {
      if (!e.defaultPrevented) {
        this.notifyError('API data processor not found.');
      } else {
        this._setIsApiConsole(true);
        this.apiProcessing = true;
        this._dispatchNavigate({
          base: 'api-console'
        });
        return e.detail.result;
      }
    })
    .then((api) => {
      this._setApiData(api.model, api.type.type);
    })
    .catch((cause) => {
      this.notifyError(cause.message);
    });
  }

  _dispatchExchangeApiEvent(file) {
    const e = new CustomEvent('api-process-link', {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: {
        url: file.externalLink,
        mainFile: file.mainFile,
        md5: file.md5,
        packaging: file.packaging
      }
    });
    this.dispatchEvent(e);
    return e;
  }

  _loadApic() {
    return import('./apic-electron/apic-electron.js')
    .then(() => {
      this._loadingSources = false;
    })
    .catch((cause) => {
      console.warn(cause);
      this._loadingSources = false;
      this._reportComponentLoadingError('apic-electron');
      throw cause;
    });
  }

  _setApiData(api, type) {
    return this._loadApic()
    .then(() => {
      this.$.apic.amf = api;
      this.$.apic.apiType = type;
      this._setIsApiConsole(true);
      this.apiSelected = undefined;
      this.apiSelectedType = undefined;
      afterNextRender(this, () => {
        this.apiSelected = 'summary';
        this.apiSelectedType = 'summary';
      });
    });
  }

  /**
   * Handles opening a file from Google Drive.
   * Dispatches `import-process-file` so the import module processes the data
   *
   * @param {CustomEvent} e
   */
  _openDriveRequest(e) {
    const file = new Blob([e.detail.content], {type: 'application/json'});
    this.dispatchEvent(new CustomEvent('import-process-file', {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: {
        file,
        diveId: e.detail.diveId
      }
    }));
  }

  notifyError(message) {
    this.$.errorToast.text = message;
    this.$.errorToast.opened = true;
  }
  /**
   * Closes API console view
   */
  closeApiConsole() {
    this._setIsApiConsole(false);
    this.page = 'exchange-search';
  }
  /**
   * Handler for `process-loading-start` custom event.
   * Renders toast with message.
   * @param {CustomEvent} e
   */
  _processStartHandler(e) {
    const {id, message, indeterminate} = e.detail;
    if (!id) {
      console.warn('Invalid use of `process-loading-start` event');
      return;
    }
    const toast = document.createElement('paper-toast');
    toast.dataset.processId = id;
    if (indeterminate) {
      toast.duration = 0;
    }
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'row';
    container.style.alignItems = 'center';
    const label = document.createElement('span');
    label.innerText = message;
    label.style.flex = 1;
    label.style.flexBasis = '0.000000001px';
    container.appendChild(label);
    const spinner = document.createElement('paper-spinner');
    spinner.active = true;
    container.appendChild(spinner);
    toast.appendChild(container);
    document.body.appendChild(toast);
    toast.opened = true;
  }
  /**
   * Handler for `process-loading-stop` custom event.
   * Removes previously set toast
   * @param {CustomEvent} e
   */
  _processStopHandler(e) {
    const {id} = e.detail;
    if (!id) {
      console.warn('Invalid use of `process-loading-stop` event');
      return;
    }
    const node = document.body.querySelector(`[data-process-id="${id}"]`);
    if (!node) {
      return;
    }
    node.opened = false;
    node.addEventListener('iron-overlay-closed', function f() {
      node.removeEventListener('iron-overlay-closed', f);
      node.parentNode.removeChild(node);
    });
  }
  /**
   * Handler for `process-error` custom event.
   * Removes previously set progress toasts and adds new with error.
   * @param {CustomEvent} e
   */
  _processErrorHandler(e) {
    const nodes = document.body.querySelector(`[data-process-id]`);
    for (let i = nodes.length - 1; i >= 0; i--) {
      nodes[i].parentNode.removeChild(nodes[i]);
    }
    this.notifyError(e.detail.message);
  }
  /**
   * Opens license dialog.
   */
  openLicense() {
    this._loadComponent('arc-license-dialog/arc-license-dialog', '@advanced-rest-client')
    .then(() => {
      const node = this.shadowRoot.querySelector('arc-license-dialog');
      node.opened = true;
    })
    .catch((cmp) => this._reportComponentLoadingError(cmp));
  }
  /**
   * Handler for `popup-menu`. Sends command to the IO process.
   * IO process informs windows to hide the menu.
   * @param {CustomEvent} e
   */
  _popupMenuHandler(e) {
    const {type} = e.detail;
    let sizing;
    const menu = this.shadowRoot.querySelector('arc-menu');
    if (menu) {
      const rect = menu.getBoundingClientRect();
      sizing = {
        height: rect.height,
        width: rect.width
      };
    }
    ipcRenderer.send('popup-app-menu', type, sizing);
  }
  /**
   * Computes value for `appMenuDisabled` property.
   * @param {Object} record Polymer's change record for `menuConfig`
   * @return {Boolean}
   */
  _computeAppMenuDisabled(record) {
    if (!record || !record.base) {
      return false;
    }
    const mc = record.base;
    if (mc.menuDisabled) {
      return true;
    }
    if (mc.hideHistory && mc.hideSaved && mc.hideProjects && mc.hideApis) {
      return true;
    }
    return false;
  }
  /**
   * Computes value for `renderBackButton` property.
   * @param {String} page Current page value
   * @return {Boolean}
   */
  _computeRenderBackButton(page) {
    return !page || page !== 'request';
  }
  /**
   * Handler for the "back" icon click in main navigation.
   */
  _backHandler() {
    if (this.isApiConsole) {
      this._setIsApiConsole(false);
    }
    this.openWorkspace();
  }

  _saveApi() {
    this.$.apic.save();
  }

  _apiActionMenuChanged(e) {
    const selected = e.detail.value;
    if (selected === undefined || selected === -1) {
      return;
    }
    const item = e.target.selectedItem;
    const action = item.dataset.action;
    let p;
    switch (action) {
      case 'delete':
        p = this.$.apic.delete();
        break;
      case 'delete-version':
        const v = this.shadowRoot.querySelector('#apiVersionSelector').selected;
        p = this.$.apic.deleteVersion(v);
        break;
      case 'save-oas':
        this.$.apic.saveAs('oas');
        break;
      case 'save-raml':
        this.$.apic.saveAs('raml');
        break;
      case 'upload-exchange':
        log.info('Not yet supported.');
        break;
    }
    e.target.selected = undefined;
    if (p) {
      p.catch((cause) => this.notifyError(cause.message));
    }
  }

  _apiVersionMenuChanged(e) {
    const {value} = e.detail;
    if (!value) {
      return;
    }
    const id = this.$.apic.apiInfo._id;
    const params = {
      id,
      version: value
    };
    this._setupApiConsole(params);
  }
  /**
   * Returns true when both types of variables are disabled.
   * @param {Boolean} sysVars
   * @param {Boolean} appVars
   * @return {Boolean}
   */
  _computeVariablesDisabled(sysVars, appVars) {
    if (sysVars === undefined) {
      sysVars = true;
    }
    if (appVars === undefined) {
      appVars = true;
    }
    return !(sysVars && appVars);
  }

  _computeVarDisabled(enabled) {
    if (enabled === undefined) {
      return false;
    }
    return !enabled;
  }
  /**
   * @TODO: Move it to app mixin.
   */
  closeActiveTab() {
    this.workspace.closeActiveTab();
  }

  processExternalFile(file) {
    if (!file) {
      throw new Error('"file" argument is required.');
    }
  }
  /**
   * Computes value for `oauth2RedirectUri` property. It is either configuration
   * option or default value.
   * @param {?String} redirectUri Configuration value for redirect URI.
   * @return {String} Redirect URI to be used.
   */
  _computeRedirectUri(redirectUri) {
    return redirectUri ? redirectUri : 'https://auth.advancedrestclient.com/oauth-popup.html';
  }
  /**
   * Opens onboarding element.
   */
  openOnboarding() {
    const node = this.shadowRoot.querySelector('arc-onboarding');
    node.opened = true;
  }
  /**
   * Opens workspace details dialog.
   */
  openWorkspaceDetails() {
    if (this.page !== 'request') {
      this.page = 'request';
    }
    this.workspace.openWorkspaceDetails();
  }
}
window.customElements.define('arc-electron', ArcElectron);
