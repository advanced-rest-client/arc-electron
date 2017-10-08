[![Build Status](https://travis-ci.org/advanced-rest-client/prism-highlight.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/prism-highlight)  

# prism-highlight

`<prism-highlight>` Syntax highlighting via Prism

### Example
```
<prism-highlight id="c1" lang="markdown"></prism-highlight>
<script>
  document.querySelector('#c1').code = '# Test highlight';
</script>
```

The `lang` attribute is required and the component will not start parsing data without it.

Changing the `lang` and `code` properties together, do it in less than 10 ms.
The element is set to commit changes after this persiod. Otherwise it may display
old and new code due to the asynchronius nature of the code highligter.

*Note** This element uses web workers with dependencies. It expect to find
workers files in current directory in the `workers` folder.
Your build process has to ensure that this files will be avaiable.

Also this element expects the prism scripts to be available in the same
root folder as this element is (like bower_components).

### Required scripts
- ../prism/prism.js
- ../prism/plugins/autolinker/prism-autolinker.min.js
- ../prism/components/*

### Styling
`<prism-highlight>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--prism-highlight` | Mixin applied to the element | `{}`
`--prism-highlight-code` | Mixin applied to the `<pre>` element | `{}`
`--prism-highlight-mark-selected` | Background color for the `<mark>` element when using custom search | `#ff9632`



### Events
| Name | Description | Params |
| --- | --- | --- |
| prism-highlight-parsed | Fired when highlighting is applied to the code view. | __none__ |
| prism-highlight-timeout | Fired when the tokenize task timeout. The event is cancelable. | message **String** - A message to display to the user. |
| url-change-action | An event fired when the user clicked on any link in the response panels or the headers | url **String** - An url value |
