[![Build Status](https://travis-ci.org/advanced-rest-client/http-method-selector.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/http-method-selector)  

# http-method-selector

A HTTP method selector. Displays list of radio buttons with common
http methods and a dropdown with less common but still valid methods.

User can define his own methos whe selects "custom" option in the dropdown menu.
Because of this the element do not support validation of any kind and hosting
application should provide one if required.

### Example
```
<http-method-selector></http-method-selector>
```

### Styling
`<http-method-selector>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--http-method-selector` | Mixin applied to the element | `{}`
`--http-method-selector-dropdown` | Mixin applied to the dropdown field | `{}`
`--http-method-selector-input` | Mixin applied to the custom input field | `{}`
`--http-method-selector-custom-close-button` | Mixin applied to the custom input close button | `{}`
`--from-row-action-icon-color` | Theme variable, color of the custom input close button | `--icon-button-color` or `rgba(0, 0, 0, 0.74)`
`--from-row-action-icon-color-hover` | Theme variable, color of the custom input close button when hovering | `--accent-color` or `rgba(0, 0, 0, 0.74)`



### Events
| Name | Description | Params |
| --- | --- | --- |
| request-is-payload-changed | Fired when the `isPayload` computed property value chnage. | value **Boolean** - Current state. |
| request-method-changed | Fired when a method has been selected. | value **Boolean** - Current HTTP method name. |
# http-method-selector-mini

A HTTP method selector in a dropdown list of predefined HTTP methods.

### Example
```
<http-method-selector-mini></http-method-selector-mini>
```

### Styling
`<http-method-selector>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--http-method-selector-mini` | Mixin applied to the element | `{}`
`--http-method-selector-mini-dropdown-width` | Width of the dropdown field | `100px`
`--http-method-selector-mini-input-width` | Width of the custom input field | `100px`
`--http-method-selector-mini-dropdown` | Mixin applied to the dropdown field | `{}`
`--http-method-selector-mini-input` | Mixin applied to the custom input field | `{}`
`--http-method-selector-custom-close-button` | Mixin applied to the custom input close button | `{}`
`--from-row-action-icon-color` | Theme variable, color of the custom input close button | `--icon-button-color` or `rgba(0, 0, 0, 0.74)`
`--from-row-action-icon-color-hover` | Theme variable, color of the custom input close button when hovering | `--accent-color` or `rgba(0, 0, 0, 0.74)`



### Events
| Name | Description | Params |
| --- | --- | --- |
| request-is-payload-changed | Fired when the `isPayload` computed property value chnage. | value **Boolean** - Current state. |
| request-method-changed | Fired when a method has been selected. | value **Boolean** - Current HTTP method name. |
