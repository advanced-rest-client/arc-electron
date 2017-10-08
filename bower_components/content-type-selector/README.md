[![Build Status](https://travis-ci.org/advanced-rest-client/content-type-selector.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/content-type-selector)  

# content-type-selector

`<content-type-selector>` is an element that provides an UI for selecting common
content type values.

The element do not renders a value that is not defined on the list.
Instead it shows the default label.

If the content type is more complex, mening has additional information like
`multipart/form-data; boundary=something` then, in this case` only the
`multipart/form-data` is taken into the account when computing selected item.

The element fires the `content-type-changed` custom event when the user change
the value in the drop down container. It is not fired when the change has not
beem cause by the user.

### Example
```
<content-type-selector></content-type-selector>
```

The list of content type values can be extended by setting child `<paper-item>`
elements with the `data-type` attribute set to content type value.

### Example
```
<content-type-selector>
  <paper-item data-type="application/zip">Zip file</paper-item>
  <paper-item data-type="application/7z">7-zip file</paper-item>
</content-type-selector>
```

### Listening for content type change event

By default the element listens for the `content-type-changed` custom event on
global `window` object. This can be controlled by setting the `eventsTarget`
property to an element that will be used as an event listeners target.
This way the application can scope events accepted by this element.

This will not work for events dispatched on this element. The scoped element
should handle `content-type-changed` custom event and stop it's propagation
if appropriate.

Once the `content-type-changed` custom event it changes value of current
content type on this element unless the event has been canceled.

### Styling
`<content-type-selector>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--content-type-selector` | Mixin applied to the element | `{}`
`--content-type-selector-item` | Mixin applied to dropdown items | `{}`

The element support styles for `paper-dropdown-menu`, `paper-listbox` and `paper-item`



### Events
| Name | Description | Params |
| --- | --- | --- |
| content-type-changed | Fired when the content type header has been updated. | value **String** - New Content type. |
