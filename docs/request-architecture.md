# HTTP request architecture

When the user press "send" in the request editor UI a DOM event of an instance of a `CustomEvent` is generated with the details of the request to make. This event is propagated from the editor up to the global object.

This event is handled by the `src/app/scripts/arc/Request` class. Making an HTTP request is a 3-step process. Fist step is to prepare the request configuration, then the message is being transported to the remote machine, and finally a post-request logic is executed. After all these steps the response is reported back to the UI.

## Preparing the request

The preparing process is handled by the `@advanced-rest-client/request-engine` module. This is where the current environment is applied to the request properties. This step is made before any other logic is executed.

Next, the request actions are executed from the request editor UI. These are used defined actions that can alter the state of the request or the application.

Finally, ARC's modules are executed in order of registration. By default these modules add cookies to the request from the cookies storage, process authorization data (these are applied to the request here), or apply cached authorization data (like basic auth header when provided by the user before).

## Transporting the request

The logic responsible for the transport is defined in the `@advanced-rest-client/electron-request` module. It has two main classes; one to make HTTP request using Node's internal engine and the second is to make HTTP transport directly on a socket. With the second option an internal HTTP parser is used to process the response. Both classes produce the same output which is ARC response object. It has detailed information about the transport:

- original request
- transported request - the one with the final configuration (headers/query) applied to it
- response data - a basic response information like body, status, message, and the body
- redirects data - for each redirect during the process
- timings information - HAR 1.2 timings for the request and all redirects.

Additionally the transport dispatches events for each important part of the request like the first byte, headers received, before redirect, etc. These events are translated into DOM events and dispatched on the global object.

The transport is called from the `src/app/scripts/arc/Request` class.

## Post-request logic

After the response is ready and there is was error during the transport (other than an HTTP error) then a post request logic is executed. This is handled by the same `@advanced-rest-client/request-engine` module as in the request preparation process. In this process:

- response actions are executed - actions from the request editor UI
- response is added to the history, when enabled
- internal modules are executed that handles authorization responses
