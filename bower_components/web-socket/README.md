
The `web-socket` is an element to make a connection to the socket using web sockets API.

Example:

```
<web-socket
  message="[[myMessage]]"
  retrying="{{isRetrying}}"
  retryingTime="{{timeToRetry}}"
  on-message="_messageReceived"
  on-disconnected="_onDisconnected"
  on-connected=""></web-socket>
```



### Events
| Name | Description | Params |
| --- | --- | --- |
| connected | An event fired when connection to the socket has been made. | __none__ |
| disconnected | An event fired when connection to the server has been lost. | __none__ |
| error | Fired when error occured. | error.null **Error** -  |
| message | An event when a message was sent from the server to the client. The detail attribute of the event will contain a message property that will contain received message. | data.null **(String&#124;ArrayBuffer&#124;Blob)** -  |
