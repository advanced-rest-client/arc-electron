[![Build Status](https://travis-ci.org/advanced-rest-client/websocket-request.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/websocket-request)  

# websocket-request

Web socket request panel.

Contains an UI and logic to make a connection to a websocket server and send and receive messages.

### Example
```
<websocket-request messages="{{messages}}" connected="{{connected}}"></websocket-request>
```

### Styling
`<websocket-request>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--websocket-request` | Mixin applied to the element | `{}`
`--websocket-request-url-input` | Mixin applied to the URL input | `{}`
`--websocket-request-connection-info` | Mixin applied to the message lable when websocket is connected | `{}`
`--websocket-request-connected-url-label` | Mixin applied to the URL label when connected | `{}`
`--websocket-request-file-drop` | Mixin applied to the `<file-drop>` element | `{}`

