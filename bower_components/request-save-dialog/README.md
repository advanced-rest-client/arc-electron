[![Build Status](https://travis-ci.org/advanced-rest-client/request-save-dialog.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/request-save-dialog)  

# request-save-dialog

A save request dialog for Advanced REST Client.

The element knows nothing about the request content so it has to be used in a
context of a request (request panel).

It accepts `name`, `isSaved` and `projectId` properties for requests that are
already saved in the datastore. This values must be set by the application that
hosts the element.

Each time the dialog is opened it queries for a list of projects in the datastore.

The element fires `save-request` custom event when the user use "save" or
"override" option in the UI. To react on a cancel event (fired after pressing ESC,
clicking outside the dialog or after pressing "cancel" button) listen for
`iron-overlay-canceled` event.

### Example
```
<request-save-dialog is-saved name="test" on-save-request="_saveRequest"></request-save-dialog>
```

### Styling
`<request-save-dialog>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--request-save-dialog` | Mixin applied to the element | `{}`
`--request-save-dialog-caption` | Mixin applied to the save options caption | `{}`
`--request-save-dialog-caption-color` | Color of the save options caption | `#737373`
`--arc-font-body1` | Theme mixin, applied to the dialog | `{}`
`--arc-font-title` | Theme mixin, applied to the dialog title. It overrides the `--paper-dialog-title` mixin. | `{}`
`--arc-font-caption` | Theme mixin, | `{}`

