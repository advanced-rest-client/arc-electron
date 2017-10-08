[![Build Status](https://travis-ci.org/advanced-rest-client/drop-file-importer.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/drop-file-importer)  

# drop-file-importer

An element that reads data from file drop.

When the file is read it dispatches `process-incoming-data` custom event
so the application can decide what to do with the data.

### Example
```
<drop-file-importer on-process-incoming-data="_dataReady"></drop-file-importer>
```

### Styling
`<drop-file-importer>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--drop-file-importer` | Mixin applied to the element | `{}`
`--drop-file-importer-background-color` | Background color of the element | `#fff`
`--drop-file-importer-header-background-color` | Bacground color of the header and border of the element | `--primary-color`
`--drop-file-importer-header-color` | Font color of the header | `#fff`
`--drop-file-importer-info-color` | Color of the info message when reading file | `rgba(0, 0, 0, 0.54)`



### Events
| Name | Description | Params |
| --- | --- | --- |
| process-incoming-data | Fired when data were read and ready to be processed.  Note, the event can be canceled. | data **String** - Read data |
