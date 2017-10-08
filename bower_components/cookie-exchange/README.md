[![Build Status](https://travis-ci.org/advanced-rest-client/cookie-exchange.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/cookie-exchange)  

# cookie-exchange

`<cookie-exchange>` Exchanges cookies insformation with ARC app using ARC extension.

The element works with the
<https://chrome.google.com/webstore/detail/arc-cookie-exchange/apcedakaoficjlofohhcmkkljehnmebp>
extension to synchronize list of cookies with the browser.

The element handles the `before-request` custom event so it applied headers if
needed.

### Example

```html
<cookie-exchange extension-id="apcedakaoficjlofohhcmkkljehnmebp"></cookie-exchange>
```

