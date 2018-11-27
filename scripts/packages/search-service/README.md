# ARC Electron content search service

Creates a pop up window that mimics Chrome's search bar.

## Usage

In the main process:

```javascript
const {ContentSearchService} = require('@advanced-rest-client/arc-electron-search-service/main');
const {ArcPreferences} = require('@advanced-rest-client/arc-electron-preferences');
const startupOptions = {}; // Application start up options.
const prefs = new ArcPreferences();

// Required step, add common instance of preferences manager
ContentSearchService.prefsManager = prefs;
// Required step, listen for menu actions
ContentSearchService.listen(emmiter);
```

The `emmiter` is any object that emmits `menu-action` even with first argument
to be `application:find` and second argument is the window object.
ARC electron has menu manager that does this.

In the renderer process:

```javascript
const {WindowSearchService} = require('@advanced-rest-client/arc-electron-search-service/renderer');
const service = new WindowSearchService();
service.listen();
```

The `listen()` function listens for electron's `menu-action` event.
Event with `application:find` name will be handled by the service and add search
window to the current window (from which the menu action was invoked).

This module works with Advanced REST Client application. It uses
`@advanced-rest-client/arc-electron-sources-manager` to determine source of
the web components import file for search window (hence use of preferences manager).

Search file import contains HTML imports for the web components used in window.
Import file content should be as follows:

```html
<link rel="import" href="bower_components/polymer/polymer-element.html">
<link rel="import" href="bower_components/shadycss/apply-shim.html">
<link rel="import" href="bower_components/polymer/lib/elements/custom-style.html">
<link rel="import" href="bower_components/polymer/lib/elements/dom-bind.html">
<link rel="import" href="bower_components/font-roboto-local/roboto.html">
<link rel="import" href="bower_components/paper-icon-button/paper-icon-button.html">
<link rel="import" href="bower_components/arc-icons/arc-icons.html">
<link rel="import" href="bower_components/paper-input/paper-input.html">
<link rel="import" href="bower_components/iron-a11y-keys/iron-a11y-keys.html">
<link rel="import" href="bower_components/iron-overlay-behavior/iron-overlay-behavior.html">
<link rel="import" href="bower_components/iron-resizable-behavior/iron-resizable-behavior.html">
<link rel="import" href="bower_components/iron-flex-layout/iron-flex-layout.html">
```

File location can be set in startup options in `searchFile` property.

Set startup options when initializing the app:

```javascript
...
ContentSearchService.prefsManager = prefs;
ContentSearchService.startupOptions = {
  searchFile: path.join(__dirname, 'search-imports.html')
};
ContentSearchService.listen();
```
