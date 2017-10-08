[![Build Status](https://travis-ci.org/advanced-rest-client/export-panel.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/export-panel)  

# export-panel

Data export panel for Advanced REST Client.

Provides the UI and and logic to export data from the data store to selected
export method provider. It uses events API to communicate with other elements.

Required elements to be present in the DOM:

-   `arc-data-export` - getting data from the datastore
-   element that handles `export-data` event
-   element that handles `google-drive-data-save` event

### Example
```
<export-panel></export-panel>
```

### Styling
`<export-panel>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--export-panel` | Mixin applied to the element | `{}`
`--error-toast` | Mixin applied to the error toast message | `{}`
`--warning-primary-color` | Error toast background color | `#FF7043`
`--warning-contrast-color` | Error toast color | `#fff`
`--arc-font-headline` | Mixin applied to the header | `{}`

# export-target-selector

Data export method selector view for the export module.

Provides the UI to select data export destination. It can be used to select
export method for any kind of data.

It uses event's API to communicate with export providers.
Currently it supports file and Google Drive export. See events documentation
section for more information.

TODO: Create an event API that queries the elements for data export providers.
This way it would create a dynamic list of providers without modifying the element
each time a new provider is added to the application. It would allow to
dynamically load export providers.

### Example
```
<export-target-selector on-exported="_exportedData"></export-target-selector>
```

### Styling
`<export-target-selector>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--export-target-selector` | Mixin applied to the element | `{}`
`--export-target-selector-card` | Mixin applied to the material card element | `{}`
`--export-target-selector-icon` | Mixin applied to the icon inside the card | `{}`
`--export-target-selector-label` | Mixin applied to the card's label | `{}`
`--error-toast` | Mixin applied to the error toast message | `{}`
`--warning-primary-color` | Error toast background color | `#FF7043`
`--warning-contrast-color` | Error toast color | `#fff`



### Events
| Name | Description | Params |
| --- | --- | --- |
| export-data |  | data **Object** - Data to export. The `data` property |
type **String** - Data's content type |
file **String** - Suggested file name to use. |
| exported | Fired when the data were saved  The event is not bubbling. | __none__ |
| google-drive-data-save | Fired when Drive export was requested by the user. The event is cancellable and must be canceled to indicate that it has been handled by the provider. | content **Object** - Data to export. The `data` property |
contentType **String** - Data's content type |
file **String** - Drive file name to use. |
# export-data-selector

Data export selector view for the export module.

Provides the UI to select data stores to export data from.

Fires non-bubbling `export` event when user click on "prepare data" button.

### Example
```
<export-data-selector on-export="_exportData"></export-data-selector>
```

### Styling
`<export-data-selector>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--export-data-selector` | Mixin applied to the element | `{}`
`--export-data-selector-intro` | Mixin applied to the intro message | `{}`
`--export-data-selector-prepare-intro` | Mixin applied to the info message related to prepare data action | `{}`
`--export-data-selector-checkbox` | Mixin applied to the checkboxes | `{}`
`--export-data-selector-form` | Mixin applied to the form element | `{}`
`--export-data-selector-action-button` | Mixin applied to the action button element | `{}`

