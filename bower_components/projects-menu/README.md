[![Build Status](https://travis-ci.org/advanced-rest-client/projects-menu.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/projects-menu)  

# projects-menu

A list of projects in the ARC main menu.

The element uses direct implementation of the PouchDB to make a query to the
datastore. It also listens to events fired by the `arc-model` elements to
update state of the saved items.

### Example
```
<projects-menu selected-project="project-id" selected-request="id-of-selected-request" attr-for-opened="opened" opened></projects-menu>
```

### Styling
`<projects-menu>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--projects-menu` | Mixin applied to the element | `{}`
`--projects-menu-background-color` | Background color of the menu | `#f7f7f7`
`--projects-menu-selected-method-label-background-color` | Background color of the POST method label when the item is focused | `#fff`
`--projects-menu-list` | Mixin applied to the list element. | `{}`
`--projects-menu-list-item` | Mixin applied to each list item | `{}`
`--projects-menu-selected-item-background-color` | Background color of the selected list item | `rgba(255, 152, 0, 0.24)`
`--projects-menu-name-label` | Mixin applied to the name label | `{}`
`--projects-menu-project-icon-color` | Color of the "project" icon | `rgba(0, 0, 0, 0.64)`
`--projects-menu-selected-project-icon-color` | Color of the "project" icon when selected | `#F57C00`

# projects-menu-requests

A list of requests related to a project in the ARC main menu.

The element requires the `arc-models/project-model` element to be present
in the DOM to update items order.

### Example
```
<projects-menu-requests project-id="some-id" selected-request="id-of-selected" attr-for-opened="opened" opened></projects-menu-requests>
```

### Styling
`<projects-menu-requests>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--projects-menu-requests` | Mixin applied to the element | `{}`
`--projects-menu-requests-background-color` | Background color of the menu | `#f7f7f7`
`--projects-menu-requests-selected-method-label-background-color` | Background color of the POST method label when the item is focused | `#fff`
`--projects-menu-requests-list-item` | Mixin applied to each list item | `{}`
`--projects-menu-requests-selected-item-background-color` | Background color of the selected list item | `#FF9800`
`--projects-menu-requests-selected-item-color` | Color of the selected list item | `#fff`
`--projects-menu-requests-name-label` | Mixin applied to the name label | `{}`
`--warning-primary-color` | Main color of the warning messages | `#FF7043`
`--warning-contrast-color` | Contrast color for the warning color | `#fff`
`--error-toast` | Mixin applied to the error toast | `{}`

