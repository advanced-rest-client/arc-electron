[![Build Status](https://travis-ci.org/advanced-rest-client/headers-editor-status.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/headers-editor-status)  

# headers-editor-status

`<headers-editor-status>` A status bar for the headers editor

Can display computed size of the headers and validation status of
the headers editor. 

### Example
```
<headers-editor-status message="Content-Type is missing" invalid size="12"></headers-editor-status>
```

### Styling
`<headers-editor-status>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--headers-editor-status` | Mixin applied to the element | `{}`,
`--headers-editor-status-color` | Color of the message nd the icon | `--primary-valid-color` or `#48982A`
`--headers-editor-status-error-color` | Color of the error message | `--primary-error-color` or `rgba(255, 0, 0, 0.54)`
`--headers-editor-status-counter-color` | Color of the bytes counter | `rgba(0, 0, 0, 0.54)`
`--headers-editor-status-message` | Mixin applied to the message container | `{}`
`--arc-font-body1` | Theme mixin, applied to text elements | `{}`

