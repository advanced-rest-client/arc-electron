[![Build Status](https://travis-ci.org/advanced-rest-client/body-json-editor.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/body-json-editor)  

# body-json-editor

`<body-json-editor>` A JSON editor for HTTP body

It provides a visual editor for the JSON body.

### Example
```
<body-json-editor value='["apple", 1234]'></body-json-editor>
```

To set / get value on / from the element use the `value` property. Each time
something change in the editor the string `value` will be regenerated.
It is also possible to set a JavaScript objkect on this element using
`json` property but it is immutable and changes will not be reflected to it.

### Styling
`<body-json-editor>` provides the following custom properties and mixins for
styling:

Custom property | Description | Default
----------------|-------------|----------
`--body-json-editor` | Mixin applied to the element | `{}`
`--body-json-editor-action-button` | Mixin applied to the action buttons | ``
`--body-json-editor-autocomplete-top` | CSS top property for autocomplete elements | `32px`

See docs for other elements in the package for more styling options.

# property-editor

`<object-editor>` Is a part of the `body-json-editor`. This element is used to recursively
display a JSON object editor.

### Styling
`<object-editor>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--property-editor` | Mixin applied to the element. | `{}`,
`--property-editor-dropdown-menu-input-color` | Color of the the paper dropdown menu input. | `#673AB7`
`--property-editor-dropdown-menu-button-color` | Color of the paper dropdown menu button. | `#673AB7`
`--primary-color` | Color of the action button | ``
`--body-json-editor-action-button` | Mixin applied to the action buttons | ``
`--inline-form-action-icon-color` | Color of the inline form action buttons | `rgba(0, 0, 0, 0.74)`
`--inline-form-action-icon-color-hover` | Color of the inline form action buttons when hovered | `--accent-color` or `rgba(0, 0, 0, 0.74)`
`--property-editor-array-label-color` | Color of the "array" item label. | `rgba(0, 0, 0, 0.74)`
`--property-editor-array-label` | Mixin applied to the "array" item label. | ``
`--property-editor-narrow-margin-bottom` | Margin bottom of each editor property when in narrow view | `12px`

# primitive-value

The `primitive-value` element produces final value of a primitive property.
Renders input field or a dropdown depending on the model properties.

### Styling
`<primitive-value>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--primitive-value` | Mixin applied to the element. | `{}`,
`--arc-font-body1` | Theme mixin, default font applied to this element. | `{}`
`--code-type-text-value-color` | Text color of the code highligted string value | `#080`
`--code-type-number-value-color` | Text color of the code highligted numeric value | `#303F9F`
`--code-type-boolean-value-color` | Text color of the code highligted boolean value | `#4A148C`
`--code-type-null-value-color` | Text color of the code highligted nullable value | `#4A148C`

# property-type-selector

The `property-type-selector` provides UI to change UI model element type.

### Styling
`<property-type-selector>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--property-type-selector` | Mixin applied to the element. | `{}`,

