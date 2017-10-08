[![Build Status](https://travis-ci.org/advanced-rest-client/saved-request-detail.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/saved-request-detail)  

# saved-request-detail

Details applet for saved request object.

If the request is a history item the set `isHistory` property to `true`.

The applet doesn't support data edit. Element / app hosting this element
must handle events sent by this element and support edit action.

### Example
```
<saved-request-detail request="{...}"></saved-request-detail>
```

### Styling
`<saved-request-detail>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--saved-request-detail` | Mixin applied to the element | `{}`
`--saved-request-detail-description` | Mixin applied to request description | `{}`
`--saved-request-detail-description-max-width` | Max width of the description element | `700px`
`--saved-request-detail-description-color` | Color of the request description | `rgba(0, 0, 0, 0.64)`
`--saved-request-detail-url-label` | Mixin applied to the  URL label | `{}`
`--saved-request-detail-method-label` | Mixin applied to the `http-method-label` element | `{}`
`--saved-request-detail-meta-row` | Mixin applied to the meta data list items | `{}`
`--saved-request-detail-meta-row-label` | Mixin applied to the meta data label | `{}`
`--saved-request-detail-meta-row-value` | Mixin applied to the meta data value | `{}`
`--saved-request-detail-actions-container` | Mixin applied to the buttons container | `{}`
`--saved-request-detail-action-buttons` | Mixin applied to the action buttons | `{}`
`--saved-request-detail-action-icon` | Mixin applied to action buttons icons  | `{}`
`--saved-request-detail-action-icon-color` | Color of the icon in the action button | `rgba(0, 0, 0, 0.54)`



### Events
| Name | Description | Params |
| --- | --- | --- |
| delete-request | Fired when the user click on the "delete" action button.  This event does not bubbles. | item **Object** - The request object |
| edit-request | Fired when the user click on the "edit" action button.  This event does not bubbles. | item **Object** - The request object |
| navigate | Fired when the user opens the project item.  This event can be fired only if the request has a project. | base **String** - Always `project` |
id **String** - Project ID |
