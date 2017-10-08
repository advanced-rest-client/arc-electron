[![Build Status](https://travis-ci.org/advanced-rest-client/form-data-editor.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/form-data-editor)  

# form-data-editor

An element to edit form data (x-www-form-urlencoded).

The element renders a form of body properties. Each row contains name and value input fields to
describe parameters in body.
Empty values for both name and value inputs are not included in final body value.

### Example

```
<form-data-editor></form-data-editor>
```

The element implements `request-payload-editor-behavior` that offers methods
to encode and decode values. The UI contains controls to encode and decode
values.

## Models

The element implements `ArcBehaviors.RamlTypeFormBehavior` to compute a model
from a RAML type. If `ramlType` property is set then it computes the `dataModel`
property with RAML data model for form view.

Internally the element generates a view `model`. If `dataModel` contains an item
with `name` that equals `model` item name then it adds data model item to the
view model. This model is then used to build a form controls for given RAML type.

## Disabling model and value computation

To disable any computations in the element set `attrForOpened` attribute. When
an attribute is set with the name that equals `attrForOpened` value then
computations will be resumed.

It is helpful when UI allows switching between different editors:

```html
<form-data-editor attr-for-opened="enabled"></form-data-editor>

<script>
  function enableEditor() {
    document.querySelector('form-data-editor').setAttribute('enabled', true);
  }
</script>
```

Or you can use `iron-pages` element:

```html
<iron-pages selected="{{openedEditor}}" selected-attribute="opened">
  <paper-textarea value="{{value}}"></paper-textarea>
  <form-data-editor attr-for-opened="opened" value="{{value}}"></form-data-editor>
</iron-pages>
```

Note, this will only work if you set an attribute. It will not handle property change.

### Styling
`<form-data-editor>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--form-data-editor` | Mixin applied to the element | `{}`
`--form-data-editor-row` | Mixin applied to each form row | `{}`
`--form-data-editor-encode-buttons` | Mixin applied to encode / decode buttons container | `{}`
`--action-button` | Theme mixin, applied to the "add parameter" button | `{}`
`--form-data-editor-add-button` | Mixin applied to the "add parameter" button | `{}`
`--form-data-editor-add-button-background-color` | Background color of the "add parameter" button | `--primary-color`
`--form-data-editor-add-button-color` | Font color of the "add parameter" button | `--primary-background-color`
`--from-row-action-icon-color` | Delete parameter button color | `--icon-button-color` or `rgba(0, 0, 0, 0.74)`
`--from-row-action-icon-color-hover` | Delete parameter button color when hovering with the pointer | `--accent-color` or `rgba(0, 0, 0, 0.74)`
`--form-data-editor-row-narrow` | Mixin applied to each form row when narrow layout | `{}`
`--form-data-editor-row-optional` | Mixin applied to the optional rows | `{}`
`--form-data-editor-row-optional-visible` | Mixin applied to the optional rows when becomes visible | `{}`



### Events
| Name | Description | Params |
| --- | --- | --- |
| payload-value-changed | Event fire when the value of the editor change. This event is not fired if `attrForOpened` is set and corresponding value is not set. | value **String** - Current payload value. |
