[![Build Status](https://travis-ci.org/advanced-rest-client/history-menu.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/history-menu)  

# history-menu

A list of history items in the ARC main menu.

The element uses direct implementation of the PouchDB to make a query to the
datastore. It also listens to events fired by the `arc-model` elements to
update state of the history items.

### Example
```
<history-menu></history-menu>
```

### Sizing the element

The element uses `<iron-list>` to render the data in the view. The list is set
to be flex vertically. It means that the element has to be sized directly by the
hosting application or otherwise it size will be 0px.

It can be done using flex layout and making the element to be `flex: 1`.

### Styling
`<history-menu>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--history-menu` | Mixin applied to the element | `{}`
`--history-menu-background-color` | Background color of the menu | `#f7f7f7`
`--history-menu-selected-post-method-color` | Font color of selected item POST method label | `#fff`
`--history-menu-focused-post-method-color` | Font color of focused item POST method label | `rgb(33, 150, 243)`
`--history-menu-selected-method-label-background-color` | Background color of the POST method label when the item is focused | `#fff`
`--history-menu-list` | Mixin applied to the list element. | `{}`
`--history-menu-list-item` | Mixin applied to each list item | `{}`
`--history-menu-selected-item-background-color` | Background color of the selected list item | `#FF9800`
`--history-menu-selected-item-color` | Color of the selected list item | `#fff`
`--history-menu-url-label` | Mixin applied to the URL label | `{}`
`--history-menu-group-header` | Mixin applied to the history list group header | `{}`
`--history-menu-group-header-font-weigth` | Group header border color |  `bold`
`--history-menu-group-header-border-color` | Group header border color | `#ddd`
`--history-menu-group-header-color` | Font color of the group header` | `rgba(0, 0, 0, 0.54)`

