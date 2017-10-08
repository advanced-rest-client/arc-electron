[![Build Status](https://travis-ci.org/advanced-rest-client/authorization-panel.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/authorization-panel)  

# authorization-panel

`<authorization-panel>` The authorization panel used in the request panel.
It is a set of forms that allow set up the authorization method for a HTTP request.

The element do not perform authorization. Depending on selected method there are
different ways of dealing with the authorization.

### Auth methods availability
By default the element will display all authorization methods available in it.
Currently they are:
- basic
- digest
- OAuth 2.0

If `securedBy` property is set (which is the `securedBy` property of the RAML's
definition produced by [raml-js-parser](https://elements.advancedrestclient.com/elements/raml-js-parser)
and [raml-json-enhance](https://elements.advancedrestclient.com/elements/raml-json-enhance))
then it will show only those methods that are supported by this known endpoint.
See this element's documentation for more information.

Detailed information about authorization methods can be find in the [auth-methods documentation page](https://elements.advancedrestclient.com/elements/auth-methods).

### Basic authorization
The element sends the `request-header-changed` custom event to inform any other
element that is listening to this event that header value has changed
(Authorization in this case). The `raml-headers-form` is an example of an
element that is listening for this event and change request headers value
when auth data change.

### OAuth 2.0
The [Oauth 2 form](https://elements.advancedrestclient.com/elements/auth-methods?active=auth-method-oauth2)
sends the `oauth2-token-requested` custom event with the OAuth settings provided
by the user.
Any element / hosting app can handle this event and perform authorization.
ARC elements provides the [oauth2-authorization](https://elements.advancedrestclient.com/elements/oauth-authorization) element
(from the `oauth-authorization` repo) that can be placed anywhere in the DOM
(from current element where `authorization-panel` is attached up to
the body) and perform OAuth athorization.
However it can be also done by any other element / app  or even server.
See `<oauth2-authorization>` for detailed documentation.

Note: OAuth 2.0 server flow probably will not work in regular browser
environment because main providers aren't setting CORS headers. Therefore the
request will be canceled by the browser.
To make it work, handle the `oauth2-token-requested` fired from the inside of this element.
If it's browser flow type (implicit) then the `oauth2-authorization` element can be used.
For other other types, handle and cancel the event and use server to handle token exchange.
The ARC elements offers a [Chrome extension](https://github.com/advanced-rest-client/api-console-extension)
that once installed will propxy auth requests and made the exchange even for
the server flow. The application should use [api-console-ext-comm](https://github.com/advanced-rest-client/api-console-ext-comm)
element to communicate with the extension.

#### `redirect-url` property for OAuth 2.0
OAuth protocol requires to define a redirect URL that is registered in the
OAuth provider. The redirect URL should point to a page that will pass the URL
parameters to the opener page (OAuth 2 panel).
If you application uses the [oauth-authorization](https://elements.advancedrestclient.com/elements/oauth-authorization)
element then it provides a popup that pases the data back to the application.
In this case your redirect URL would be `https://your.domain.com/bower_components/oauth-authorization/oauth-popup.html`.
User have to change OAuth provider's settings and adjust the redirect URL to
point to this page.

You can also use the [oauth-popup.html](https://github.com/advanced-rest-client/oauth-authorization/blob/stage/oauth-popup.html)
to build your own page.

### OAuth 1.0a
Oauth 1a is not currently supported. The form is ready and available but there's no
authorization method in the ARC components set.

### Digest Authentication
When the user provide all required information for Digest authorization then
this element will fire `request-header-changed` custom event which will do the
same thing as in case of basic authorization.

### Example
```
<authorization-panel redirect-url="http://domain.com/bower_components/oauth-authorization/oauth-popup.html"></authorization-panel>
```

### Styling
`<authorization-panel>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--authorization-panel` | Mixin applied to the element | `{}`
`--stepper-step-number-background-color` | Background color of the step number (if selected auth method support this) | `#3D8099`
`--stepper-step-number-color` | Color of the step number (if selected auth method support this) | `#fff`
`--stepper-step-title-color` | Color of the label of the step (if selected auth method support this) | `#3D8099`
`--stepper-step-selection-label-color` | Color of the label of closed section (with selected option) | `rgba(0, 0, 0, 0.54)`
`--stepper-line-color` | Left hand side line color of the stepper. | `rgba(0, 0, 0, 0.12)`
`--arc-font-body1` | Theme mixin, Mixin applied to the elements that are containg text | ``



### Events
| Name | Description | Params |
| --- | --- | --- |
| authorization-settings-changed | Fired when auth settings change.  It will be fired when any of types is currently selected and any value of any property has changed. | settings **Object** - Current auth settings. It depends on enabled `type`. |
type **String** - Enabled auth type. For example `basic`, `ntlm` or `oauth2`. |
| authorization-type-changed | Fired when the authorization type changed. Note that the `settings` property may not be updated at the moment of of firing the event. | type **String** - Current auth type |
| query-parameter-changed | Fired when the query param changed and all listeners should update parameters / URL value. | name **String** - Name of the header that has changed |
value **String** - Header new value |
| request-header-changed | Fired when the request header changed and all listeners should update header value. | name **String** - Name of the header that has changed |
value **String** - Header new value |
