# Styles for markdown preview

It should be included where the `marked-element` is used.

## Usage example

```html
<marked-element markdown="[[item.description]]">
  <div class="markdown-html"></div>
</marked-element>
```

Mind use of the `markdown-html` CSS rules. It is required by markdown element and also all css rules
defined here are scoped to a container with this class name.

Custom property | Description | Default
----------------|-------------|----------
`--code-background-color` | Background color of the code block | `#f5f2f0`
`--arc-code-styles` | Mixin to override styles for markdown pre and code elements
