[![Build Status](https://travis-ci.org/advanced-rest-client/authorization-data-saver.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/authorization-data-saver)  

# authorization-data-saver


An element responsible for applying authorization data to the request before sending it to a server
and requesting credentials data from the user.
It contains UI dialogs to request data from the user for Basic and NTLM authorization. It listens
for `before-request` and `response-ready` events as defined
[in this issue](https://github.com/jarrodek/ChromeRestClient/issues/1010).

The element's API is based on custom events fired by the request editor (controller). There's no
need to directly call any function or set a property. It adds event listeners to the `window`
object. It should be placed as close to the `<body>` as possible.

The `before-request` event is handled synchronously.

### Example
```
<authorization-data-saver></authorization-data-saver>
```

### Styling

See [auth-dialogs](https://github.com/advanced-rest-client/auth-dialogs) for styling options.

### Demo

See [auth-dialogs](https://github.com/advanced-rest-client/auth-dialogs) for dialogs demos.



### Events
| Name | Description | Params |
| --- | --- | --- |
| ntlm-data-changed | Fires when the NTLM authorization data are received from user input. The request builder element should intercept this event and attach it to the next request. | __none__ |
| request-header-changed | Fired when the header value has changed. | name **String** - Name of the header |
value **String** - Value of the header |
| request-headers-changed | Fired when the request headers changed because of applied authorization. | value **String** - New headers value. |
| resend-auth-request | Fired when the user accepted authorization dialog, the request object has been altered and the request is ready to be called again. | __none__ |
