# arc-preferences

A module to be used in ARC Electron app to support application preferences.

Currently it supports:

-   application settings
-   workspace state

It contains classes to work in both main and renderer process.

## Main process

When the application is initialized, ARC is to initialize `PreferencesManager`
class from `main/preferences-manager`. It listens for renderer ipc events
dispatched by `ArcPreferencesProxy` class.

```javascript
const mgr = new PreferencesManager();
mgr.observe();
```

The class listens for `read-app-preferences` and `update-app-preference`
events from the renderer process.

### Reading settings from renderer using web custom events

```javascript
const {ArcPreferencesProxy} = require('./arc-preferences/renderer');
const proxy = new ArcPreferencesProxy();
proxy.observe();

const e = new CustomEvent('settings-read', {
  bubbles: true,
  composed: true, // assuming custom element
  cancelable: true,
  detail: {} // must be set!
});
this.dispatchEvent(e); // assuming custom element

if (e.defaultPrevented) {
  e.detail.result.then((settings) => console.log(settings));
}
```

### Saving settings from renderer using web custom events

```javascript
const {ArcPreferencesProxy} = require('./arc-preferences/renderer');
const proxy = new ArcPreferencesProxy();
proxy.observe();

const e = new CustomEvent('settings-changed', {
  bubbles: true,
  composed: true, // assuming custom element
  cancelable: true,
  detail: {
    name: 'my-setting',
    value: 'my-value'
  }
});
this.dispatchEvent(e); // assuming custom element

if (e.defaultPrevented) {
  e.detail.result.then((settings) => console.log('Settings saved'));
}
```

When settings are updates every browser window receives `app-preference-updated`
event from the main page on the ipc main bus and the proxy dispatches non cancelable
`settings-changed` custom event. Therefore once the proxy is initialized the
components / application should just listen to this event to know if a setting
changed.

## Renderer process

### Preferences read and save

By design there's no direct class to manipulate the settings file. The app works
with single settings file and there can be more than one window opened.
To ensure that each window has the same set of settings all storing / restoring
logic is in main process in `PreferencesManager` class.

Renderer process must use `ArcPreferencesProxy` class to communicate with main
process to operate on the data.

Preferred way to handle settings is by using custom events.

First initialize the proxy somewhere in the application logic.
```javascript
const {ArcPreferencesProxy} = require('./arc-preferences/renderer');
const proxy = new ArcPreferencesProxy();
proxy.observe();
```

Once the proxy observers for custom events it's ready to use event's API:

```javascript
const e = new CustomEvent('settings-read', {
  bubbles: true,
  composed: true, // assuming custom element
  cancelable: true,
  detail: {} // must be set!
});
this.dispatchEvent(e); // assuming custom element

if (e.defaultPrevented) {
  e.detail.result.then((settings) => console.log(settings));
}
```

Or to update settings:

```javascript
const e = new CustomEvent('settings-changed', {
  bubbles: true,
  composed: true, // assuming custom element
  cancelable: true,
  detail: {
    name: 'my-setting',
    value: 'my-value'
  }
});
this.dispatchEvent(e); // assuming custom element

if (e.defaultPrevented) {
  e.detail.result.then((settings) => console.log('Settings saved'));
}
```

Because all windows are notified about the change the app should listen for
`settings-changed` custom event. If the event is non-cancelable it means that
the change has been saved to the file.

```
window.addEventListener('settings-changed', (e) => {
  if (e.cancelable) {
    // This is request for change. It still can be canceled for any reason.
    return;
  }
  console.log('Setting changed', e.detail.name, e.detail.value);
});
```

### Workspace state

This module also support workspace state. It allows to read and update a state
of specific window.

```javascript
const {WorkspaceManager} = require('./arc-preferences/renderer');
const manager = new WorkspaceManager(0);
manager.observe();
```

The first argument tells which state to restore. It is an index of the window
being opened. By default it's `0`. The application should inform created window
about its index so it restores appropriate state. For better experience each window
should support it's own state.

#### Reading workspace state

```javascript
const e = new CustomEvent('workspace-state-read', {
  bubbles: true,
  composed: true, // assuming custom element
  cancelable: true,
  detail: {} // must be set!
});
this.dispatchEvent(e); // assuming custom element
if (e.defaultPrevented) {
  e.detail.result.then((state) => console.log(state));
}
```

If the state file does not exist it returns default values.

#### Updating workspace state

```javascript
const e = new CustomEvent('workspace-state-store', {
  bubbles: true,
  composed: true, // assuming custom element
  cancelable: true,
  detail: {
    value: {
      selected: 1,
      requests: [{}],
      environmetn: 0
    }
  }
});
this.dispatchEvent(e); // assuming custom element
if (e.defaultPrevented) {
  e.detail.result.then((state) => console.log(state));
}
```


## Application meta data (main process)

When first run the app creates a meta data file. The file contains
`appId` which is `uuid` version 4 string and `aid` which is `uuid` version 5.

The `appId` property can be used to identify specific instance of the application.
This can be used to synchronize data between the instance and any application server.

The `aid` is anonymised application id that only can be used with analytics
suite. This property cannot be used anywhere else to ensure that any anaytics data
cannot be connected to specific instance.

### Usage

```
const {ArcMeta} = require('./arc-preferences/main');
const meta = new ArcMeta();
meta.getAppId()
.then((appId) => {
  // appId is persistent and can be used to identify the app instance
});

meta.getAninimizedId()
.then((aid) => {
  // aid can be only used to record a user session.
});
```

## Session control (window meta)

The `ArcSessionControl` updates opened application window state to the state file.
It includes window position and size.

### Example usage

```javascript
const {ArcSessionControl} = require('./arc-preferences/main');
const session = new ArcSessionControl(1); // index of the window.
return session.load()
.then((state) => {
  const win = new BrowserWindow({
    width: state.size.width,
    height: state.size.height,
    x: state.position.x,
    y: state.position.y,
  });
  session.trackWindow(win);
  win.arcSession = session;
  win.addListener('closed', () => {
    win.arcSession.untrackWindow();
  });
})
```

The constructor takes window index as an argument. Each window has it's own
state file that keeps its size and position.

The application can call `updatePosition()` and `updateSize()` function by it's
own. The class provides the `trackWindow()` function that tracks both `resize`
and `move` events of the window object. **when using this function** clear
event listeners when the window is closed or it will newer get garbage collected.
