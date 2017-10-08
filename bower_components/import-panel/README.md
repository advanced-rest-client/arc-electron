[![Build Status](https://travis-ci.org/advanced-rest-client/import-panel.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/import-panel)  

# import-panel

The data import view for ARC.

Generates the UI and support logic for importing data from a file, Google Drive,
and copy / paste action.

It requires the `arc-data-import` element to be present in the DOM to handle
`import-data` and `import-normalize` events.

### Example
```
<import-panel></import-panel>
```

### Styling
`<import-panel>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--import-panel` | Mixin applied to the element | `{}`
`--action-button` | MIxin applied to main action buttons | `{}`
`--error-toast` | Mixin applied to a toast with error message | `{}`
`--warning-primary-color` | Background color of error toast | `#FF7043`
`--warning-contrast-color`| Color of error toast | `#fff`
`--import-panel-card` | Mixin applied to a paper card like element | `{}`
`--import-data-inspector` | Mixin applied to the element | `{}`
`--action-button` | Mixin applied to the primary acction button | `{}`
`--import-data-inspector-meta-color` | Color of the meta data property | `{}`
`--import-table` | Mixin applied to a table with data import | `{}`
`--import-table-opened` | Mixin applied to a table with data import when opened | `{}`
`--import-table-title` | Mixin applied to the title of the import table | `{}`
`--import-table-header` | Mixin applied to data table header with selecyion options | `{}`
`--import-table-method-label` | Mixin applied to the HTTP method label container | `{}`
`--import-table-selection-counter` | Mixin applied to a table selection counter label | `{}`
`--import-table-list-item` | Mixin applied to data table's items | `{}`

# import-data-inspector

An element to display tables of import data.

It accept normalized ARC import object received from `arc-data-import` element.

### Example

```html
<import-data-inspector data="[[arcImport]]" on-cancel="cancel" on-import="importData"></import-data-inspector>
```

### Styling
`<import-panel>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--import-data-inspector` | Mixin applied to the element | `{}`
`--action-button` | Mixin applied to the primary acction button | `{}`
`--import-data-inspector-meta-color` | Color of the meta data property | `{}`
`--import-table` | Mixin applied to a table with data import | `{}`
`--import-table-opened` | Mixin applied to a table with data import when opened | `{}`
`--import-table-title` | Mixin applied to the title of the import table | `{}`
`--import-table-header` | Mixin applied to data table header with selecyion options | `{}`
`--import-table-method-label` | Mixin applied to the HTTP method label container | `{}`
`--import-table-selection-counter` | Mixin applied to a table selection counter label | `{}`
`--import-table-list-item` | Mixin applied to data table's items | `{}`



### Events
| Name | Description | Params |
| --- | --- | --- |
| cancel | Fired when the user cancels the import action.  The event does not bubbles. | __none__ |
| import | Fired when the user accepts the import Event's detail object is ARC import data object.  The event does not bubbles. | __none__ |
# import-auth-data-table

An element to display list of authorization data to import.

# import-cookies-table

An element to display list of cookies to import.

# import-headers-sets-table

An element to display list of headers sets to import.

# import-history-table

An element to display list of history objects to import.

# import-requests-table

An element to display list of request objects to import.

# import-url-history-table

An element to display list of URLs hsitory to import.

# import-variables-table

An element to display list of variables to import.

# import-websocket-url-history-table

An element to display list of URLs hsitory to import.

