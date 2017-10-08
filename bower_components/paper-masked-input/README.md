[![Build Status](https://travis-ci.org/advanced-rest-client/paper-masked-input.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/paper-masked-input)  

# paper-masked-input

Material design: [Text fields](https://www.google.com/design/spec/components/text-fields.html)

`<paper-masked-input>` is a single-line password field with Material Design styling and option to unmask the value.
    <paper-masked-input label="Your password"></paper-masked-input>

It may include an optional error message.
    <paper-masked-input label="Your password" error-message="Invalid password!"></paper-masked-input>

The password input will rener two additional icon buttons: clear and visibility toggle.
When the user toggle visibility it will change to regular text field and back.

### Focus
To focus a paper-masked-input, you can call the native `focus()` method as long as the paper input has a tab index.

### Styling
See `Polymer.PaperInputContainer` for a list of custom properties used to style this element.

