[![Build Status](https://travis-ci.org/advanced-rest-client/chrome-file-export.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/chrome-file-export)  

# chrome-file-export

File export using Chrome apps API

### Example
```html
<chrome-file-export></chrome-file-export>
<script>
var event = new CustomEvent('export-data', {
  detail: {
    data: new Blob(['test']),
    type: 'text/plain',
    file: 'example-name.txt' // This is optional.
  },
  cancelable: true,
  bubbles: true
});
document.body.dispatchEvent(event);
if (event.defaultPrevented) {
  consoloe.log('File exported');
}
</script>
```



### Events
| Name | Description | Params |
| --- | --- | --- |
| export-data-end | Fited when the export operation ended | __none__ |
| export-data-error | Fired when the export operation errored | __none__ |
