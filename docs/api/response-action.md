# ResponseAction

An object representing an action to be executed after the request is executed.
When the action run all response properties are available.

Response actions allows to lookup for a value in all request/response fileds and assign veriables from the data. This allows for semi-automation when executing a request. For example authorization request returns auth token which can be then passed to a variable and then used with another request.

## Example

```json
{
  "source": "response.url.hash.access_token",
  "action": "store-variable",
  "destination": "AnypointToken",
  "enabled": true,
  "conditions": [{
    "source": "response.status",
    "operator": "equal",
    "condition": "200",
    "enabled": true
  }]
}
```

## Description

### source

`String`.

First thing to do to configure the request action is to tell the application where to look for the data. The source represents a path to the data separated by a dot.

First part of the path is either `request` or `response`.

Other values depends on which data source is being used.

#### request source

Allows to access request properties: `url`, `headers`, `body`.

#### response source

Allows to access response properties: `url`, `status`, `headers`, `body`.

#### Accessing the data

##### url data

The application uses the URL for last response (it can be more than one response if there was a redirection).
You can specify following paths for url:

-   `host` - Returns the host value, e.g. `api.domain.com`
-   `protocol` - Returns URL's protocol, e.g. `https:`
-   `path` - URL's path, e.g. `/path/to/resource.json`
-   `query` - Returns full query string, e.g. `version=1&page=test`
-   `query.[any string]` - Returns the value of a query parameter. For `query.version` it would return `1`
-   `hash` - Returns everything that is after the `#` character, e.g. `access_token=token&state=A6RT7W`
-   `hast.[any string]` - It treats hash as query parameters and returns the value of the parameter. For `hash.access_token` it would return `token`

__Examples__

URL: `https://auth.domain.com/auth/oauth-popup?version=2&remember=true#access_token=z8a1d97c-c4e6-488f-8ac0-a32e3d749f49&token_type=bearer&state=Y2I1CD`

```javascript
path = 'response.url.host' // auth.domain.com
path = 'response.url.protocol' // https:
path = 'response.url.path' // /auth/oauth-popup
path = 'response.url.query' // version=2&remember=true
path = 'response.url.query.version' // 2 (String!)
path = 'response.url.hash' // access_token=z8a1d97c-c4e6-488f-8ac0-a32e3d749f49&token_type=bearer&state=Y2I1CD
path = 'response.url.hash.access_token' // z8a1d97c-c4e6-488f-8ac0-a32e3d749f49
```

##### headers data

Allows to access headers data. The application ignores character case.

__Examples__

Headers list:

```
Content-Type: application/json
Content-Length: 100
Connection: close
```

```javascript
path = 'response.headers.content-type' // application/json
path = 'response.headers.Content-length' // 100 (it is String!)
```

##### status data

There's no additional accessors. The status code is a number returned by the server.

__Examples__

```
HTTP/1.1 200 OK
```

```javascript
path = 'response.status' // 200
```

##### body data

Currently only JSON and XML responses are supported. Also, XML has to be valid XML string or the parser will not produce the value.

For JSON types simply specify path to the data. To access array values use dot with index notation, e.g.: `data.0.name`. This will get value for `name` property for the first item on the data array.

ARC allows to iterate over arrays for lookup the value. See `Iteratiors` section below.

__Example for JSON__

```json
{
  "property": {
    "otherProperty": {
      "value": 123456
    }
  }
}
```

```javascript
path = 'response.body.property.otherProperty.value' // 123456
```

Note, `Boolean` and `Number` values are cast to the corresponding type.

__Example for XML__

```xml
<?xml version="1.0"?>
<people xmlns:xul="some.xul">
  <person db-id="test1">
    <name first="george" last="bush" />
    <address street="1600 pennsylvania avenue" city="washington" country="usa"/>
    <phoneNumber>202-456-1111</phoneNumber>
  </person>
</people>
```

```javascript
path = 'response.body.people.person.0.phoneNumber' // 202-456-1111
```

__Accessing XML attribute value__

XML path supports attr(ATTRIBUTE NAME) function that returns the value of the attribute:

```javascript
path = 'response.body.people.person.0.name.attr(first)' // george
```

### action

`String`

`store-variable` to save value in the datastore or `assign-variable` to store variable in memory only. In memory values always overrides stored values.

### destination

`String`

Name of the variable to update.

### enabled

`Boolean`

Whether or not the action is enabled. It is always rendered in the UI but excludes it from the execution.
