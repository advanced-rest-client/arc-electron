
`<uuid-generator>` An UUID generator.

### Example
``` html
<uuid-generator last-uuid="{{generatedUuid}}"></uuid-generator>
```
``` javascript
var uuid = document.querySelector('uuid-generator').generate();
assert.equal(uuid, generatedUuid);
```

