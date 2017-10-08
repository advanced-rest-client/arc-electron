[![Build Status](https://travis-ci.org/advanced-rest-client/arc-data-export.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/arc-data-export)  

# arc-data-export

An element to handle data export preparation for ARC.

It gets requested data from the datastore and creates an export object or accept
external data to create export object.

Note, the export object has common for all export types. Use `kind` property
to determine export content type.
For example `export-project` object contains `projects` properties with single
item in the array while kind `AllDataExport` may have zero or more objects in
the array.

## Event based API

The element support event based API. By adding the element anywhere to the DOM
it enables event listeners on the `window` object.

All events are canceled and propagation is stopped.
Also, all handled events contains a `result` property on the `detail` object
added by the handler. It may contain the result object or promise that resolves
to a result object (in case of async operation).

### `export-project` event

Creates an export object and fires `export-data` to export generated data.

#### Properties

-   **project** (Object, required) Project object to export.
-   **requests** (Array, required) Requests list to export.
-   **variables** (Array, optional) List of variables to add to export.

#### event.detail.result

Object, export object

#### Example

```javascript
var event = new CustomEvent('export-project', {
  cancelable: true,
  composed: true,
  bubbles: true,
  detail: {
    project: {...},
    requests: [...]
  }
});
document.body.dispatchEvent(event);
if (event.defaultPrevented) {
  console.log(event.detail.result);
}
```

### `export-request` event

Creates an export object for a single request and fires `export-data` to export
generated data.

#### Properties

-   **request** (Object, required) Requests to export.
-   **variables** (Array, optional) List of variables to add to export.

#### event.detail.result

Object, export object

#### Example

```javascript
var event = new CustomEvent('export-request', {
  cancelable: true,
  composed: true,
  bubbles: true,
  detail: {
    request: {...},
    variables: [...] // This is optional
  }
});
document.body.dispatchEvent(event);
if (event.defaultPrevented) {
  console.log(event.detail.result);
}
```

### `export-requests` event

Creates an export object for a single request and fires `export-data` to export
generated data.

#### Properties

-   **requests** (Array, required) List of requests to export.
-   **variables** (Array, optional) List of variables to add to export.

#### event.detail.result

Object, export object

#### Example

```javascript
var event = new CustomEvent('export-requests', {
  cancelable: true,
  composed: true,
  bubbles: true,
  detail: {
    requests: [{...}],
    variables: [...] // This is optional
  }
});
document.body.dispatchEvent(event);
if (event.defaultPrevented) {
  console.log(event.detail.result);
}
```

### `export-create-object` event

Similar to events described above but creates an export object for
any supported export data.

Required `types` property on the `detail` object is a map od data to be exported.
Supported keys are:

-   `requests` (Array) List of requests to export
-   `projects` (Array) List of projects to export
-   `history` (Array) List of history requests to export
-   `websocket-url-history` (Array) List of url history object for WS to export
-   `url-history` (Array) List of URL history objects to export
-   `variables` (Array) List of variables to export
-   `headers-sets` (Array) List of the headers sets objects to export
-   `auth-data` (Array) List of the auth data objects to export
-   `cookies` (Array) List of cookies to export

#### Properties

-   **types** (Object, required) List of requests to export.
-   **kind** (String, optional) The `kind` property of the top export declaration. Default to `ARC#AllDataExport`

#### event.detail.result

Object, export object

#### Example

```javascript
var event = new CustomEvent('export-create-object', {
  cancelable: true,
  composed: true,
  bubbles: true,
  detail: {
    types: {
      requests: [{...}],
      projects: [{...}],
      ...
    },
    kind: 'any-value'
  }
});
document.body.dispatchEvent(event);
if (event.defaultPrevented) {
  console.log(event.detail.result);
}
```

### `export-user-data` event

Gets user data from the datastore and creates an export object. Fires the
`export-data` event when the data are ready to be exported.

Required `type` property on the `detail` object is a name of the data type
or list of names of data types to export. Supported values are:

-   `saved` To export list of saved requests with projects
-   `history` To export list of history requests
-   `websocket` To export list of websocket URL history
-   `history-url` To export list of requests URL history
-   `variables` To export list of all variables`
-   `headers-sets` To export list of variables sets
-   `auth` To export authorization data stored for the requests
-   `cookies` (Array) To export all cookies data

Special value of `all` exports all stored in local datastore data.

#### Properties

-   **type** (String or Array of String, required) A data type name or list of data type names
-   **noExport** (Boolean, optional) If set it will not send `export-data` event.
-   **file** (String, optional) Suggested file name in the save file dialog.

#### event.detail.result

Promise, Resolved promise to the export object

#### Example

```javascript
var event = new CustomEvent('export-user-data', {
  cancelable: true,
  composed: true,
  bubbles: true,
  detail: {
    type: ['request', 'history'] // or type: 'all'
  }
});
document.body.dispatchEvent(event);
if (event.defaultPrevented) {
  event.detail.result.then(data => console.log(data));
}
```



### Events
| Name | Description | Params |
| --- | --- | --- |
| app-version | Fired when querying for hosting application version number. The hosting application should handle this event by setting `version` property on event's `detail` object. | __none__ |
| export-data | Fired when any element request to export data outside the application | data **Any** - The data to export. Can be any format. In most cases it should be JSON.stringified and the `type` should be set to `application/json`. |
type **String** - Data content type. |
