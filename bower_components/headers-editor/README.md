[![Build Status](https://travis-ci.org/advanced-rest-client/headers-editor.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/headers-editor)  

# headers-editor

`<headers-editor>` Headers editor for the HTTP request editor panel

### Example
```
<headers-editor></headers-editor>
```

### Styling
`<headers-editor>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--headers-editor` | Mixin applied to the element | `{}`
`--body-editor-actions-container` | Mixin applied to action buttons list container. | `{}`
`--body-editor-panel-button-active` | Background color if the toggle button | `#e0e0e0`



### Events
| Name | Description | Params |
| --- | --- | --- |
| content-type-changed | Fired when the content type header has been set / updated. | value **String** - New Content type. |
| request-headers-changed | Fired when the editor value change | value **String** - Current editor value. |
