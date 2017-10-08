# chrome-app-filesystem

`chrome-app-filesystem` is an element to read and write to files using chrome
 filesystem API.

The app that is using this element must have `fileSystem` permission:

```json
"permissions": [
  ...,
  {
    "fileSystem": ["write"]
  }
],
```

The `chrome-app-filesystem` element don't have it's own UI. It's only a helper element to us
in your app's logic.


### Example:
```
<chrome-app-filesystem
  content="{{fileData}}"
  readAs="json"
  file-name="my-file.json"
  on-file-read="fileReadHandler"
  on-file-write="fileSaveHandler"
  on-error="fileErrorHandler"></chrome-app-filesystem>
```

# chrome-local-filesystem

`chrome-local-filesystem` is an element to read and write to loacl web filesystem.

The app that is using this element can have `unlimitedStorage` permission:

```json
"permissions": [
  ...,
  {
    "unlimitedStorage"
  }
],
```

The `chrome-local-filesystem` element don't have it's own UI. It's only a helper element to use
in app's logic.


### Example:

```
<chrome-local-filesystem
  quota="52428800"
  content="{{fileData}}"
  mime="application/json"
  filename="my-file.json"
  on-file-read="fileReadHandler"
  on-file-write="fileSaveHandler"
  on-error="fileErrorHandler"></chrome-local-filesystem>
```

# chrome-sync-filesystem

`chrome-sync-filesystem` is an element to read and write to chrome syncable filesystem.
Note that the user must be signed in to chrome to use this API. Otherwise error
will be thrown when accessing API.

The app that is using this element can have `unlimitedStorage` permission:

```json
"permissions": [
  ...,
  {
    "unlimitedStorage"
  }
],
```

The `chrome-sync-filesystem` element don't have it's own UI. It's only a helper element to use
in app's logic.


### Example:

```
<chrome-sync-filesystem
  quota="52428800"
  content="{{fileData}}"
  mime="application/json"
  filename="my-file.json"
  on-file-read="fileReadHandler"
  on-file-write="fileSaveHandler"
  on-error="fileErrorHandler"></chrome-sync-filesystem>
```

