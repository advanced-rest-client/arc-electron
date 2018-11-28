# AMF parsing service for Electron.

This electron module works in the renderer process and handle web events
as described in [API data processing events](https://github.com/advanced-rest-client/api-components-api/blob/master/docs/api-processing-events.md)
of Advanced REST Client documentation.

Allows to safely parse API specification and report back API model.

The API model is an output of [AMF](https://a.ml) parser and json-ld generator.

Currently it supports the following APIs:
-   RAML 0.8
-   RAML 1.0
-   OAS 1.0 (swagger)
-   OAS 2.0 (swagger)

Support for OAS 3.0 in AMF's roadmap.

## Web based APIs

### Initialization

In the renderer process.

```javascript
const {ElectronAmfService} = require('@advanced-rest-client/electron-amf-service');
const service = new ElectronAmfService();
service.listen();
```

This enables event listeners. Call `unlisten()` to remove the listeners.

### process-exchange-asset-data event

Handles event dispatched by [advanced-rest-client/exchange-search-panel](https://github.com/advanced-rest-client/exchange-search-panel).
It downloads API asset and parses it using AMF service.

After its done it dispatches `api-data-ready` custom event as the panel do not
handle responses to `process-exchange-asset-data` event.

**Example**

In the application (renderer process).

```javascript
window.addEventListener('api-data-ready', (e) => {
  console.log(e.detail.api); // outputs AMF model
});

window.addEventListener('process-error', (e) => {
  if (e.detail.source === 'amf-service') {
    console.log(e.detail.message);
  }
});
```

### api-process-file event

API to be dispatched when the user selects a file to parse.
The file can be a single File (Blob) or Buffer.

The library supports raw files or compressed zip files.


**Example**

```javascript
const e = new CustomEvent('api-process-file', (e) => {
  bubbles: true,
  cancelable: true,
  detail: {
    // blob is a file or blob object. Any file object that is API file.
    // It also can be a Buffer
    file: blob
  }
});
document.body.dispatchEvent(e);
if (e.defaultPrevented) {
  e.detail.result
  .then((api) => console.log(api)) // Run API console
  .catch((cause) => console.error(cause));
}
```

### api-select-entrypoint event

The event dispatched by this library only if the `file` is a zip file.
The service tries to determine which file in unpacked zip file is the APIs entry
point. It does recognize RAML Extensions and Overlays as a main file.
However sometimes it is impossible to determine with 100% certainty which file
should be used. In this case the library dispatches `api-select-entrypoint`
so the app can present a file selector to the user.

The event must be cancelled. Also, whatever user decision is, the promise set on
the `detail.result` property must be resolved so the app can clean up, even if
the user cancelled the UI.

The detail object contains `candidates` property on the detail object which is
a list of file names that has been determined as a candidates to be an entry point.
This list always contains at least 2 items.

**Example**

```javascript
window.addEventListener('api-select-entrypoint', (e) => {
  e.preventDefault();
  e.detail.result = new Promise((resolve) => {
    const {candidates} = e.detail;
    const file = await presentOptions(candidates); // a function that renders UI
    resolve(file); // file can be undefined, it means that selection has been cancelled.
  });
});
```

**The promise should be resolved**. If not it may cause a memory problems.
The service creates temporary files from the zip file or from the buffer. After
it finish it cleans the files. Also, the parser runs in a separate process
so even if it crashes it will not destabilize the browser window. If the
promise is not resolved it may become a zombie process. However, it has a timeout
to kill itself if no job has been scheduled in a set time.

## Direct API

The module naturally exposes function that can be used instead of event API.

The functions are:

-   cleanup() - run when you sure you won't need the service
-   processApiLink(url) - Downloads and parses remote API
-   processApiFile(fileToBuffer) - Parses file / buffer
-   processBuffer(buffer) - Parses buffer only

See renderer/electron-amf-service.js for API details.

## Loading state

When the module start processing API data or Exchange asset it dispatches
`process-loading-start` custom event with `message` and `id` property.
Hosting application should handle this event to render any kind of UI indicating
ongoing process. When the program finish it dispatches `process-loading-stop`
custom event with the same `id` used with "start" event.

## API components

This module is part of the API components ecosystem. It is used in Advanced REST
Client project.
