[![Build Status](https://travis-ci.org/advanced-rest-client/arc-loader-screen.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/arc-loader-screen)  

# arc-loader-screen

`<arc-loader-screen>` Loader screen for Advanced REST Client application.

It fills available area on the screen unless it is container by relative
positioned element. Then it fills the parent element.

To show the loader set `opened` attribute on the element. To disable, set
`opened` property to `false`.

### Example
```
<arc-loader-screen opened></arc-loader-screen>
```

### Styling
`<arc-loader-screen>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--arc-loader-screen` | Mixin applied to the element | `{}`
`--arc-loader-screen-icon-size` | ARC icon size | `128px`
`--arc-loader-screen-spinner-color` | Color of the spinner. | `#00A2DF`
`--arc-loader-screen-background-color` | Loader's background color | `#ECEFF1`
`--arc-loader-screen-color` | Text color of the loader. | `--paper-spinner-color`
`--arc-font-headline` | Theme element, mixin applied to the app name | `{}`

