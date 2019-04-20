# Workspaces

A workspace represents a list of requests rendered in a single workspace view and configuration applied to this requests. The workspace configuration overrides global application configuration. However, the same configuration applied to the request obejct overrides workspace settings.

## Data structure

This data structure is supported since ARC 14.0.0.

### Example

```json
{
  "kind": "ARC#Workspace",
  "version": "0.0.1",
  "published": "2019-04-19T22:18:37.475Z",
  "provider": {
    "url": "https://page.domain.com",
    "name": "John Doe",
    "email": "jdoe.salesforce.com"
  },
  "requests": [
    {
      "headers": "Accept: application/ld+json\ncontent-length: 406",
      "method": "POST",
      "payload": "{...}",
      "url": "http://api.domain.com/endpoint",
      "_isErrorResponse": false,
      "_response": {
        "status": 200,
        "statusText": "OK",
        "headers": "Content-Type: application/json\r\nTransfer-Encoding: chunked",
        "url": "http://api.domain.com/endpoint/redirect.json",
        "payload": "Hello World."
      },
      "_responseMeta": {
        "loadingTime": 366.39999999897555,
        "responseIsXhr": false,
        "timing": {
          "dns": 46.80000000007567,
          "connect": 158.0999999996493,
          "receive": 2.3999999993975507,
          "send": 1.5999999995983671,
          "ssl": -1,
          "wait": 157.50000000025466
        },
        "sourceMessage": "GET /endpoint HTTP/1.1\r\nHost: api.domain.com\r\n\r\n"
      }
    }
  ],
  "selected": 0,
  "environment": "DevX",
  "variables": {
    "var": "value"
  },
  "config": {
    "requestTimeout": 120,
    "validateCertificates": true,
    "followRedirects": true,
    "sentMessageLimit": 1024,
    "workspaceReadOnly": true,
    "variablesDisabled": false,
    "nativeTransport": false
  },
  "webSession": {
    "webSessionUrl": "https://app.domain.com/login"
  },
  "auth": {
    "oauth2RedirectUri": "https://auth.domain.com/callback.html"
  },
  "hosts": ["Host"]
}
```

### Description

#### kind

The kind of data struct. For workspace it is always `ARC#Workspace`.

#### version

__Optional.__ `String`. The version of the workspace file. Any string. It is rendered in workspace info dialog.

#### published

__Optional.__ `String`. Workspace publication date as ISO date string.

#### provider

__Optional.__ `Object`. Author info.
See `Provider` description for item details.

#### requests

`Array<Object>`. List of requests to render in the workspace view. See `Request` description for item details.

#### selected

__Optional.__ `Number`. The index of an item in the requests array to be seleced in the view.

#### environment

__Optional.__ `String`. Name of the selected environment. In ARC environments are generated dynamically by name rather by ID. If the environment does not exists it will create a dynamic environment that will become persistant once a variable is added to it.

#### variables

__Optional.__ `Object`. A map of key-value pairs where key is variable name and value is variable value. Values can contain other variables in form of `${varName}`.

#### hosts

The hosts table. See [Host object](host-object.md) document for more details.

#### config

__Optional.__ Workspace configuration. Values defined in this struct are design to override global application settings. This allows to apply application configuration but only on workspace level.
See `Config` description for item details.

#### webSession

__Optional.__ Configuration option related to setting up a web session and cookie management.
See `WebSession` description for item details.

#### auth

__Optional.__ Configuration option related to request authorization.
See `Auth` description for item details.


### Provider

#### url

__Optional.__ `String`. Author website URL.

#### name

__Optional.__ `String`. Author name.

#### email

__Optional.__ `String`. Author email.


### Auth

#### oauth2RedirectUri

__Optional.__ `String`. Auth2 redirect URI to be used with request editor.
The URL may be fake but valid.

### WebSession

#### webSessionUrl

__Optional.__ `String`. An URL to be placed in the URL input when iniciating web session ("Login to a web service" menu).

### Config

#### requestTimeout

__Optional.__ `Number`. The number of seconds after which the request will time out. `0` value means no timeout. Only positive integer and zero is allowed.

#### validateCertificates

__Optional.__ `Boolean`. Control whether the app should validate SSL certificates.

#### followRedirects

__Optional.__ `Boolean`. Control whether the app should follow HTTP redirects.

#### workspaceReadOnly

__Optional.__ `Boolean`. When `true` then loaded workspace file won't be overriten by user interaction (normally every interaction like making a request, changes workspace file to store current state).

#### sentMessageLimit

__Optional.__ `Number`. Number of bytes that limits the HTTP request message to be stored in the application (and also workspace file).
Normally ARC does not impose any limitations for data size. However sometimes it may be required for very big requests that may influence performance.

#### variablesDisabled

__Optional.__ `Boolean`. When `true` variables evaluation is disabled for any request made from the workspace.

#### nativeTransport

__Optional.__ `Boolean`. When `true` it instructs the app to use native node HTTP/HTTPS module instead of ARC's HTTP transport library.

### Request

The request object contains the same properties as [Arc Request](request.md) object. Below is the description of additional properties used in workspace state.

#### _response

__Optional.__ `Object`. An object describing a response to be rendered with the request at load.

___response.status__

`Number`. Response status code.

___response.statusText__

`String`. Response status message.

___response.headers__

`String`. HTTP headers string

___response.url__

`String`. The final URL of the request. When the request was redirected this is the last redirect URL. Otherwise it is request URL.

___response.payload__

`String|Object`. Response message.
When string it will be rendered without any processing (unless JSON or XML value recognized by `content-type` header).

When object it must contain `type` and `data` properties. Currently only `Buffer` type is supported as a stringified value of Node's Buffer. The data is an array of byte char codes.


#### _responseMeta

__Optional.__ `Object`. Responses metadata that helps render response view.

___responseMeta.loadingTime__

`Number`. Total time of sending the request and receiving the response.

___responseMeta.responseIsXhr__

__Optional.__ `Boolean`. When `true` ARC renders simplified view of the response panel - without timings and redirects. In this case corresponding `redirects` and `timing` properties are unused.

___responseMeta.timing__

__Optional.__ `Object`. A HAR 1.2 timings object. It contains values of request timings data: `connect` as a time used to make a connection, `receive` as time of receiving data, `send` as time of transmitting the HTTP message, `wait` as a time of waiting for the message to arrive, `dns` as a time needed for DNS lookup, and `ssl` as a time needed for SSL hadshake. If any value is not available `-1` should be used.

This values are rendered in response timings panel.
