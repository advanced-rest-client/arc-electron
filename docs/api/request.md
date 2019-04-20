# ARC Request

An object describing a request in request editor.

```json
{
  "url": "http://domain.com",
  "method": "POST",
  "headers": "Content-Type: application/json",
  "payload": "{\n  \"test\": true\n}",
  "auth": "Auth",
  "requestActions": "RequestAction",
  "responseActions": ["ResponseAction"],
  "_state": {
    "collapseOpened": false,
    "selectedTab": 1,
    "urlOpened": false
  }
}
```

## Properties

### url

`String`. __Required__

The request URL.

### method

`String`. __Required__

HTTP method name.

### headers

`String`. __Optional__.

HTTP headers string as defined in [rfc7230](https://httpwg.org/specs/rfc7230.html#header.fields).

### payload

`String` __Optional__.

HTTP message to send with the request.

Note, that ARC removes the payload from `GET` and `HEAD` requests.

### auth

`Object`. __Optional__.

Authorization configuration for the request. See [Auth object](auth-object.md) document for more information.

### requestActions

`Object`. __Optional__.

Actions to be executed before the request is executed. See [Request Actions](request-action.md) document for more information.

### responseActions

`Array`. __Optional__.

List of actions to be executed after the response is ready. See [Response Actions](response-action.md) document for more information.

### _state

`Object`. __Optional__.

The request editor UI state control options.

___state.collapseOpened__

`Boolean`. When `true` the parameters editor (headers, body, authorization, actions) is collapsed.

__selectedTab__

`Number`. Index of selected request tab.

__urlOpened__

`Boolean`. When `true` the URL detailed editor is opened.
