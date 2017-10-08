##&lt;file-reader&gt;

The `file-reader` is an element for read files in a web browser.
The file can be any sub-class of Blob class. That mean it can read Blobs, File objects etc.

The `file reader` element don't have it's own UI. It's only a helper element to us in your 
app's logic.

##Example:
```html
<file-reader blob="[[myFile]]" readAs="dataURL" on-file-read="myFileAsURL" auto></file-reader>
```