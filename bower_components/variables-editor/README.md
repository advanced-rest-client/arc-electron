[![Build Status](https://travis-ci.org/advanced-rest-client/variables-editor.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/variables-editor)  

# variables-editor

# `<variables-editor>`

A variables editor is an element to render UI for `variables-manager`.

It displays list of user defined environments and variables associated with the
environment.

This element requires compatible variables manager to be present in the DOM. It
uses browser event system to communicate with the manager. See `variables-manager`
documentation for detailed API for data exchange.

### Example

```
<variables-editor></variables-editor>
<variables-manager></variables-manager>
```

### Styling

`<variables-editor>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--variables-editor` | Mixin applied to the element | `{}`
`--variables-editor-add-color` | Color of the `add` button | `--primary-color`
`--variables-editor-add-environment-color` | Color of the add environment icon button | `rgba(0, 0, 0, 0.54)`
`--variables-editor-add-environment-color-hover | Color of the add environment icon button when hovering | `--accent-color` or `rgba(0, 0, 0, 0.74)`
`--variables-editor-remove-env-color` | Color of the remove button (icon) | `rgba(0, 0, 0, 0.24)`
`--variables-editor-remove-env-color-hover` | Color of the hovered remove button (icon) | `#e64a19`
`--accent-color` | Background color of the primary action button | ``
`--primary-light-color` | Color of the primary action button | `#fff`
`--variables-editor-docs-frame-content` | Mixin applied to the colored content container of the help section. | `{}`
`--variables-editor-docs-frame-content-background` | Background color of the help section content container. | `#E1F5FE`
`--arc-font-title` | Theme mixin, applied to the tutorial title | `{}`
`--arc-font-body1` | Theme mixin, applied to text labels | `{}`
`--variables-editor-primary-button-background-color` | Background color of the primary action button | `--accent-color`
`--variables-editor-primary-button-color` | Color of the primary action button | `--primary-light-color` or `#fff`
`--primary-button` | Mixin applied to the primary button | `{}`
`--variable-item` | Mixin applied to the variable item container | `{}`
`--variable-item-name-input` | Mixin applied to the `paper-input` for variable name | `{}`
`--variable-item-value-input` | Mixin applied to the `paper-input` for variable value | `{}`
`--variable-item-checkbox` | Mixin applied to the state checkbox | `{}`
`--inline-fom-action-icon-color` | Theme variable, color of the delete variable icon | `rgba(0, 0, 0, 0.74)`
`--inline-fom-action-icon-color-hover` | Theme variable, color of the delete variable icon when hovering | `--accent-color` or `rgba(0, 0, 0, 0.74)`

