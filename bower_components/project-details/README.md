[![Build Status](https://travis-ci.org/advanced-rest-client/project-details.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/project-details)  

# project-details

A project details panel for the Advanced REST Client.

Contains complete UI to display ARC's legacy projects.

This element contains logic for handling request and project data (`arc-models`).

It doesn't support data export. It must be used with another element that handles `export-project` custom event.

The element dispatches `navigate` custom event when the navigation occures. Hosting application shouls handle the event and navigate the used into requested place.

### Example
```
<project-details project-id="some-id"></project-details>
```

### Styling
`<project-details>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--project-details` | Mixin applied to the element | `{}`
`--project-details-description-color` | Color of the project description text | `rgba(0, 0, 0, 0.74)`
`--project-details-description-max-width` | Max width of the project description | `700px`
`--warning-primary-color` | Main color of the warning messages | `#FF7043`
`--warning-contrast-color` | Contrast color for the warning color | `#fff`
`--error-toast` | Mixin applied to the error toast | `{}`
`--project-details-fab-background-color` | Color of the fab button in the details panel | `--primary-color`
`--empty-info` | Theme mixin, applied to the "empty info" message | `{}`
`--project-details-description-empty` | Mixin applied to the "empty info" message | `{}`
`--project-details-description` | Description of the project | `{}`
`--project-details-description-container` Container of the description of the project | `{}`
`project-details-header` | Mixin applied to the header section | `{}`
`project-details-editor` | Mixin applied to the project editor | `{}`



### Events
| Name | Description | Params |
| --- | --- | --- |
| export-project | Fired when the project is to be exported. | project **Object** - Project data |
requests **Array** - List of requests to export with the project. |
| navigate | Fired when navigation was requested | base **String** - The base route. It's always `request` |
type **String** - Type of the request to open. It's always `saved` |
id **String** - ID of the request to open. |
| request-name-changed | Fired when the name changed. `project-model` handles this event to update the name.  This event is cancelable. A non-cancelable `request-object-changed` event is fired when the request name has been updated. | request **Object** - The request object with changed name |
name **String** - New name of the request |
type **String** - Always `saved-requests` |
| request-objects-deleted | Fired when requests are to be deleted. Informs the model to delete items. | items **Array** - List of ids to delete |
type **String** - Always `saved-requests` |
| request-objects-undeleted | Fired when the "revert" delete button has been used. Informs the requests model to restore the data. | items **Array** - List of requests to delete |
type **String** - Always `saved-requests` |
# project-details-editor

An element to render project details editor.



### Events
| Name | Description | Params |
| --- | --- | --- |
| cancel-edit | Fired when the user cancelled the action-button.  This event does not bubbles. | __none__ |
| save-edit | Fired when the user requested to save the data. This element does not recognize if any change actually has been made to the data so parent element may want to check if any data actually changed.  This event does not bubbles. | name **String** - Updated name |
description **String** - Updated description |
