[![Build Status](https://travis-ci.org/advanced-rest-client/arc-status-bar.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/arc-status-bar)  

# arc-status-bar

A status bar for the Advanced REST Client's request panel

### Example
```
<arc-status-bar message="Hello status!"></arc-status-bar>
```

### Styling
`<arc-status-bar>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--arc-status-bar` | Mixin applied to the element | `{}`
`--arc-status-bar-background-color` | Background color of the element. | `#eee`
`--arc-status-bar-message-color` | Color of the message on status bar | `rgba(0, 0, 0, 0.54)`
`--arc-status-bar-environment-color` | Color of the environment selector section font color | `{}`
`--arc-status-bar-message-color` | Color of the status message | `{}`
`--arc-status-bar-message` | Mixin applied to the status message. | `{}`
`--arc-status-bar-env-selector-max-width` | Max width of the environment selector | `120px`

