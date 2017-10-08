[![Build Status](https://travis-ci.org/advanced-rest-client/error-message.svg?branch=master)](https://travis-ci.org/advanced-rest-client/error-message)  

# error-message

`<error-message>` A standarized error information

### Example
```
<error-message icon="warning">
  <p>This is a warning!</p>
</error-message>
```

### Styling
`<error-message>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--error-message` | Mixin applied to the element | `{}`
`--error-message-icon-color` | Fill color of the icon. Only if an icon is a SVG icon. | `rgba(0, 0, 0, 0.56)`
`--error-message-icon` | Mixin applied to the icon | `{}`
`--error-message-text` | Mixin applied to the text message. | `{}`
`--error-message-color` | Color of the message text. | `--google-red-500`

