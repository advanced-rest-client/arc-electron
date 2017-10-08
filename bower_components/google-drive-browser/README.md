[![Build Status](https://travis-ci.org/advanced-rest-client/google-drive-browser.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/google-drive-browser)  

# google-drive-browser

A file browser for Google Drive

Required properties are `accessToken` and `apiKey`.

### Example
```
<google-drive-browser></google-drive-browser>
```

### Styling
`<google-drive-browser>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--google-drive-browser` | Mixin applied to the element | `{}`
`--arc-font-headline` | Mixin applied to the header | `{}`
`--action-button` | Mixin applied to the main action button | `{}`
`--secondary-action-button-color` | Color of the secondary acction button | `--primary-color`
`--google-drive-list-view-min-height` | The minimum height of the list element | `400px`
`--google-drive-browser-title` | Mixin applied to the headers | `{}`



### Events
| Name | Description | Params |
| --- | --- | --- |
| drive-file-picker-data | Fired when the file content is ready. | content **String** - File content downloaded from the drive. |
driveId **String** - Drive file ID |
