[![Build Status](https://travis-ci.org/advanced-rest-client/raw-payload-editor.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/raw-payload-editor)  

# raw-payload-editor

`<raw-payload-editor>` A raw payload input editor based on CodeMirror.

The element additionally shows Encode / Decode buttons if current content type value contains
"x-www-form-urlencoded".

The element listens for `content-type-changed` custom event and updates the `contentType` property
automatically. This event is commonly used in ARC elements.

### Example
```
<raw-payload-editor content-type="application/json"></raw-payload-editor>
```

### Styling
`<raw-payload-editor>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--raw-payload-editor` | Mixin applied to the element | `{}`
`--raw-payload-editor-encode-buttons` | Mixin applied to encode / decode buttons container | `{}`



### Events
| Name | Description | Params |
| --- | --- | --- |
| payload-value-changed | Event fire when the value of the editor change. This event is not fired if `attrForOpened` is set and corresponding value is not set. | value **String** - Current payload value. |
