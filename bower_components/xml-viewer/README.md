[![Build Status](https://travis-ci.org/advanced-rest-client/xml-viewer.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/xml-viewer)  

# xml-viewer

`<xml-viewer>` An XML payload viewer for the XML response

### Example
```
<xml-viewer xml="&lt;tag&gt;&lt;/tag&gt;"></xml-viewer>
```

*Note** This element uses web workers with dependencies. It expect to find
workers files in current directory in the `workers` folder.
Your build process has to ensure that this files will be avaiable.

## Content actions
By default the user can copy content of the code to clipboard. This action is
always visible.
You can add more actions in the actions bar by putting elements as a children
of this element.
### Example
```
<xml-viewer>
  <paper-icon-button title="Additional action" icon="arc:cached"></paper-icon-button>
  <paper-icon-button title="Clear the code" icon="arc:clear"></paper-icon-button>
</xml-viewer>
```

### Styling
`<xml-viewer>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--xml-viewer` | Mixin applied to the element | `{}`
`--xml-viewer-comment-color` | Color of the comment section. | `#236E25`
`--xml-viewer-punctuation-color` | Color of the punctuation signs | `black`
`--xml-viewer-tag-name-color` | Color of the XML tag name | `#881280`
`--xml-viewer-attribute-name-color` | Color of the XML attribute. | `#994500`
`--xml-viewer-attribute-value-color` | Color of the attribute's value. | `#1A1AA6`
`--xml-viewer-cdata-color` | CDATA section color. | `#48A`
`--xml-viewer-document-declaration-color` | XML document declaration (header) color. | `#999`
`--xml-viewer-constant-color` | Constant (boolean, null, number) color. | `#283593`

