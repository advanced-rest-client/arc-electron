---
description: >-
  This documentation explain what is and how to use request actions in Advanced
  REST Client.
---

# Request actions

Create request actions to dynamically assign variables when the response from the endpoint is ready. ARC gives you convenient editor to create actions that are performed each time the request is send.

Actions can be conditional. Create a condition rule for the request action and the action is performed only if all conditions are meet.

This help page is to describe in details how to use request actions and conditions.

![Request actions overview](../.gitbook/assets/image%20%281%29.png)

There are two groups of actions that can be performed during the request

* request actions - executed before the connection is made
* response actions - executed when response is ready

## Request actions

Currently request action only allows you to set a value on a variable before the request is made. This value is not stored in the data store bur rather in memory only. This means when you restart the application the variable value will be restored to it's original value.

![Request action with definition](../.gitbook/assets/image%20%2838%29.png)

In this example a `myAccessToken` variable is set to empty string before the request is executed.

## Response action

Response actions are more complex as they are made to extract data from the response and assign the value to a variable or store the variable in the data store.

The data can be extracted from each part of the request/response parts of the HTTP message: URL, headers, status line, and the payload.

### Extracting the data from the response

You need to tell the application where to look for the data that you want to extract from the response. In the editor you can select either `Request` or `Response` as a main data source. In both cases the rest of the configuration is the same but it uses either request or response values.

Next step is to define what type of data the application should query for the value. It can be `Url`, `Status code`, `Headers` or `Body`. 

Except for status code you should also define path to the data. Depending on selected type you can use different paths.

#### Path to the data

**URL**

If you not specify path the application will use the whole URL of the last response \(it can be more than one response if there was redirection\). You can specify following paths for `url`:

* host - Returns the host value, e.g. `api.domain.com`
* `protocol` - Returns URL's protocol, e.g. `https:`
* `path` - URL's path, e.g. `/path/to/resource.json`
* `query` - Returns full query string, e.g. `version=1&page=test`
* `query.[any string]` - Returns the value of a query parameter. For `query.version` it would return `1`and for `query.page` the value will be `test`.
* `hash` - Returns everything that is after the `#` character, e.g. `access_token=token&state=A6RT7W`
* `hast.[any string]` - It treats hash as query parameters and returns the value of the parameter. For `hash.access_token` it would return `token`

**Example for URL type**

`https://auth.domain.com/auth/oauth-popup?version=2&remember=true#access_token=z8a1d97c-c4e6-488f-8ac0-a32e3d749f49&token_type=bearer&state=Y2I1CD`

```javascript
path = 'host' // auth.domain.com
path = 'protocol' // https:
path = 'path' // /auth/oauth-popup
path = 'query' // version=2&remember=true
path = 'query.version' // 2 (String!)
path = 'hash' // access_token=z8a1d97c-c4e6-488f-8ac0-a32e3d749f49&token_type=bearer&state=Y2I1CD
path = 'hash.access_token' // z8a1d97c-c4e6-488f-8ac0-a32e3d749f49
```

**Headers** 

Set header name as a path and the value of the header will be extracted from request or response.

**Example for headers**

```http
Content-Type: application/json
Content-Length: 100
Connection: close
```

```javascript
path = 'content-type' // application/json
path = 'Content-length' // 100 (String!)
path = 'Connection' // close
```

**Body**

Currently only **JSON** and **XML** responses are supported. Also, XML has to be valid XML string or the parser will not produce the value.

For JSON types simply specify path to the data. To access array value use dot with index notation, for example `data.0.name`. This will get value from `name` from first item of the `data` array.

**Example for JSON**

```javascript
{
  property: {
    otherProperty: {
      value: 123456
    }
  }
}
path = 'property.otherProperty.value' // 123456
```

**Example for JSON array**

```javascript
{
  "data": [{
    "name": "a"
  }, {
    "name": "b"
  }]
}
path = 'data.1.name' // b
```

**XML**

Similar for XML:

```javascript
const xml = `<?xml version="1.0"?>
<people xmlns:xul="some.xul">
  <person db-id="test1">
    <name first="george" last="bush" />
    <address street="1600 pennsylvania avenue" city="washington" country="usa"/>
    <phoneNumber>202-456-1111</phoneNumber>
  </person>
</people>`
path = 'people.person.0.phoneNumber' // 202-456-1111
```

**Accessing XML attribute value**

XML path supports attr\(ATTRIBUTE NAME\) function that returns the value of the attribute:

```text
path = 'people.person.0.name.attr(first)' // george
```

### Defining the resulting action

When `path` is set you can define two actions to be performed on the data. You can either permanently `Store variable` in application internal database or `Assign variable` temporarily until you restart the application. Last item is to define variable name that will be updated with the value.

![Response action definition](../.gitbook/assets/image%20%289%29.png)

## Conditions

![](../.gitbook/assets/image%20%2819%29.png)

You can add a condition to the action so the action will be executed if all defined conditions are meet.

To add a condition to the action click on `Add condition` button. Source, Type and Path to data works the same way as in Action editor.

After you define source of the data then choose operator to be used to compare the data. It can be one of:

* equal
* not-equal
* greater-than
* greater-than-equal
* less-than
* less-than-equal
* contains

Contains can operate on strings, whole headers object \(contains "content-type"\) and on JSON objects \(contains "property"\).

Last field to set up is `Condition value` which is used to compare the data.

## Further reading

See our guide to [authorize the application with OAuth 2 and request actions](../guides/authenticating-with-oauth2-and-request-actions.md).

