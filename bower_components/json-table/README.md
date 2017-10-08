[![Build Status](https://travis-ci.org/advanced-rest-client/json-table.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/json-table)  

# json-table

`<json-table>` A table view from the JSON structure.

The element will render a table and / or list view from the JSON object.
If give JSON is am array it will display a table. For objects it will display list view.

Complex object will be represented as a embedded view of the list / table inside the parent object
representation. That may create very complex structure and lead to performance issues when computing
data model and building the DOM. Therefore the element will only build the first level of the view.
If the object / array contains other objects / arrays it will show only a button to display embeded
objects. That should prohibit from freezing the UI while rendering the view.

Another optimization is pagination (disabled by default). After setting the `paginate` property
array tables will contain a pagination with `itemsPerPage` items rendered at a time. The user can
change number of items at any time.

### Example
```
<json-table json="[...]" paginate items-per-page="15"></json-table>
```
## Content actions
The element can render an actions pane above the table / list view. Action pane is to
display content actions that is relevant in context of the content displayed
below the buttons. It should be icon buttons list or just buttons added to this view.

Buttons must have `content-action` property set to be included to this view.

```
<json-table json='{"json": "test"}'>
  <paper-icon-button content-action title="Copy content to clipboard" icon="arc:content-copy"></paper-icon-button>
</json-table>
```

### Styling
`<json-table>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--json-table` | Mixin applied to the element | `{}`
`--json-table-main-array-wrapper` | Mixin applied to the top level array's table view. This element has `overflow` property set.  | `{}`
`--json-table-item-border-bottom-color` | Color of the bottom border in the array able items or in the object list row | `rgba(0, 0, 0, 0.12)`
`--json-table-list-property-name-width` | Width of the property name for the list view for the object display | `120px`
`--json-table-array-header-color` | Color of the array table header labels | ``
`--json-table-array-body-color` | Color of the array table body values | ``

# json-table-array

`<json-table-array>` element displays array structure in a table.

### Example
```
<json-table-array json="[...]"></json-table-array>
```

### Styling
`<json-table-array>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--json-table-array` | Mixin applied to the element | `{}`

# json-table-object

`<json-table-object>` element displays object structure.

### Example
```
<json-table-object json="{...}"></json-table-object>
```

### Styling
`<json-table>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--json-table-object` | Mixin applied to the element | `{}`

