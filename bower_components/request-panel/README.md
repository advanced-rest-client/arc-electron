[![Build Status](https://travis-ci.org/advanced-rest-client/request-panel.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/request-panel)  

# request-panel

A full request and response view for the Advanced REST client

# Example

```
<request-panel handlers-timeout="2000"></request-panel>
```

Note: This element internally uses `variables-evaluator` element but it doesn't
use `variables-manager` and it soulf be included into the app if variables should
be evaluated correctly.

## Request lifecycle

Detailed description: <https://github.com/jarrodek/ChromeRestClient/issues/1010>

### before-request event

Before sending a request the `before-request` custom event is fired. The event contains the `promises` array on the detail object where all promises should be kept. Handlers can modify any part of the request message.

This event is cancellable. If the event has been cancelled by any of the listeners then the request fails. Handlers may set a reason property on the event's detail object to display a reason to the user.

The handler have a timeout set from the `handlers-timeout` attribute of the element to complete any scheduled tasks. If a handler requires more time to execute (eg. request debugger) it should set a `timeout` property on the Promise object. It is a non-normative property for this object but it will help control the workflow properly. The request will be fired after the number of milliseconds of the highest timeout value. If 0 is set then the request will be halted until `continue-request` event is fired.

The request data in the event are already evaluated by the `variables-evaluator`
element so handlers receive final request parameters.

#### Properties

The details object has following properties:

-   `url` (`string`)- Request URL.
-   `headers` (`string`) - Headers to be send.
-   `payload` (`string`) - Message body if the request can carry a body. GET and HEAD request will ignore this property.
-   `method` (`string`) - HTTP method.
-   `promises` (`array`) - An array where promises must be added
-   `reason` (`string`) - reason of cancelling the event.
-   `auth` (`object`) - an authorization data that will be passed to the transport library (`socket-fetch`)
-   `id` (`String`) - Request ID. It is an UUID for the request. The id is reported back by the transport library in all its events.

### transport-request

A non-cancelable, immutable request object.
This event is meant to be handled by the transport library that is attached to the DOM and handles the event.

#### Properties

The details object has following properties:

-   `url` (`string`)- Request URL.
-   `headers` (`String`) - Headers to be send.
-   `payload` (`String`) - Message body if the request can carry a body. GET and HEAD request will ignore this property.
-   `method` (`String`) - HTTP method.
-   `auth` (`Object`) - an authorization data that will be passed to the transport library (`socket-fetch`)
-   `id` (`String`) - Request ID. It is an UUID for the request. The id is reported back by the transport library in all its events.

### response-ready event

Event fired when the transport library finishes a request and both request and response object are ready.
Event is fired just before reporting the response to the user.  It can be cancelled but the response won't be presented to the user. The element that cancels the response should take an action that is visible to the user (eg, redirect, chain request etc). This event is synchronous so any async work on the response object won't be possible.

The request and response are Fetch's API `Request` and `Response` object. Body from both of the objects can be read only once so any handler that have to read the response / request body have to call `body.clone()` function that returns new `Body` object that can be read. If the handler use the body without cloning the object the response won't be reported to the user.

#### Properties

-   `request` (`Request`) - The request object as defined in the Fetch API spec.
-   `response` (`Response`) - The response object as defined in the Fetch API spec.
-   `isXhr` (`Boolean`) - If not set the element assumes it's true. Indicated if the transport method doesn't support advanced timings and redirects information.
-   `error` (`Error`) - When the request / response is errored (`request.ok` equals `false`) then the error object should be set with the human readable message that will be displayed to the user.
-   `loadingTime` (`Number`) - The response full loading time
-   `timings` (`Object`) - HAR 1.2 timings object
-   `redirect-timings` (`Array`) - Array of `timings` objects with timings of reach redirect. Elements in the array are ordered and each item corresponds to the one in `redirects` array
-   `redirects` (`Array`) - Array of `Response` objects. Elements in the array are ordered and each item corresponds to the one in `redirects-timings` array. Additionally the Response item should have a `requestUrl` property which corresponds to an URL to which the redirected request went to.
-   `sourceMessage` (`String`) - A source message that has been sent to the server.
-   `auth` (`Object`) - Returned by the transport library auth object

### headers-received event

Cancellable event fired by the transport library after headers has been received
from the server. All work must be done synchronously.
If the event is cancelled then the request is canceled. Handlers should take a
proper action action visible to the user (redirect, display UI).

#### Properties

-   `value` (`Headers`) Headers received from the server as a Fetch's [headers](https://developer.mozilla.org/en-US/docs/Web/API/Headers) object

### before-redirect event

Cancelable event fired by the transport library when a redirect about to occur.
All work must be done synchronously.
If the event is cancelled then the request is canceled. Handlers should take a
proper action action visible to the user (redirect, display UI).

### report-response

A non-cancelable, immutable response object with properties the same as the `response-ready` event. This event is intended to the request-panel only to report final response after applying any transformation on the response at `response-ready` event.
Because browser can't guarantee event handlers execution order this shouldn't be done in the `response-ready` event or otherwise this would influence the performance (the response panel would compute the response each time the object change).

## Styling

`<request-panel>` provides the following custom properties and mixins for styling:

Custom property|Description|Default
---------- | ------------------ | ------
`--request-panel`|Mixin applied to the element|`{}`
`--request-panel-main-content` | Mixin applied to the container for the request and the resposnse panels | `{}`
`--request-panel-progress-color` | Color of the progress bar that indicate loading state | `#00A2DF`
`--request-panel-progress` | Mixin applied to the progress bar | `{}`
`--request-panel-status-bar` | Mixin applied to the status bar | `{}`



### Events
| Name | Description | Params |
| --- | --- | --- |
| before-request | Before sending the request the `before-request` custom event is fired. The event contains the `promises` array on the detail object where all promises should be kept. Handlers can modify any part of the request message.  This event is cancellable. If the event has been cancelled by any of the listeners then the request fails. Handlers may set a reason property on the event's detail object to display a reason to the user.  The handler have a timeout set from the `handlers-timeout` attribute of the element to complete any scheduled tasks. If a handler requires more time to execute (eg. request debugger) it should set a `timeout` property on the Promise object. It is a non-normative property for this object but it will help control the workflow properly. The request will be fired after the number of milliseconds of the highest timeout value. If 0 is set then the request will be halted until `continue-request` event is fired. | url **String** - Request URL. |
headers **String** - Headers to be send. |
payload **String** - Message body if the request can carry a body. GET and HEAD request will ignore this property. |
method **String** - HTTP method. |
promises **Array** - An array where promises must be added |
reason **String** - The reason of cancelation. Must be set by the handler. |
auth **?Object** - An authorization data that will be passed to the transport library (`socket-fetch`) |
| transport-request | A non-cancelable, immutable request object. This event is meant to be handled by the transport library that is attached to the DOM and handles the event. | url **String** - Request URL. |
headers **String** - Headers to be send. |
payload **String** - Message body if the request can carry a body. GET and HEAD request will ignore this property. |
method **String** - HTTP method. |
auth **?Object** - An authorization data that will be passed to the transport library (`socket-fetch`) |
