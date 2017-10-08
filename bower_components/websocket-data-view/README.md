[![Build Status](https://travis-ci.org/advanced-rest-client/websocket-data-view.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/websocket-data-view)  

# websocket-data-view

`<websocket-data-view>` A web socket communication log viewer for web socket request panel

### Example
```
<websocket-data-view></websocket-data-view>
```

### Styling
`<websocket-data-view>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--websocket-data-view` | Mixin applied to the element | `{}`



### Events
| Name | Description | Params |
| --- | --- | --- |
| export-data | Fired when data export was requested. The event is cancelable. If the event wasn't canceled then the element will use web download as a fallback method. | data **(Object&#124;Blob)** - The data to export. |
type **String** - `data` content type |
| message-cleared | Fired when the user clears the messages in the UI. The event does not bubble. | __none__ |
