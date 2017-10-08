[![Build Status](https://travis-ci.org/advanced-rest-client/headers-sets-selector.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/headers-sets-selector)  

# headers-sets-selector

A headers sets listing and editor for the headers editor.

It can be enbeded anywhere in the application. It provides a way to
list, add, edit and delete user headers sets. Sorresponding event is fired
when the user perform the action.

Note: you should update `isPayload` property if the editor is used in context
of HTTP request. This will alter default headers list adding `content-type`
header. The `isPayload` property means that the request can carry the payload.

### Example
```
<headers-sets-selector></headers-sets-selector>
```

### Styling
`<headers-sets-selector>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--headers-sets-selector` | Mixin applied to the element | `{}`
`--headers-sets-selector-card-body` | Mixin applied to the card text | `{}`
`--headers-sets-selector-intro-text-coolor` | Text color of the intro message | `rgba(0, 0, 0, 0.54)`
`--headers-sets-selector-intro-text-size` | Font color of the intro message | `15px`
`--headers-sets-selector-card-action-button-font-size` | Font size of action buttons in cards. | `14px`



### Events
| Name | Description | Params |
| --- | --- | --- |
| custom-headers-set-created | Fired when the headers set has been created | id **String** - Database ID entry |
rev **String** - Current PouchDB rev |
name **String** - Name of the set |
content **String** - Headers set value. |
| custom-headers-set-deleted | Fired when the headers set has been updated | id **String** - Database ID entry |
| custom-headers-set-updated | Fired when the headers set has been updated | id **String** - Database ID entry |
rev **String** - Current PouchDB rev |
name **String** - Name of the set |
content **String** - Headers set value. |
| headers-set-selected | Fired when the user selects the headers set. | id **String** - PouchDB database ID, if the set is stored in the database (can be one of the default ones) |
set **String** - Headers associated with the set |
# headers-set-editor

A headers set editor is a form element that can be validated.
Contains CodeMirror editor to edit headers value.

Custom property | Description | Default
----------------|-------------|----------
`--headers-set-editor` | Mixin applied to the element | `{}`
`--action-button` | Theme mixin, applied to the "add" button | `{}`
`--headers-set-editor-action-button` | Mixin applied to the "add" button | `{}`
`--headers-set-editor-cancel-button` | Mixin applied to the "cancel" button | `{}`
`--headers-set-editor-headers-border-bottom-color` | Bottom border color of code mirror editor | `--secondary-text-color`
`--error-color` | Color od error border | `#E53935`




### Events
| Name | Description | Params |
| --- | --- | --- |
| headers-set-editor-cancel | Fired when the user cancels edits. | __none__ |
| headers-set-editor-update | Fires when the user accepts the form. | name **String** - User defined name for the set |
value **String** - User defined headers for the set |
