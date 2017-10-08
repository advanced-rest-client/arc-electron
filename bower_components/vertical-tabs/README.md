
`<vertical-tabs>` A vertical tabs made in the material design style. It uses paper-tab as a tab UI.

### Example
```
<vertical-tabs selected="{{selected}}">
  <paper-tab>Tab one</paper-tab>
  <paper-tab>Tab two</paper-tab>
  <paper-tab>Tab three</paper-tab>

  <iron-pages content selected="{{selected}}">
    <section>
      <img src="http://lorempixel.com/400/200/cats/"/>
    </section>
    <section>
      <img src="http://lorempixel.com/400/250/cats/"/>
    </section>
    <section>
      <img src="http://lorempixel.com/400/300/cats/"/>
    </section>
  </iron-pages>
</vertical-tabs>
```

By default the tabs will be rended on the right hand side. When `align-left` attribute is set in
this element (or `alignLeft` property set to true) then tabs will be rendered on the left hand side.

Note that this element will not include `<paper-tab>` element nor it is its dependency.
You can use any other HTML element to render tabs.

### Content distribution
This element will reneder any child as a tab element. Because of complicaticated styling in
horizontal mode it is allowed to pass one child that contains `[content]` attribute. It will be
placed as a tabs content. However, you can place the content yourself and style it.

### Content overflow
Whe elemet will take 100% available width. The content will take available space that is the rest
what tabs will left. If the content is bigger than available space it will push tabs out of the
bounds of parent element. It is expacted behavior. To prohibit it you can use the
`--paper-tabs-content` mixin and apply CSS rules that will prevent it from happening. For example:
```
<style is="custom-style">
  vertical-tabs {
    --paper-tabs-content: {
      max-width: 100%;
      overflow: auto;
    }
  }
</style>
```

### Styling
`<vertical-tabs>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--vertical-tabs` | Mixin applied to the element | `{}`
`--paper-tabs-selection-bar-color` | Color for the selection bar | `--paper-yellow-a100`
`--paper-tabs-selection-bar` | Mixin applied to the selection bar | `{}`
`--paper-tabs` | Mixin applied to the tabs | `{}`
`--paper-tabs-content` | Mixin applied to the content container of tabs | `{}`


