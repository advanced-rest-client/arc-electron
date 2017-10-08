[![Build Status](https://travis-ci.org/advanced-rest-client/response-history-saver.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/response-history-saver)  

# response-history-saver

# response-history-saver element

An element that saves requests history in a datastore.

It handles the `response-ready` event asynchronously and updates both
requests history and history data data store.

The requests history keeps a daily record of requests made by the application.
It keeps record of rhe request data that can be restored lated by the
application.

The history data keeps record of every request made by the application. It can
be used to analyse performance of an API endpoint.

## Data model

### request history

All properties are strings.

Property | Description
----------------|-------------
`_id` | PouchDB database key. Combination of current day (YYYY-MM-dd) + URI encoded request URL and HTTP method name. Each value is separated with a forward slash (/).
`created` | Timestamp of a time when the record has been created
`updated` | Timestamp of a time when the record has been updated for the last time
`headers` | List of request headers as a HTTP header string. Can be empty string
`method` | Can be anything but most probably it is a valid HTTP method name
`payload` | Request body. It is always transformed to string.
`url` | the URL of the request.

### request data

Note that payload is always string even if the response body was different type.

Property | Type | Description
----------------|-------------|-------------
`_id` | `String` | PouchDB database key. Combination of URI encoded request URL, HTTP method name and generated UUID. Each value is separated with a forward slash (/).
`timings` | `Object` | Valid HAR 1.2 timings object.
`totalTime` | `Number` | Number of milliseconds that took to perform the full request.
`created` | `Number` | Timestamp of the entry
`request` | `Object` | A request details object (see below).
`request.headers` | `String` | HTTP headers string sent to the server.
`request.payload` | `String` | HTTP message string set to the server.
`request.url` | `String` | Request URL
`request.method` | `String` | HTTP method of the request
`response` | `Object` | Response details object
`response.statusCode` | `Number` | A status code of the response.
`response.statusText` | `String` | Status text message. Can be empty or undefined.
`response.headers` | `String` | HTTP headers string of the response.
`response.payload` | `String` | Response body string.
`stats` | `Object` | Request and response basic statistics
`stats.request` | `Object` | Request basic statistics
`stats.request.headersSize` | `Number` | Request headers size in bytes
`stats.request.payloadSize` | `Number` | Request payload size in bytes
`stats.response` | `Object` | Response basic statistics
`stats.response.headersSize` | `Number` | Response headers size in bytes
`stats.response.payloadSize` | `Number` | Response payload size in bytes

### Example
```
<response-history-saver></response-history-saver>
```

