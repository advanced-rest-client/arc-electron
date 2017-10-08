[![Build Status](https://travis-ci.org/advanced-rest-client/auth-dialogs.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/auth-dialogs)  

# authorization-dialog

Base authorization dialog for the Advanced REST Client. It is to be used to create an
authorization dialogs with common UI and animations.

The dialog extends `Polymer.PaperDialogBehavior` so the hosting application should listen for
it's events to determine dialog's state.

### Example
```
<authorization-dialog>
  <h2>Basic authorization</h2>
  <form>
    <input type="text" name="login"/>
  </form>
</authorization-dialog>
```

### Styling
`<authorization-dialog>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--authorization-dialog` | Mixin applied to the element | `{}`
`--authorization-dialog-title` | Mixin applied to the title of the dialog | `{}`

Also it implements all `paper-dialog` mixins and variables.

# auth-dialog-basic

`<auth-dialog-basic>` Authorization dialogs for the Advanced REST CLient

### Example
```
<auth-dialog-basic username="test" password="test" on-auth-dialog-closed="_authData" opened></auth-dialog-basic>
```

### Styling

See the [authorization-dialog.html](authorization-dialog.html) for styling options.



### Events
| Name | Description | Params |
| --- | --- | --- |
| auth-dialog-closed | Fired when the user accepts or closes the dialog. | value **Object** - Authorization data from the dialog. It may vary depending on dialog type. |
type **String** - Authorization type of the dialog. `basic`, `ntlm` etc. |
cancelled **Boolean** - True if the dialog was cancelled. If true then other properties are not set. |
# auth-dialog-ntlm

`<auth-dialog-ntlm>` Authorization dialogs for the Advanced REST CLient

### Example
```
<auth-dialog-ntlm username="test" password="test" domain="my-nt-domain" on-auth-dialog-closed="_authData" opened></auth-dialog-ntlm>
```

### Styling

See the [authorization-dialog.html](authorization-dialog.html) for styling options.



### Events
| Name | Description | Params |
| --- | --- | --- |
| auth-dialog-closed | Fired when the user accepts or closes the dialog. | value **Object** - Authorization data from the dialog. It may vary depending on dialog type. |
type **String** - Authorization type of the dialog. `basic`, `ntlm` etc. |
cancelled **Boolean** - True if the dialog was cancelled. If true then other properties are not set. |
