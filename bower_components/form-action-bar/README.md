[![Build Status](https://travis-ci.org/advanced-rest-client/form-action-bar.svg?branch=master)](https://travis-ci.org/advanced-rest-client/form-action-bar)  [![Dependency Status](https://dependencyci.com/github/advanced-rest-client/form-action-bar/badge)](https://dependencyci.com/github/advanced-rest-client/form-action-bar)  

# form-action-bar

The `<form-action-bar>` renders an action buttons and status information in the bottom of the form.

    <form is="iron-form">
      <form-action-bar>
        <div id="status" prefix>Form status OK</div>
        <paper-button>cancel</paper-button>
        <paper-button>save</paper-button>
      </form-action-bar>
    </form>

Children will be rendered on the right-hand side.
If child element contains a `prefix` attribute it will be rendered on the left side.

### Parent container padding
Parent container should have  bottom padding at least the same as the `--form-action-bar-height` CSS variable value.
By default it is 64 pixels. The bar reders itself in fixed position so everything behind it is not visible.

### Elevation
Use the `elevation` attribute (in range 0-5) to set z-deepth of the bar were 0 is no elevation at all and 5 is to highest elevation. Default elevation is 1.

### Styling
`<form-action-bar>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--form-action-bar-background` | Background color of the bar | `#fff`
`--form-action-bar-height` | Bar height | `64px`
`--form-action-bar-content` | Mixin applied to the main container (excluding prefixes) | `{}`

