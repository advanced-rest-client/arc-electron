[![Build Status](https://travis-ci.org/advanced-rest-client/saved-list-items.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/saved-list-items)  

# saved-list-items

A `<saved-list-items>` element renders a list of fistory items.

## Data model

Each history item requires the following properties:

-   `method` (String) HTTP method of the request
-   `url` (String) The URL of the request
-   `name` (String) Request name

## Example

```html
<saved-list-items id="saved" items="[[list]]"></saved-list-items>
```

## List handing

The element uses `<iron-list>` element that creates a virtual list containing
limited number of child elements. It allows to load huge number of requests
without harming the performance.

## Adding pagination

Simplest solution is to override the `items` array with new values.
It causes list reset and the list jumps to the fisrt element. To avoid this behavior use element's `addItems` function.

### Styling
`<history-list-items>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--saved-list-items` | Mixin applied to each list item | `{}`
`--saved-list-items-url-label` | Mixin applied to the URL label element | `{}`
`--saved-list-items-name-label` | Mixin applied to the request name label element | `{}`
`--saved-list-items-method-label` | Mixin applied to the method label element. | `{}`
`--saved-list-items-method-label-container` | Mixin applied to the method label parent container element. | `{}`
`--saved-list-item` | Mixin applied to the list item | `{}`
`--saved-list-item-selected` | Mixin applied to the selected list item | `{}`
`--saved-list-item-selected-background-color` | Selection color for list items. | `#E0E0E0`
`--saved-list-items-selection-counter` | Mixin applied to the selection counter | `{}`
`--saved-list-items-search-input` | Mixin applied to the search input | `{}`
`--saved-list-items-header` | Mixin applied to the list header options section. | `{}`
`--saved-list-items-list` | Mixin applied to the list (`iron-list`) | `{}`
`--action-button` | Mixin apllied to the primary action buttons | `{}`
`--secondary-action-button-color` | Color of the secondary action button | `--primary-color`
`--arc-font-body1` | Mixin applied to the element | `{}`



### Events
| Name | Description | Params |
| --- | --- | --- |
| list-item-details | Fired when the "request details" has been requested via this UI. | item **Object** - An object associated with this item. |
| list-item-name-changed | Fired when the name of an item has changed in the UI and the changed schold be commited to the datastore.  The event does not bubbles. | item **Object** - An object associated with this item. |
index **Number** - Object's index in the list. |
| list-item-open | Fired when the user clicked on an open button on an item.  The event does not bubbles. | item **Object** - An object associated with this item. |
index **Number** - Object's index in the list. |
| list-items-delete | Fired when the user clicked on a delete button on an item or delete selected in the table header.  The event does not bubbles. | items **Array** - List of items to be deleted. Each item is a request object as passed to the `items` array. |
| list-items-export | Fires when the user selects to export currently selected items.  The event does not bubbles. | items **Array** - List of items to be deleted. Each item is a request object as passed to the `items` array. |
| list-items-search | Fired when the user search the list.  The event does not bubbles. | q **String** - Search query. Can be empty when cleared. |
| list-items-selection-changed | Fired when single item selection has changed. It isn't fired when multiple selection has changed at once.  The event does not bubbles. | item **Object** - The request object |
index **Number** - Index of the item on the list |
selected **Boolean** - Whether the item is selected or not. |
| list-items-threshold | Fired when the user nearly scrolled to the ened of the list. It usually means that the app should load more results.  The event does not bubbles. | __none__ |
