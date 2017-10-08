[![Build Status](https://travis-ci.org/advanced-rest-client/chrome-socket-request.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/chrome-socket-request)  

# chrome-socket-request

Wrapper element for the SocketFetch libraty to make a HTTP connection in Chrome

*This element is designed for ARC only**

### Example
```html
<chrome-socket-request></chrome-socket-request>
<script>
var xhr = document.querySelector('chrome-socket-request');
xhr.addEventListener('report-response', e => {
  console.log(e.detail);
});
xhr.send({})
.then(() => {
  // request finished.
});
</script>
```



### Events
| Name | Description | Params |
| --- | --- | --- |
| before-redirect | Fired when redirect is about to occur.  This event ins cancelable and if `preventDefault()` has been called on this event then the request is aborted. | url **String** - The url where the request is being redirected |
id **String** - Request ID generated on send. |
| headers-received | Fired when headers were received from the server.  This event ins cancelable and if `preventDefault()` has been called on this event then the request is aborted. | value **String** - Received headers string |
id **String** - Request ID generated on send. |
| report-response | Fired when the response is fully processed and ready to be reported in the UI. The detail object contains immutable properties so any event handler can't change it's values. To change response data handle `response-ready` event.  The event has the same properties as `response-ready` event. | __none__ |
| request-first-byte-received | Fired when socket library reported receiving first byte of information from server. | id **String** - Request ID generated on send. |
| request-headers-sent | Fired when headers were sent. | bytesWritten **Number** - Number of bytes sent to the socket |
id **String** - Request ID generated on send. |
| request-load-end | Fired when response is loaded. | id **String** - Request ID generated on send. |
| request-load-start | Fired when the message has been sent to the server. | id **String** - Request ID generated on send. |
| response-ready | Event fired when the transport library finished a request and both request and response objects are ready.  Event is fired just before reporting the response to the user. It can be cancelled and the response won't be presented to the user. The element that cancels the response should take an action that is visible to the user (eg, redirect, chain request etc). This event is synchronous so any async work on the response object won't be possible.  The request and response are Fetch's API Request and Response object. Body from both of the objects can be read only once so any handler that have to read the response / request body have to call `clone()` function that returns new `Body` (either `Request` or `Response`) object that can be read. If the handler use the body without cloning the object the response won't be reported to the user and response view will report an error. | request **Request** - The request object as defined in the Fetch API spec. |
response **Response** - The response object as defined in the Fetch API spec. |
isXhr **Boolean** - If not set the element assumes it's true. Indicates if the transport method doesn't support advanced timings and redirects information. See below. |
error **Error** - When the request / response is errored (request.ok equals false) then the error object should be set with the human readable message that will be displayed to the user. |
loadingTime **Number** - The response full loading time |
timings **Object** - HAR 1.2 timings object |
redirectTimings **Array** - Array of `timings` objects with timings of each redirect. Elements in the array are ordered and each item corresponds to the one in `redirects` array |
redirects **Array** - Array of `Response` objects. Elements in the array are ordered and each item corresponds to the one in `redirectsTimings` array. Additionally the Response item should have a `requestUrl` property which is the URL to which the redirected request went to. |
sourceMessage **String** - A source message that has been sent to the server. |
auth **Object** - Returned by the transport library auth object |
id **String** - Request ID generated on send. |
