[![Build Status](https://travis-ci.org/advanced-rest-client/clipboard-copy.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/clipboard-copy)  

# clipboard-copy

An element that copies a text to clipboard.

### Example
```
<clipboard-copy content="test"></clipboard-copy>
```
```
var elm = document.querySelectior('clipboard-copy');
if(elm.copy()) {
  console.info('Content has been copied to the clipboard');
} else {
  console.error('Content copy error. This browser is ancient!');
}
```

### Styling
This element doesn't need styling because it's a logic element without the UI.



### Events
| Name | Description | Params |
| --- | --- | --- |
| content-copied | Fired when the content has been copied to the clipboard.  Note: You can use return value of the `copy()` function. If the return value is `true` then content has been copied to clipboard. | __none__ |
| content-copy | Fired when executing copy function. This cancelable event is dispatched before running the actual logic of this element to support platforms that doesn't allow to manage clipboard with `execCommand('copy')`.  When the event is canceled then the logic is not executed. | value **String** - A content t be copied to clipboard. |
| content-copy-error | Fired when there was an error copying content to clipboard.  Note: You can use return value of the `copy()` function. If the return value is `flase` then content has not been copied to clipboard. | __none__ |
