[![Build Status](https://travis-ci.org/advanced-rest-client/saved-request-editor.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/saved-request-editor)  

# saved-request-editor

`<saved-request-editor>` An applet to edit saved request data

Required elements to be present in the DOM:

-   `request-saver` - an element to save request data in the datastore.

The element knows nothing about the request content so it has to be used in a
context of a request. It accepts `name`, `isSaved` and `projectId` properties
for requests that are already stored in the datastore.
This values must be set by the application that hosts the element. It also can be
done by assigning a request object to the `request` property. But the request object
itself is not used in the dialog.

The element fires `save-request` custom event when the user use "save" or
"override" option in the UI. To react on a cancel event listen for
`cancel-request-edit` event. Note that the event does not bubble.

To edit a history item to save it in the saved request data store set the
`is-history` attribute. It will always treat the request as a non saved object.
Note that the `request` object set on `save-request` event won't be altered
by this property. It may still contain the `_id` and `_rev` properties.

### Example
```
<saved-request-editor></saved-request-editor>
```

### Styling
`<saved-request-editor>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--saved-request-editor` | Mixin applied to the element | `{}`



### Events
| Name | Description | Params |
| --- | --- | --- |
| cancel-request-edit | Fired when the user cancels the editor. | __none__ |
| save-request | Fire when the user saves the request. | name **String** - Required, request name |
description **String** - Optional, request description |
override **Boolean** - Required, `true` if already saved object and user accepted to override the data. |
isDrive **Boolean** - Required, |
isProject **Boolean** - Required, |
projectIsNew **Boolean** - Required if `isProject` is true. True if the project do not exists in the datastore. In this case `projectName` is set. Otherwise `projectId` is set. |
projectName **String** - Optional, only if `projectIsNew` is `true`. Name of the project to create. |
projectId **String** - Optional, only if `projectIsNew` is `false`. The ID of existing project that should be associated with the request. |
request **Object** - Optional, the `request` property if it was set with the editor. |
