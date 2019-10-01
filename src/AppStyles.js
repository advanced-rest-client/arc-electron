import { css } from '../web_modules/lit-element/lit-element.js';

export default css`
:host {
  display: block;
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  --app-drawer-width: 320px;
}

[hidden] {
  display: none !important;
}

.pages {
  padding: 0px 24px;
  box-sizing: border-box;
}

.pages,
.pages > * {
  background-color: var(--primary-background-color, #fff);
}

.pages {
  min-height: 100%;
}

.pages > * {
  min-height: calc(100vh - 64px);
  box-sizing: border-box;
  padding: 4px;
}

.pages,
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
  display: flex;
  flex-direction: row;
  align-items: center;
  color: var(--arc-env-container-color);
}

environment-selector {
  margin-left: 8px;
  background-color: var(--arc-env-selector-background-color, initial);
  color: var(--arc-env-selector-color);
  --anypoint-dropdown-menu-background-color: var(--arc-env-selector-background-color, initial);
}

.var-panel {
  max-width: calc(100vw - var(--app-drawer-width, 0) - 32px);
  max-height: calc(100vh - 64px - 32px);
  /* background-color: var(--arc-toolbar-variables-panel-background, #fff);
  color: var(--arc-toolbar-variables-panel-color); */
}

arc-info-messages {
  min-width: 320px;
  position: relative;
  background-color: var(--arc-info-messages-background-color, white);
  padding: 0 12px;
  box-sizing: border-box;
  height: 100%;
}

arc-menu {
  color: var(--arc-menu-color);
  width: 320px;
  background-color: var(--arc-menu-background-color, #fff);
}

.api-navigation {
  width: 320px;
  height: 100%;
  color: var(--arc-menu-color);
  background-color: var(--arc-menu-background-color, #fff);
}

api-navigation,
.api-navigation-loader {
  height: calc(100vh - 72px);
  background-color: var(--arc-menu-background-color, inherit);
}

.api-navigation-loader {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
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

.icon {
  display: inline-block;
  width: 24px;
  height: 24px;
  fill: currentColor;
}

history-panel,
saved-requests-panel,
exchange-search-panel {
  height: calc(100vh - 64px);
}`;
