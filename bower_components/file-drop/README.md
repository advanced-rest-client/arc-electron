[![Build Status](https://travis-ci.org/advanced-rest-client/file-drop.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/file-drop)  

# file-drop

## `<file-drop>` File drop web component
The `<file-drop>` component will render a filed where the user can drop files or directories into it.
User can choose a fallback option to select a file using browser's open file dialog.

When files are selected by the user the `file-accepted` will be fired and the `<file-drop>.file` will contain a file entry.
If `multiple` attribute is present then the `<file-drop>.file` will be always an array of entries. If not, multiple it will always be a single file entry.

Depending on user input method and type of the file there are 3 possible types that will be returned by `<file-drop>.file`
DirectoryEntry - only when the user dropped a directory (not possible with file selector)
FileEntry - if the user dropped a file into the element
File - only if the user selected file(s) via file input (without drop)

The array of files may contain both DirectoryEntry and FileEntry types but never File.

### Example
```
<file-drop multiple accept="image/*"></file-drop>
```

Note that due the limitations of web filesystem the accept attribute will not work when dropping a file.

### Styling
`<file-drop>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
| `--file-drop` | Mixin applied to the element | `{}` |
| `--file-drop-zone-border-color` | A border color of the drop zone | `--paper-lime-300` |
| `--file-drop-zone` | Mixin applied to the drop zone | `{}` |
| `--file-drop-zone-border-color-active` | A border color of the active drop zone (files over the zone) | red |
| `--file-drop-action-button` | Mixin applied to the main action button | `{}` |
| `--file-drop-with-file` | Mixin applied to the container when the file is selected | `{}` |
| `--file-drop-without-file` | Mixin applied to the container when the file is not selected | `{}` |

The element renders only file selector button when whe screen size is less than 1024px. It means mobile device which can't make use of file drag and drop.



### Events
| Name | Description | Params |
| --- | --- | --- |
| file-accepted | Fired when the file has been accepted and ready to use. | file **File** - A file entry |
