[![Build Status](https://travis-ci.org/advanced-rest-client/response-status-view.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/response-status-view)  

# response-status-view

`<response-status-view>` HTTP response status view, including status, headers redirects and timings

### Full example
```
<response-status-view
  status-code="[[statusCode]]"
  status-message="[[statusMessage]]"
  request-headers="[[requestHeaders]]"
  response-headers="[[responseHeaders]]"
  loading-time="[[loadingTime]]"
  http-message="[[_computeHttpMessage(requestHeaders)]]"
  redirects="[[redirects]]"
  redirect-timings="[[redirectTimings]]"
  timings="[[timings]]"></response-status-view>
```
### Minimal example
```
<response-status-view
  status-code="[[statusCode]]"
  status-message="[[statusMessage]]"
  response-headers="[[responseHeaders]]"
  loading-time="[[loadingTime]]"></response-status-view>
```

## Data Structure

### Redirects
#### `redirects`
Array of objects. Each objects need to have the `headers` property as a HTTP headers string, `status` as a HTTP status and optionally `statusText`.
#### `redirectTimings`
Array of objects. Each object represent a HAR 1.2 timings object. See the `request-timings` element documentation for more information.
### `responseError`
A JavaScript Error object.
### `timings`
Object that represent a HAR 1.2 timings object. See the `request-timings` element documentation for more information.

## Status message
The element will set a status message if, after 100 ms of setting the status code
property, the `statusMessage` property is not set. This is to ensure that the
user will always see any status message.

## Styling
`<response-status-view>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--response-status-view` | Mixin applied to the element | `{}`
`--raml-docs-response-panel` | Mixin applied to the element | `{}`
`--arc-status-code-color-200` | Color of the 200 status code (ARC theme option) | `rgba(56, 142, 60, 1)` |
`--arc-status-code-color-300` | Color of the 300 status code (ARC theme option) | `rgba(48, 63, 159, 1)` |
`--arc-status-code-color-400` | Color of the 400 status code (ARC theme option) | `rgba(245, 124, 0, 1)` |
`--arc-status-code-color-500` | Color of the 500 status code (ARC theme option) | `rgba(211, 47, 47, 1)` |
`--arc-font-subhead` | Mixin applied to sub headers (low implortance headers). It's a theme mixin. | `{}`
`--no-info-message` | Mixin applied to the messages information that there's no information available. | `{}`
`--arc-font-code1` | Mixin applied to the source message. It's a theme mixin. | `{}`
`--response-status-view-badge-color` | Color of the badge with number of the headers / redirections in advanced view | `#fff`
`--response-status-view-badge-background` | Background color of the badge with number of the headers / redirections in advanced view | `--accent-color`
`--response-status-view-empty-badge-color` | Color of the badge with number of the headers / redirections in advanced view | `#fff`
`--response-status-view-empty-badge-background` | Background color of the badge with number of the headers / redirections in advanced view | `#9e9e9e`
`--response-status-view-status-info-border-color` | Border color separating status from the response headers | `#e5e5e5`
`--response-status-view-status-container` | Mixin applied to the status row in the main view and in the redirects view (in advanced mode). | `{}`

# status-message

Use the `<status-message>` element to generate status message for corresponding
status code.

## Usage
Create an element and set the `code` property. The `message` property will be
set synchronously with the corresponding HTTP status message (in spec defined
as a reason message).
If the status code is non standard status code then the message property
will be `undefined`.

### Example:
```
var element = document.createElement('status-message');
element.code = 201;
console.log(element.message);
```
Note that the `code` can be string and it will be converted into the numeric
value.
 