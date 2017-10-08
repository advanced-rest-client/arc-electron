[![Build Status](https://travis-ci.org/advanced-rest-client/files-payload-editor.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/files-payload-editor)  

# files-payload-editor

`<files-payload-editor>` A request body editor to add files as a payload.
With this element the user can select single file that will be used in the request body.

As other payload editors it fires `payload-value-changed` custom event when value change.

The element can be used in forms when `iron-form` is used. It contains validation methods to
validate user input.

### Example
```
<files-payload-editor></files-payload-editor>
```

### Styling
`<files-payload-editor>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--files-payload-editor` | Mixin applied to the element | `{}`
`--files-payload-editor-file-item` | Mixin applied to a selected file item | `{}`
`--files-payload-editor-file-trigger-color` | Color of the file input | `--accent-color` or `#FF5722`
`--files-payload-editor-file-summary-color` | Color of the selected file summary | `rgba(0,0,0,0.74)`
`--files-payload-editor-selected-file-name-color` | Selected file name label color | `rgba(0,0,0,0.74)`
`--files-payload-editor-selected-file-icon-color` | Color of the icon in the selected file section | `--accent-color` or `#2196F3`
`--arc-font-body1` | Theme mixin, applied to text elements | `{}`
`--inline-fom-action-icon-color` | Theme variable, color of the delete icon | `rgba(0, 0, 0, 0.74)`
`--inline-fom-action-icon-color-hover` | Theme variable, color of the delete icon when hovering | `--accent-color` or `rgba(0, 0, 0, 0.74)`



### Events
| Name | Description | Params |
| --- | --- | --- |
| payload-value-changed | Fired when the value of the control change. | value **Blob** - Selected file or undefined if no file selected. |
