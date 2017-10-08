[![Build Status](https://travis-ci.org/advanced-rest-client/url-input-editor.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/url-input-editor)  

# url-input-editor

# url-input-editor element

An editor of the request URL.

The editor renders a simple editor view with a input fiedl. The input in this
view is supported by the `paper-autocomplete` element that queries history saver
for URL history data (`url-history-query` custom event).


By setting `detailsOpened` property to `true` (the user can do this in the UI)
it will render detailed editor. The editor allows to edit host, path, query
parameetrs and hash separatelly.


### Example

```html
<url-input-editor url="{{requestURL}}" on-send-request="_sendAction" on-url-value-changed="_handleNewUrl"></url-input-editor>
```

### Styling
`<url-input-editor>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--url-input-editor` | Mixin applied to the element | `{}`

Use paper elements mixin to style this element.



### Events
| Name | Description | Params |
| --- | --- | --- |
| send-request | Fired when the user use the "entrer" key in any of the fields. | __none__ |
| url-history-query | Fired when autocomplete element request data. This event is to be handled by `url-history-saver` element but it can be handled by any element that intercepts this event. | q **String** - A query filter. |
| url-value-changed | Fired when the URL value change. Note that this event is fired before validation occur and therefore the URL may be invalid. | value **String** - The URL. |
