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
  display: flex;
  flex-direction: column;
  align-items: center;
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
}`;
