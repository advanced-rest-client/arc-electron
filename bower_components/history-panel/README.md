[![Build Status](https://travis-ci.org/advanced-rest-client/history-panel.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/history-panel)  

# history-panel

ARC's requests history view

Contains complete UI to support saved requests view.
It needs the following components to be present in the DOM to support full
functionality:

-   arc-data-export - to prepare export object
-   chrome-file-export or any other file export element to save file to disk

### Example

```
<history-panel></history-panel>
```

### Styling
`<history-panel>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--history-panel` | Mixin applied to the element | `{}`
`--arc-font-headline` | Mixin applied to the header | `{}`
`--arc-font-subhead` | Mixin applied to the subheader | `{}`
`--history-panel-loader` | Mixin applied to the loader element | `{}`
`--history-panel-list` | Mixin apllied to the list element | `{}`
`--history-panel-toast-revert-button` | Mixin appllied to the rever button in the data delete confirmation toast | `{}`
`--warning-primary-color` | Main color of the warning messages | `#FF7043`
`--warning-contrast-color` | Contrast color for the warning color | `#fff`
`--error-toast` | Mixin applied to the error toast | `{}`
`--empty-info` | Mixin applied to the label rendered when no data is available. | `{}`
`--history-panel-fab-background-color` | Color of the fab button in the details panel | `--primary-color`



### Events
| Name | Description | Params |
| --- | --- | --- |
| navigate | Fired when navigation was requested | base **String** - The base route. It's always `request` |
type **String** - Type of the request to open. It's always `history` |
id **String** - ID of the request to open. |
| request-name-changed | Fired when the name changed. `project-model` handles this event to update the name.  This event is cancelable. A non-cancelable `request-object-changed` event is fired when the request name has been updated. | request **Object** - The request object with changed name |
name **String** - New name of the request |
type **String** - Always `history-requests` |
| request-objects-deleted | Fired when requests are to be deleted. Informs the model to delete items. | items **Array** - List of ids to delete |
type **String** - Always `history-requests` |
| request-objects-undeleted | Fired when the "revert" delete button has been used. Informs the requests model to restore the data. | items **Array** - List of requests to delete |
type **String** - Always `history-requests` |
