[![Build Status](https://travis-ci.org/advanced-rest-client/response-view.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/response-view)  

# response-view

`<response-view>` An element to display the HTTP response view.

It uses the Fetch API's objects to pass the
[Request](https://developer.mozilla.org/en-US/docs/Web/API/Request) and
[Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) data. The element
import polyfils for the Promises API and for the Fetch API.

### Example
```
<response-view loading-time="200.123" is-xhr></response-view>
<script>
  var panel = document.querySelector('response-view');
  panel.request = request; // A Request class instance
  panel.response = response; // A Response class instance
  panel.responseError = undefined; // Clean if it was set previously.
</script>
```

If the transport can provide more details about the request like detailed
timings, redirects information or source message sent to the server you can
set corresponding attributes to display this information. Otherwise set `isXhr`
attribute to display a basic view.

To see detailed information about data format see the
[response-status-view](https://elements.advancedrestclient.com/elements/response-status-view)
element documentation.

## Request additional properties
The element will attempt to read the `rawMessage` on the `request` object.
If it's set and `isXhr` is not set then the source message will be displayed in
the `request headers` panel.
If this property is set but the app have this information, just set the
`sentHttpMessage` property.

### Styling
`<response-view>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--response-view` | Mixin applied to the element | `{}`
`--no-info-message` | Mixin applied to the information about lack of the response | `{}`

Use: `response-status-view`, `response-body-view` and `response-error-view`
styles to style this element.

