[![Build Status](https://travis-ci.org/advanced-rest-client/websocket-history.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/websocket-history)  

# websocket-history

A web socket connections history view for ARC.

### Example
```
<websocket-history items="[...]"></websocket-history>
```

### Styling
`<websocket-history>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--websocket-history` | Mixin applied to the element | `{}`
`--arc-font-subhead` | Mixin applied to the element's title | `{}`
`--websocket-history-date-time` | Mixin applied to the `date-time` element | `{}`



### Events
| Name | Description | Params |
| --- | --- | --- |
| socket-url-changed | Fired when the user requested to conenct to a socket. | value **string** - The URL of the socket. |
