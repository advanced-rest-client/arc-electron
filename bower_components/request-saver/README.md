[![Build Status](https://travis-ci.org/advanced-rest-client/request-saver.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/request-saver)  

# request-saver

An element that is responsible for saving request and project data.

### Example
```html
<head>
  <link rel="import" href="bower_components/request-saver/request-saver.html">
</head>
<body>
  <request-saver></request-saver>
</body>
```

## Event API

Send `save-request-data` custom event in boundaries of the `eventsTarget` property
to create or update request object. Dispatched event should be cancelable so
other instances of the same element won't try to update it at the same time.

The event handler expects to receive `request` and `opts` properties on the
event's `detail` object. The `request` property is required. Both properies are
passed to `overrideRequest(request, opts)` or `saveRequest(request, opts)` functions.

The function to use is determined by presence of the `_id` proprty on the
`request` object. If `_id` is not set then `saveRequest` function is used.

Handler for the event creates a new property on the `detail` object: `result`.
It is a result of calling any of the functions. It is always a promise that
resolves to updated request.

## Google Drive save action

This element do not support Drive save action. Instead it sends `drive-request-save`
cancelable event to query for an element that can perform this operation.
If the event is handled (cancelled and `result` property set on detail object)
then it waits until the `result` resolves the promise. Otherwise it
prints warning mesage to the console and continue process.



### Events
| Name | Description | Params |
| --- | --- | --- |
| drive-request-save | Fired when the request should be expored to Google Drive. This element doesn't support this operation but this way it queries for an element that can export data to Google Drive. | request **Object** - Request data to export |
fileName **String** - Google Drive file name. |
| project-object-changed | Fired when a project object has been created. | project **Object** - Project data object |
| request-object-changed |  | request **Object** - Request data object |
oldRev **String** - Object's _rev property before the change |
oldId **String** - Object's _id property before the change |
| request-object-deleted | Fired when a request object has been deleted from the datastore. | id **String** - Id of removed resource |
rev **String** - The _rev after the deletion |
oldRev **String** - The _rev before the deletion |
| request-saved | Fired when the request object has been saved to the datastore. | request **Object** - Saved request data |
override **Boolean** - Whether the operation overrites existing record |
toDrive **Boolean** - Whether request has been exported to Google Drive |
toProject **Boolean** - Whether the request has been added to project |
