[![Build Status](https://travis-ci.org/advanced-rest-client/request-timings.svg?branch=master)](https://travis-ci.org/advanced-rest-client/request-timings)  

# request-timings

`<request-timings>`
An element to display request timings information as a timeline according to the HAR 1.2 spec.

The `timings` property should contain timings object as defined in [HAR 1.2 spec](https://dvcs.w3.org/hg/webperf/raw-file/tip/specs/HAR/Overview.html#sec-object-types-timings).

The timings object is consisted of:
- **blocked** [number, optional] - Time spent in a queue waiting for a network connection. Use -1 if the timing does not apply to the current request.
- **dns** [number, optional] - DNS resolution time. The time required to resolve a host name. Use -1 if the timing does not apply to the current request.
- **connect** [number, optional] - Time required to create TCP connection. Use -1 if the timing does not apply to the current request.
- **send** [number] - Time required to send HTTP request to the server.
- **wait** [number] - Waiting for a response from the server.
- **receive** [number] - Time required to read entire response from the server (or cache).
- **ssl** [number, optional] - Time required for SSL/TLS negotiation. If this field is defined then the time is also included in the connect field (to ensure backward compatibility with HAR 1.1). Use -1 if the timing does not apply to the current request.

Additionally the object can contain the `startTime` property that indicates
the request start time. If can be Date object, timestamp or formatted string
representing a date.

The timeline for `connect`, `send`, `wait` and `receive` are always shown.
`blocked`, `dns` and `ssl` are visible only if values for it was set and value
was > 0.

### Example
```
<request-timings timings="[[requestTimings]]"></request-timings>
```

### Styling
`<request-timings>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--request-timings` | Mixin applied to the element | `{}`
`--select-text` | Mixin applied to the text elements that should have text selection enabled (in some platforms text selection is disabled by default) | `{}`
`--form-label` | Mixin applied to labels elements | `{}`
`--request-timings-progress-height` | The height of the progress bar | `12px`
`--request-timings-progress-background` | Background color of the progress bar. | `#F5F5F5`
`--request-timings-progress-color` | Color of the progress bar. | `#4a4`
`--request-timings-label-width` | Width of the label | `160px`
`--request-timings-value-width` | Width of the value column | `120px`

# request-timings-panel


The `request-timings-panel` element is a panel to display a set of timings
for the request / response. The use case is to display timings for the request
where redirects are possible and timings for the redirects are calculated.

The timings accepted by this element is defined in the HAR 1.2 spec. See The
`request-timings` element docs for more info.

Custom property | Description | Default
----------------|-------------|----------
`--request-timings-panel` | Mixin applied to the element | `{}`
`--arc-font-subhead` | Mixin applied to the headers element. Similar to `--paper-font-subhead` mixin in Paper elements. | `{}`

Use `request-timings` properties an mixins to style the charts.

