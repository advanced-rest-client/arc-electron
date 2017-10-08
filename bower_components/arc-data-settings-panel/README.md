[![Build Status](https://travis-ci.org/advanced-rest-client/arc-data-settings-panel.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/arc-data-settings-panel)  

# arc-data-settings-panel

A user data related settings panel.

Parent element should observe changes to the `cookieStorage` object and update
settings.

Database export is handled by sending `export-user-data` custom event that is
handled by the `<arc-data-export>` (or any other compatible) element.

Databases are destroyed by this element.

The element does not handles settings change events.

### Example
```
<arc-data-settings-panel cookie-storage="{{useCookieStorage}}" on-datastore-destroyed="_hatabaseDestroyed"></arc-data-settings-panel>
```

### Styling
`<arc-data-settings-panel>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--arc-data-settings-panel` | Mixin applied to the element | `{}`
`--arc-settings-panel-header` | Mixin applied to settings panel header | `{}`
`--arc-settings-panel-header-color` | Color of the settings panel header | `--accent-color`
`--arc-settings-panel-icon-color` | Settings panel icon color | `rgba(0, 0, 0, 0.34)`

