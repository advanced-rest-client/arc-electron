[![Build Status](https://travis-ci.org/advanced-rest-client/payload-editor.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/payload-editor)  

# payload-editor

An element that is responsible for displaying forms to prepare a request body.

The element contains following editors that the user may use to provide the value:

- [raw editor](https://github.com/advanced-rest-client/raw-payload-editor) - free text form editor with syntax highlighting, accepts any text value
- [form editor](https://github.com/advanced-rest-client/form-data-editor) - `x-www-form-urlencoded` content type editor as a standard web form. Produces valid url-encoded output
- [multipart editor](https://github.com/advanced-rest-client/multipart-payload-editor) - for mixed text fields and files
- [file input](https://github.com/advanced-rest-client/files-payload-editor) - to send file as the body
- [body-json-editor](https://github.com/advanced-rest-client/body-json-editor) - JSON editor in form

The `value` property can have different type depending on selected editor.
Raw, form and JSON editors produces `string` value. Multipart produces `FormData` object and file editor produces `File` object.

### Example
```
<payload-editor value="{{body}}"></payload-editor>
```

Each time a value changes in one of child editors the `payload-value-changed` custom event is fired
with a `value` property set on `detail` object. Intercepting the event prevents you from reading
value of the element directly.

### Styling
`<payload-editor>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--payload-editor` | Mixin applied to the element | `{}`
`--payload-editor-dropdown` | Mixin applied to dropdown menus in the header | `{}`
`--payload-editor-options-panel` | Mixin applied to the container with dropdowns | `{}`
`--payload-editor-dropdown-type` | Mixin applied to the dropdown that selects editor type | `{}`

