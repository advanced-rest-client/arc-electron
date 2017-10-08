[![Build Status](https://travis-ci.org/advanced-rest-client/app-log-viewer.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/app-log-viewer)  

# app-log-viewer

A dialog to display app logs collected by `app-logger` element.

### Example
```
<app-log-viewer opened></app-log-viewer>
```

### Styling
`<app-log-viewer>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--app-log-viewer` | Mixin applied to the element | `{}`
`--app-log-viewer-color` | General font color applied to the element | `rgba(0, 0, 0, 0.87)`
`--app-log-viewer-title` | Mixin applied to the title | `{}`
`--app-log-viewer-buttons` | Mixin applied to dialog's buttons | `{}`
`--app-log-viewer-log-color` | Color of "log" level message | ``
`--app-log-viewer-log-bg-color` | Background color of "log" level message | ``
`--app-log-viewer-info-color` | Color of "log" level message | `--paper-blue-700`
`--app-log-viewer-info-bg-color` | Background color of "log" level message | `--paper-blue-50`
`--app-log-viewer-warn-color` | Color of "log" level message | `--paper-brown-700`
`--app-log-viewer-warn-bg-color` | Background color of "log" level message | `--paper-yellow-100`
`--app-log-viewer-error-color` | Color of "log" level message | `--paper-brown-800`
`--app-log-viewer-error-bg-color` | Background color of "log" level message | `--paper-red-50`
`--app-log-viewer-log-details` | Mixin apllied to log details | `{}`
`--app-log-viewer-log-stack` | Mixin applied to the stack message | `{}`
`--app-log-viewer-time-color` | Color of the `data-time` element | `--paper-grey-700`

