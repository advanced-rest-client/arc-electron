[![Build Status](https://travis-ci.org/advanced-rest-client/date-time.svg?branch=master)](https://travis-ci.org/advanced-rest-client/date-time)  

# date-time

`<date-time>` An element to display formatted date and time.

The `date` propery accepts Date object, Number as a timestamp or string that
will be parsed to the Date object.

This element uses the `Intl` interface which is available in IE 11+ browsers.
It will throw an error in IE 10 unless you'll provide a polyfill for the `Intl`.

To format the date use [Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat) inteface options.

The default value for each date-time component property is undefined, but if all component properties are undefined, then year, month, and day are assumed to be "numeric".

### Example
```
<date-time date="2010-12-10T11:50:45Z" year="numeric" month="narrow" day="numeric"></date-time>
```

The element provides accessibility by using the `time` element and setting the `datetime` attribute on it.

### Styling
`<date-time>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--date-time` | Mixin applied to the element | `{}`

