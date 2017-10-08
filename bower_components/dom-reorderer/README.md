[![Build Status](https://travis-ci.org/advanced-rest-client/dom-reorderer.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/dom-reorderer)  

# dom-reorderer

`<dom-reorderer>` A list of arrangable items.

This element is based on https://github.com/PolymerElements/iron-elements/issues/8#issuecomment-163696858

It works with `dom-repeat` custom element. Items in the repeater will become
draggable and it's position can be changed. After arrangment has changed the
`dom-order-changed` custom event is fired to notify about the change.

### Example
```
<dom-reorderer on-dom-order-changed="_positionChanged">
  <template is="dom-repeat" items="[[items]]">
    <div>[[item]]</div>
  </template>
</dom-reorderer>
```

### Styling
`<dom-reorderer>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--dom-reorderer` | Mixin applied to the element | `{}`
`--dom-reorderer-dragging-item` | Mixin applied to the element that is dragged by the user | `{}`
`--dom-reorderer-moving-item` | Mixin applied to all elements that are being moved while list order change | `{}`
`--dom-reorderer-box-shaddow-color` | Color of the shaddow of the dragged item | `rgba(50, 50, 50, 0.75)`

You can also define `.dragging` and `.moving` classes in host application
to the child elements inside the repeater.

#### Example:

```html
<style>
.item {
  background-color: #fff;
  padding-right: 12px;
}
.item.moving {
  background-color: yellow;
}
.item.dragging {
  background-color: green;
}
</style>
<dom-reorderer on-dom-order-changed="_positionChanged">
  <template is="dom-repeat" items="[[items]]">
    <div class="item">[[item]]</div>
  </template>
</dom-reorderer>
```



### Events
| Name | Description | Params |
| --- | --- | --- |
| dom-order-changed | Dispatched when items order change. | item **Object** - A model of the item that has been moved |
from **Number** - Original index position of the moved item |
to **Number** - New position of the moved item. |
