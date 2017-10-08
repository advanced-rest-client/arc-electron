[![Build Status](https://travis-ci.org/advanced-rest-client/raml-type-form-input.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/raml-type-form-input)  

# raml-type-form-input

An element that renders an input element to edit RAML type value.
It accept model values produced by the [raml-type-form-behavior](https://github.com/advanced-rest-client/raml-type-form-behavior).
Refer to `raml-type-form-behavior` documentation for model details.

### Example
```
<raml-type-form-input model='{"inputLabel": "Enter value"}' value="{{value}}"></raml-type-form-input>
```

### Styling
`<raml-type-form-input>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--raml-type-form-input` | Mixin applied to the element | `{}`
`--raml-type-form-input-required-label-color` | Input's label color when required | `rgba(0, 0, 0, 0.74)`
`--from-row-action-icon-color` | Theme variable, color of the action icon button | `--icon-button-color` or `rgba(0, 0, 0, 0.74)`
`--from-row-action-icon-color-hover` | Theme variable, color of the action icon button when hovered | `--accent-color` or `rgba(0, 0, 0, 0.74)`
`--from-row-action-icon-opacity` | Opacity of the action icon button | `0.54`
`--from-row-action-icon-opacity` | Opacity of the action icon button when hovered | `0.74`
`--arc-font-caption` | Theme mixin, applied to array values label | `{}`
`--raml-type-form-input-array-border-color` | Border color of the element when it is array type item | `rgba(0, 0, 0, 0.14)`

Also, use mixins and variables for `paper-input`, `paper-dropdown-menu`, `paper-listbox`
and `paper-item` to style this element.

