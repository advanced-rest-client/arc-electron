[![Build Status](https://travis-ci.org/advanced-rest-client/oauth2-scope-selector.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/oauth2-scope-selector)  

# oauth2-scope-selector

A selector for the OAuth scope. It provides an UI to enter a scope for the AOuth settings.

### Example
```
<oauth2-scope-selector></oauth2-scope-selector>
```

Use the `allowed-scopes` attribute to provide a list of predefined scopes supported by the
endpoint. When the list is set, autocomplete will be enabled in the selector. Autocomplete
is supported by the `paper-autocomplete` element.

Setting `prevent-custom-scopes` it will dissallow adding a scope that is not defined
in the `allowed-scopes` array.

#### Example
```
<oauth2-scope-selector prevent-custom-scopes></oauth2-scope-selector>
```
And in JavaScript
```
var selector = document.querySelector('oauth2-scope-selector');
selector.allowedScopes = ['profile', 'email'];
```

### Adding scope documentation
It is possible to display a documentation alongside the scope. In this case the user will see
a description below the scope name in the selected scopes list.

For it to work the `allowedScopes` array must contain objects with required keys: `label` and
`description`.

```
var scopes = [
  {'label': 'user', 'description': 'Grants read/write access to profile info only. Note that this scope includes user:email and user:follow.'},
  {'label': 'user:email', 'description': 'Grants read access to a user\'s email addresses.'},
  {'label': 'user:follow', 'description': 'Grants access to follow or unfollow other users.'}
];
var selector = document.querySelector('oauth2-scope-selector');
selector.allowedScopes = scopes;
```
The list will be passed to the `paper-autocomplete` (which is not supporting the `description`
property yet), and will render different list of selected scopes with the description.

See demo for more details.

### Styling
`<oauth2-scope-selector>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--oauth2-scope-selector` | Mixin applied to the element | `{}`
`--oauth2-scope-selector-label` | Mixin applied to the label element (title of the control) | `{}`
`--oauth2-scope-selector-list-item` | Mixin applied to each selected scope item. Consider setting `paper-item` styles for theming. | `{}`

### Theming
Use this mixins as a theming option across all ARC elements.

Custom property | Description | Default
----------------|-------------|----------
`--icon-button` | Mixin applied to `paper-icon-buttons`. | `{}`
`--icon-button-hover` | Mixin applied to `paper-icon-buttons` when hovered. | `{}`
`--form-label` | Mixin applied to all labels that are form elements | `{}`

