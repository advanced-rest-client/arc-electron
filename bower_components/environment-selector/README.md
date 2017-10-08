[![Build Status](https://travis-ci.org/advanced-rest-client/environment-selector.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/environment-selector)  

# environment-selector

An element to select current variables environment.

Renders a material design dropdown with list of available environments.
It always displays environment called **Default** (value `default`).

It should be used with [variables-manager](https://github.com/advanced-rest-client/variables-manager)
element or other element that handles `environment-list` and `environment-current`
custom events. See manager's description for more information.

### Example
```html
<environment-selector></environment-selector>

<script>
document.queryElement('environment-selector')
.addEventListener('selected-environment-changed', e => {
  console.log(e.detail.value); // Selected environment
});
</script>
```

### Styling
`<environment-selector>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--environment-selector` | Mixin applied to the element | `{}`

Use variables for `paper-dropdown-menu`, `paper-listbox` and `paper-item`
to style the control.



### Events
| Name | Description | Params |
| --- | --- | --- |
| selected-environment-changed | Fired when selected environment changed. | value **String** - Name of selected environment. |
