[![Build Status](https://travis-ci.org/advanced-rest-client/cookie-exchange-banner.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/cookie-exchange-banner)  

# cookie-exchange-banner

# cookie-exchange-banner element for ARC

An element that displays Chrome Proxy extension banner in ARC.

The banner to be displayed when the authorization for an endpoint is required
and cookies wasn't sent to the endpoint.

### Example
```
<cookie-exchange-banner></cookie-exchange-banner>
```

### Styling
`<cookie-exchange-banner>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--cookie-exchange-banner` | Mixin applied to the element | `{}`
`--cookie-exchange-banner-title` | Mixin applied to the title of the banner | `{}`
`--cookie-exchange-banner-text` | Mixin applied to the text elements | `{}`
`--cookie-exchange-banner-cta-text` | Mixin applied to the text element with main description | `{}`
`--cookie-exchange-banner-content` | Mixin applied to the main content (paper-material) | `{}`
`--cookie-exchange-banner-icon-color` | Color of the incon in the main action button  | `rgba(0, 0, 0, 0.54)`
`--cookie-exchange-banner-background-color` | Background color of main content  | `#FBE9E7`
`--cookie-exchange-banner-max-width` | Max width of the main content element | `640px`
`--cookie-exchange-banner-button-background-color` | Background color of the action button | `{}`
`--action-button` | Theme mixin, applied to the main action button | `{}`
`--action-button-hover` | Theme mixin, applied to the main action button when hovered | `{}`
`--arc-font-body1` | Theme mixin, primary font | `{}`
`--arc-font-body2` | Theme mixin, font with highlighting | `{}`
`--arc-font-headline` | Theme mizin, applied to the title | `{}`



### Events
| Name | Description | Params |
| --- | --- | --- |
| close | Fired when the user requested to close the message. The event does not bubbles. | __none__ |
