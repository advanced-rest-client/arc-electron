[![Build Status](https://travis-ci.org/advanced-rest-client/response-body-view.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/response-body-view)  

# response-body-view

`<response-body-view>` An element to display a HTTP response body.

The element will try to select best view for given `contentType`. It will
choose the JSON viewer for JSON response and XML viewer for XML responses.
Otherise it will display a syntax hagligter.

Note that the `contentType` property **must** be set in order to display any
view.

### Save content to file

The element uses the web way of file saving. However, it sends the
`export-data` custom event first to check if hosting application implements
other save functionality. See event description for more information.

### Example
```
<response-body-view
  response-text="I am the resposne"
  content-type="text/plain"></response-body-view>
```

### Build in text search

In some environments (like Chrome applications) text search is not offered by
the platform and it must be build into the application. This element support
such situaltion by handling search events:

-   `search-bar-opened-changed` Means that the search bar has been opened / closed
-   `search-bar-input-changed` Means that the user provided a value to the search input
-   `search-bar-search-position-changed` Means that the user requested to highlight next / previous item.

`search-bar-opened-changed` and `search-bar-input-changed` have `lastTarget` and
`value` properties set on the `detail` object. `value` (String) represents user input and
`lastTarget` (HTMLElement or undefined), if set, represents last view that interacted with the element.
If the `lastTarget` is set and is not this element then it will not handle the event.

`search-bar-search-position-changed` contains `position` (Number) that represents index
of the maked word to highlight. `searchTarget` means the same as `lastTarget`.

The element listend for the events on `window` object.

### Styling
`<response-body-view>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--response-body-view` | Mixin applied to the element | `{}`
`--response-body-view-dialog-title` | Mixin applied to dialog title | `{}`
`--response-body-view-preview-close` | Mixin applied to the response preview close button | `{}`
`--response-body-view-content-actions` | Mixin applied to the content actions container | `{}`
`--response-body-view-dialog-buttons` | Mixin applied to the dialog buttons container | `{}`
`--response-body-view-dialog-close` | Mixin applied to dialog's close button | `{}`
`--response-body-view-dialog-close-hover` | Mixin applied to dialog's close button when hovering | `{}`
`--response-body-view-dialog-download` | Mixin applies to dialog's download button | `{}`
`--response-body-view-dialog-download-hover` | Mixin applies to dialog's download button when hovering | `{}`



### Events
| Name | Description | Params |
| --- | --- | --- |
| export-data | Fired when the element request to export data outside the application.  Application can handle this event if it support native UX of file saving. In this case this event must be canceled by calling `preventDefault()` on it. If the event is not canceled then save to file dialog appears with a regular download link. | data **String** - A text to save in the file. |
type **String** - Data content type |
file **String** - Suggested file name |
| json-table-state-changed | Fired when the `jsonTableView` property change to inform other elements to switch corresponding view as well. | enabled **Boolean** - If true then the view is enabled. |
| search-bar-search-mark-count | Fired when text search on the element has been performed and number of search results are ready. | count **Number** - Number of marked words |
searchTarget **HTMLElement** - This element. |
