[![Build Status](https://travis-ci.org/advanced-rest-client/response-highlighter.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/response-highlighter)  

# response-highlighter

An element that parses the HTTP response and displays highlighted result.

It splits the response by line (by default it's 500) and if the response has
more than that it shows only first 500 lines and the user can request to
display the rest or next 500 lines. This is to make the element work faster.
If the response is very long it may take some time to parse and tokenize it.
Control number of lines by setting the maxRead attribute.

### Example
```
<response-highlighter></response-highlighter>
```
```
var display = document.querySelector('response-highlighter');
display.responseText = someJsonResponse;
display.contentType = 'application/json';
```

## Content actions
By default the user can copy content of the code to clipboard. This action is
always visible.
You can add more actions in the actions bar by putting elements as a children
of this element.
### Example
```
<response-highlighter>
  <paper-icon-button title="Additional action" icon="arc:cached"></paper-icon-button>
  <paper-icon-button title="Clear the code" icon="arc:clear"></paper-icon-button>
</response-highlighter>
```

See demo for more information.

## Custom search
If the platform doesn't support native text search, this element implements
`ArcBehaviors.TextSearchBehavior` and exposes the `query` attribute.
Set any text to the `query` attribute and it will automatically highlight
occurance of the text.

## Content actions
The element can render a actions pane above the code view. Action pane is to
display content actions that is relevan in context of the response displayed
below the icon buttons. It should be icon buttons or just buttons added to this
view.
Buttons need to have `content-action` property set to be included to this view.
```
<json-viewer json='{"json": "test"}'>
  <paper-icon-button content-action title="Copy content to clipboard" icon="arc:content-copy"></paper-icon-button>
</json-viewer>
```

### Styling
`<response-highlighter>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--response-highlighter` | Mixin applied to the element | `{}`
`--response-highlighter-action-bar` | Mixin applied to the action bar above the highlighted code | `{}`
`--no-info-message` | Mixin applied to the "nothing to display" message (theme variable) | `{}`

See prism-highlight element for more styling options.

