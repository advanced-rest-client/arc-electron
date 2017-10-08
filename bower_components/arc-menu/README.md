[![Build Status](https://travis-ci.org/advanced-rest-client/arc-menu.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/arc-menu)  

# arc-menu

Side navigation for Advanced REST Client.

### Example
```
<arc-menu selected-request="request-id" route-base="request"></arc-menu>
```

### Styling
`<arc-menu>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--arc-menu` | Mixin applied to the element | `{}`
`--arc-menu-item-background-color` | Background color of each menu item | `transparent`
`--arc-menu-selected-background-color` | Background color of selected menu item | `--accent-color`
`--arc-menu-selected-color` | Color of selected menu item | `#fff`
`--arc-menu-hover-background-color` | Background color of menu item when hovering | `#cccccc`



### Events
| Name | Description | Params |
| --- | --- | --- |
| app-new-window | Fired when the user requested to open new window of the application.  The event has the same properties as the `navigate` custom event. It is a description of the init route for the apps new window. All properties are optional and default route is used instead. | __none__ |
| app-version | Fired when querying for hosting application version number. The hosting application should handle this event by setting `version` property on event's `detail` object. | __none__ |
| logs-requested | Fired when the user requested to see the logs. | __none__ |
