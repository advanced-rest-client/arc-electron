[![Build Status](https://travis-ci.org/advanced-rest-client/headers-form-editor.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/headers-form-editor)  

# headers-form-editor

A headers form to be used to render a form of HTTP headers.

### Example

```html
<headers-form-editor></headers-form-editor>
```

```javascript
var form = document.querySelector('raml-headers-form');
form.ramlHeaders = []; // Put headers property from the RAML JS parser.
form.addEventListener('value-changed', function(e) {
  var value = e.detail.value;
});
```

### The value

The value can be simply set by setting an HTTP headers string value to element's `value` property.
It transforms the value into internal data model that will build the form. If you need more advanced
solutions (adding validation, required items, setting data types) you can set data model manually
by setting an array to the `model` property.

### Data model

Data model items represent a form element in the headers form. Below is the list of properties
supported by the form.

You can call `createModel()` function on the element to create a model item with all
default properties from only properties you currently have.

Property | Type | Description | Default
----------------|-------------|----------
`required` | Boolean | If set then the item is required with the form. Make only sense when setting header name. It will also prohibit the header from being removed from the editor. | `false`
`type` | String | Header value input's type. Currently supported values are `number` and `text` | `text`
`example` | String | If set, it adds an example in the value input's placeholder. If item is required and `default` is not set it sets the value of the input from the example. | ``
`default` | String | If set and `required` is `true` then set's the value of the header to this property. Do nothing if value is already set. |
`name` | String | Name of the header | ``
`value` | String | Value of the header | ``
`description` | String | Markdown description of the header. If set it will add an icon button next to "remove" button to display an inline documentation below the input field. | ``
`enum` | `Array<String>` | The value can be one of predefined values. In this case it will display a dropdown with predefined values to choose from. | `undefined`

### Styling
`<headers-form-editor>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--headers-form-editor` | Mixin applied to the element | `{}`
`--headers-form-row` | Mixin applied to every form row | `{}`
`--headers-form-editor-input-label-color` | Color of the input label | `--raml-headers-form-input-label-color` or `rgba(0, 0, 0, 0.48)`
`--headers-form-editor-input-label-color-required` | Color of the input label if the form control is required. | `--raml-headers-form-required-input-label-color` or `rgba(0, 0, 0, 0.72)`
`--inline-fom-action-icon-color` | Color of the icons in the form editor | `rgba(0, 0, 0, 0.74)`
`--inline-fom-action-icon-color-hover` | Color of the icons in the form editor when hovering | `--accent-color` or `rgba(0, 0, 0, 0.74)`
`--inline-documentation-color` | Color of the inline documentation text | `rgba(0, 0, 0, 0.87)`



### Events
| Name | Description | Params |
| --- | --- | --- |
| request-headers-changed | Fired when the headers value changed. | value **String** - The headers value. |
# headers-form-editor-item

A headers form item that renders input fields.

The element support names **suggestions** if [arc-definitions](https://github.com/advanced-rest-client/arc-definitions)
element is present in the DOM.

It also support headers fill support if any of [headers-support](https://github.com/advanced-rest-client/headers-support)
elements are in the DOM.

Both elements can be replaced by any other element that intercepts events supported
by the elements. See element's docs for more information.

## request-header-changed event

This element also intersepts `request-header-changed` event **and cancels it**.
Once the event is intercepted the value of this form item changes and the changes
are propagated to the editor which should send `request-headers-changed` event.
The event is canceled so elements that can react on the other event should not
update value for `request-header-changed` event as a redundant operation.

By default this eleemnt will listen for this event on `window` object.
Use `eventsTarget` property to set event listener target for this event to limit
source of the event.

### Styling
`<headers-form-editor>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--headers-form-editor-item` | Mixin applied to the element | `{}`
`--headers-form-row` | Mixin applied to every form row | `{}`
`--headers-form-editor-input-label-color` | Color of the input label | `--raml-headers-form-input-label-color` or `rgba(0, 0, 0, 0.48)`
`--headers-form-editor-input-label-color-required` | Color of the input label if the form control is required. | `--raml-headers-form-required-input-label-color` or `rgba(0, 0, 0, 0.72)`
`--inline-fom-action-icon-color` | Color of the icons in the form editor | `rgba(0, 0, 0, 0.74)`
`--inline-fom-action-icon-color-hover` | Color of the icons in the form editor when hovering | `--accent-color` or `rgba(0, 0, 0, 0.74)`
`--inline-documentation-color` | Color of the inline documentation text | `rgba(0, 0, 0, 0.87)`



### Events
| Name | Description | Params |
| --- | --- | --- |
| append-item-if-needed | Fired when the form item lost focus from the value field and delete icon gained focus (used tab). | __none__ |
| remove-header-form-item | Fired when the user requested to remove this item from the form. | __none__ |
