[![Build Status](https://travis-ci.org/advanced-rest-client/arc-models.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/arc-models)  

# project-model

Events based access to projects datastore.

Note: **All events must be cancelable.** When the event is cancelled by an instance
of the element it won't be handled again by other instance that possibly exists
in the DOM.

Cancellable event is a request to models for change. Non-cancellable event
is a notification for views to update their values.
For example `project-object-changed` event notifies model to update object in
the datastore if the event is cancelable and to update views if it's not
cancellable.

Each handled event contains the `result` property on the `detail` object. It
contains a `Promise` object with a result of the operation. Also, for update / delete
events the same non-cancelable event is fired.

Events handled by this element are cancelled and propagation of the event is
stopped.

Supported operations:

-   Read project object (`project-read`)
-   Update name only (`project-name-changed`)
-   Update project object (`project-object-changed`)
-   Delete object (`project-object-deleted`)
-   Query for projects (`project-model-query`)

### Events description

#### `project-read` event

Reads a project object from the datastore.

##### Properties
-   `id` (String, required) ID of the datastore entry
-   `rev` (String, optional) Specific revision to retrieve from the datastore. Latest by default.

##### Example

```javascript
var event = new CustomEvent('project-read', {
  detail: { id: 'some-id' },
  bubbles: true,
  composed: true,
  cancelable: true
});
document.body.dispatchEvent(event);
if (event.defaultPrevented) {
  event.detail.result.then(project => console.log(project));
}
```

#### `project-name-changed` event

Changes name of a project. Promise result has updated name and `_rev` properties.

##### Properties
-   `id` (String, required if `project` is not set) ID of the datastore entry
-   `project` (Object, required if `id` is not set) The database entity
-   `name` (String, required) New name of the project. It doesn't matter if `project` property already has new name.

##### Example

```javascript
var event = new CustomEvent('project-name-changed', {
  detail: { id: 'some-id', name: 'new name' },
  bubbles: true,
  composed: true,
  cancelable: true
});
document.body.dispatchEvent(event);
if (event.defaultPrevented) {
  event.detail.result.then(project => console.log(project));
}
```

#### `project-object-changed` event

Updates / saves new object in the datastore.

##### Properties

-   `project` (Object, required) An object to store

##### Example

```javascript
var event = new CustomEvent('project-object-changed', {
  detail: { project: {...} },
  bubbles: true,
  composed: true,
  cancelable: true
});
document.body.dispatchEvent(event);
if (event.defaultPrevented) {
  event.detail.result.then(project => console.log(project));
}
```

#### `project-object-deleted` event

Deletes the object from the datastore. This operation fires `project-object-deleted`
custom event. Promise returns object's new `_rev` value.

##### Properties
-   `id` (String, required) ID of the datastore entry
-   `rev` (String, optional) The `_rev` property of the PouchDB datastore object. If not set it will use latest revision.

##### Example

```javascript
var event = new CustomEvent('project-object-deleted', {
  detail: { id: 'some-id' },
  bubbles: true,
  composed: true,
  cancelable: true
});
document.body.dispatchEvent(event);
if (event.defaultPrevented) {
  event.detail.result.then(newRev => console.log(newRev));
}
```

#### `project-model-query` event

Reads the list of all projects. Promise resolves to the list of projects.
This event doesn't requeire any properties but **the `details` object must be set**.

##### Example

```javascript
var event = new CustomEvent('project-model-query', {
  detail: {}, // THIS MUST BE SET
  bubbles: true,
  composed: true,
  cancelable: true
});
document.body.dispatchEvent(event);
if (event.defaultPrevented) {
  event.detail.result.then(list => console.log(list));
}
```



### Events
| Name | Description | Params |
| --- | --- | --- |
| project-object-changed | Fired when the project entity has been saved / updated in the datastore. | project **Object** - Project object with new `_rev`. |
oldRev **String** - Entity old `_rev` property. May be `undefined` when creating new entity. |
| project-object-deleted |  | id **String** - Removed project ID |
rev **String** - Updated `_rev` property of the object. |
oldRev **String** - Entity old `_rev` property (before delete). |
# request-model

Events based access to saved request datastore.

Note: **All events must be cancelable.** When the event is cancelled by an instance
of the element it won't be handled again by other instance that possibly exists
in the DOM.

Cancellable event is a request to models for change. Non-cancellable event
is a notification for views to update their values.
For example `request-object-changed` event notifies model to update object in
the datastore if the event is cancelable and to update views if it's not
cancellable.

Each handled event contains the `result` property on the `detail` object. It
contains a `Promise` object with a result of the operation. Also, for update / delete
events the same non-cancelable event is fired.

Events handled by this element are cancelled and propagation of the event is
stopped.

Supported operations:

-   Read request object (`request-object-read`)
-   Update name only (`request-name-changed`)
-   Update request object (`request-object-changed`)
-   Delete object (`request-object-deleted`)
-   Deletes list of request objects (`request-objects-deleted`)

## Request object types

There are two request object types: `saved-requests` and `history-requests`.
Each event must contain a `type` property to determine which database to query
for an object.

### Events description

#### `request-object-read` event

Reads a request object from the datastore.

##### Properties
-   `id` (String, required) ID of the datastore entry
-   `rev` (String, optional) Specific revision to retrieve from the datastore. Latest by default.
-   `type` {String, required} Request object type. Either `saved-requests` or `history-requests`

##### Example

```javascript
var event = new CustomEvent('request-object-read', {
  detail: { id: 'some-id', type: 'saved-requests' },
  bubbles: true,
  composed: true,
  cancelable: true
});
if (event.defaultPrevented) {
  event.detail.result.then(request => console.log(request));
}
```

#### `request-name-changed` Event

Changes name of a request. Promise result has updated `name` and `_rev` properties.
This operation deletes old object because it changes the `name` of the request
that is used to build the datastore key.

##### Properties
-   `id` (String, required if `project` is not set) ID of the datastore entry
-   `request` (Object, required if `id` is not set) The database entity
-   `name` (String, required) New name of the project. It doesn't matter if `project` property already has new name.
-   `type` {String, required} Request object type. Either `saved-requests` or `history-requests`

##### Example

```javascript
var event = new CustomEvent('request-name-changed', {
  detail: { id: 'some-id', name: 'new name', type: 'history-requests' },
  bubbles: true,
  composed: true,
  cancelable: true
});
if (event.defaultPrevented) {
  event.detail.result.then(request => console.log(request));
}
```

#### `request-object-changed` event

Updates / saves new object in the datastore.

##### Properties

-   `request` (Object, required) An object to store
-   `type` {String, required} Request object type. Either `saved-requests` or `history-requests`

##### Example

```javascript
var event = new CustomEvent('request-object-changed', {
  detail: { request: {...}, type: 'saved-requests' },
  bubbles: true,
  composed: true,
  cancelable: true
});
if (event.defaultPrevented) {
  event.detail.result.then(request => console.log(request));
}
```

#### `request-object-deleted` event

Deletes the object from the datastore. This operation fires `request-object-deleted`
custom event. Promise returns object's new `_rev` value.

##### Properties
-   `id` (String, required) ID of the datastore entry
-   `rev` (String, optional) The `_rev` property of the PouchDB datastore object. If not set it will use latest revision.
-   `type` {String, required} Request object type. Either `saved-requests` or `history-requests`

##### Example

```javascript
var event = new CustomEvent('request-object-deleted', {
  detail: { id: 'some-id', type: 'saved-requests' },
  bubbles: true,
  composed: true,
  cancelable: true
});
if (event.defaultPrevented) {
  event.detail.result.then(newRev => console.log(newRev));
}
```

#### `request-objects-deleted` event

Removes list of requests in batch operation. Promise results to the map where keys
are request ids and values are new revision hash.

##### Properties

-   `items` (Array, required) List of IDs to delete
-   `type` {String, required} Request object type. Either `saved-requests` or `history-requests`

##### Example

```javascript
var event = new CustomEvent('request-objects-deleted', {
  detail: {
    items: ['some-id', 'other-id'],
    type: 'saved-requests'
  },
  bubbles: true,
  composed: true,
  cancelable: true
});
if (event.defaultPrevented) {
  event.detail.result.then(deleted => console.log(deleted));
}
```

#### `request-objects-undeleted` event

Restores previously deleted requests from the history.
It searches in the revision history of each object to find a revision before
passed `_rev` and restores this object as a new one in the revision tree.

This operation fires `request-object-deleted` custom event. Promise returns
request objects with updated `_rev` value.

##### Properties

-   `items` (Array, required) List of requests to restore. It required `_id` and `_rev` properties to be set on each object. The `_rev` property must be a revision updated after the deletion of the object.
-   `type` {String, required} Request object type. Either `saved-requests` or `history-requests`

##### Example

```javascript
var event = new CustomEvent('request-objects-deleted', {
  detail: {
    items: [{_id: 'some-id', '_rev': '2-xyz'}],
    type: 'saved-requests'
  },
  bubbles: true,
  composed: true,
  cancelable: true
});
if (event.defaultPrevented) {
  event.detail.result.then(restored => console.log(restored));
}
```



### Events
| Name | Description | Params |
| --- | --- | --- |
| request-object-changed | Fired when the project entity has been saved / updated in the datastore. | request **Object** - Request object with new `_rev`. |
oldRev **String** - Entity old `_rev` property. May be `undefined` when creating new entity. |
oldId **String** - Entity old `_id` property. May be `undefined` when creating new entity. |
type **String** - Request object type. Can be either `saved-requests` or `history-requests` |
| request-object-deleted |  | id **String** - Removed request ID |
rev **String** - Updated `_rev` property of the object. |
oldRev **String** - Entity old `_rev` property (before delete). |
type **String** - Request object type. Can be either `saved-requests` or `history-requests` |
# websocket-url-history-model

Events based access to websockets URL history datastore.

Note: **All events must be cancelable.** When the event is cancelled by an instance
of the element it won't be handled again by other instance that possibly exists
in the DOM.

Cancellable event is a request to models for change. Non-cancellable event
is a notification for views to update their values.
For example `request-object-changed` event notifies model to update object in
the datastore if the event is cancelable and to update views if it's not
cancellable.

Each handled event contains the `result` property on the `detail` object. It
contains a `Promise` object with a result of the operation. Also, for update / delete
events the same non-cancelable event is fired.

Events handled by this element are cancelled and propagation of the event is
stopped.

