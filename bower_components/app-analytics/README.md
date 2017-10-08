[![Build Status](https://travis-ci.org/advanced-rest-client/app-analytics.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/app-analytics)  

# app-analytics

`<app-analytics>` An element that support Google Analytics analysis

### Example
```
<app-analytics
  tracking-id="UA-XXXXXXX-Y"
  app-name="my app"
  app-version="1.0.0"
  data-source="app-analytics element"></app-analytics>
```

The `app-name` and `tracking-id` are required parameters in order to run the element properly.

This element initalize its own database where config data will be stored
(cid parameter, information if analitics has been disabled).

If `clientId` attribute is not set it will be generated automatically. There's no need to set
it manually if there's no need.

__Google Analytics do not allow sending any information that may lead to a user__

Always give the user ability to disable tracking. In EU you have to have a permission from
the user to store data on his computer. The `app-database`'s default config is to permit
tracking. Disable it by calling a function on the element:
```
document.querySelector('app-analytics').setTrackingPermitted(false);
```
setting up attribute:
```
<app-analytics tracking-id="UA-XXXXXXX-Y" disable-tracking></app-analytics>
```
or fire custom event:
```
// inside Polymer element:
this.fire('app-analytics-permitted', {
  permitted: false
});
// or in JavaScript
var event = new CustomEvent('app-analytics-permitted', {
  detail: {
    permitted: false,
    bubbles: true
  }
});
document.dispatchEvent(event);
```

### Using `<app-analytics>`

You can directly call one of `send*()` functions. See API Reference below for more info.
- <a href="#method-sendEvent">sendEvent</a>
- <a href="#method-sendException">sendException</a>
- <a href="#method-sendScreen">sendScreen</a>
- <a href="#method-sendSocial">sendSocial</a>
- <a href="#method-sendTimings">sendTimings</a>

You can also use event system to send a hit. In this case fire a `send-analytics` event
with required `type` property on the `detail` object which describes what king of hit
should be send. Possible values are: `pageview`, `screenview`, `event`, `social`,
`exception` or `timing`.

Other parameters depends on the type.

#### Sending `screenview` hit
```
// Inside Polymer element:
this.fire('send-analytics', {
  type: 'screenview',
  name: 'Some scree name' //required.
});
// or in JavaScript:
var event = new CustomEvent('send-analytics', {
  detail: {
    type: 'screenview',
    name: 'Some scree name' //required.
    bubbles: true
  }
});
document.dispatchEvent(event);
```

#### Sending `event` hit
```
// Inside Polymer element:
this.fire('send-analytics', {
  type: 'event',
  category: 'Some category', //required.
  action: 'Some action', //required.
  label: 'Some label',
  value: 123
});
// or in JavaScript:
var event = new CustomEvent('send-analytics', {
  detail: {
    type: 'event',
    category: 'Some category', //required.
    action: 'Some action', //required.
    label: 'Some label',
    value: 123,
    bubbles: true
  }
});
document.dispatchEvent(event);
```
#### Sending `exception` hit
```
// Inside Polymer element:
this.fire('send-analytics', {
  type: 'exception',
  description: 'Exception description', // required.
  fatal: true // default false
});
// or in JavaScript:
var event = new CustomEvent('send-analytics', {
  detail: {
    type: 'exception',
    description: 'Exception description', // required.
    fatal: true, // default false
    bubbles: true
  }
});
document.dispatchEvent(event);
```
#### Sending `social` hit
```
// Inside Polymer element:
this.fire('send-analytics', {
  type: 'social',
  network: 'Google +', // required.
  action: 'Share', // required
  target: 'https://www.shared.com/resource' // required
});
// or in JavaScript:
var event = new CustomEvent('send-analytics', {
  detail: {
    type: 'social',
    network: 'Google +', // required.
    action: 'Share', // required
    target: 'https://www.shared.com/resource', // required
    bubbles: true
  }
});
document.dispatchEvent(event);
```
#### Sending `timing` hit
```
// Inside Polymer element:
this.fire('send-analytics', {
  type: 'timing',
  category: 'Bootstrap', // required.
  variable: 'databaseInitTime', // required
  value: 123, // required
  label: 'Optional label'
});
// or in JavaScript:
var event = new CustomEvent('send-analytics', {
  detail: {
    type: 'timing',
    category: 'Bootstrap', // required.
    variable: 'databaseInitTime', // required
    value: 123, // required
    label: 'Optional label',
    bubbles: true
  }
});
document.dispatchEvent(event);
```

## Browsers compatibility
This element uses ES 6 features (arrow functions, fetch API).
It will not work in IE, Safari, iOS safari, Opera mini.
It will work for Edge 14.
It should work in other browsers.


## Custom metrics and dimensions
Use `<app-analytics-custom>` element as a child of `<app-analytics>` to set custom properties.
This metrics / dimensions will be used with every hit as long as this elements exists as a
children of the `<app-analytics>` element.

### Example
```
<app-analytics tracking-id="UA-XXXXXXX">
  <app-analytics-custom type="metric" index="1" value="5"></app-analytics-custom>
</app-analytics>
```

To send custom data with single hit only without creating `<app-analytics-custom>` children,
add `customDimensions` or `customMetrics` to the event detail object. Both objects must be
an array of custom definition objects that includs index and value.

### Example
```
this.fire('send-analytics', {
  'type': 'event',
  'category': 'Engagement',
  'action': 'Click',
  'label': 'Movie start',
  'customDimensions': [{
    index: 1, // index of the custom dimension
    value: 'Author name' // Value of the custom dimension
  }]
});
```



### Events
| Name | Description | Params |
| --- | --- | --- |
| app-analytics-permitted-changed | Firwed when Library `permitted` state changed. | permitted **Boolean** - Current state. |
| app-analytics-ready | An event fired when the Google Analytics configuration is set and ready to rock. It doesn't matter if tracking is permitted. The tracking object will be ready to enable tracking on user demand. | trackingId **String** - A tracking ID related to this configuration. |
| app-analytics-structure-debug | Fired when `debugEndpoint` is set to `true`. Contains a validation result from the GA server. The result is in following format: ```javascript {   "hitParsingResult": [{     "valid": false,     "hit": "GET /debug/collect?tid=fake\u0026v=1 HTTP/1.1",     "parserMessage": [{       "messageType": "ERROR",       "description": "The value provided for parameter ...",       "parameter": "tid"     }, {       "messageType": "ERROR",       "description": "Tracking Id is a required field ...",       "parameter": "tid"     }]   }] } ``` | debug **Object** - A validation result from the GA server. |
# app-analytics-custom

`<app-analytics-custom>` Sets a custom metric/dimmenstion for `<app-analytics>`.
Simply put this element as a child of the `<app-analytics>` element and all hits sent
to the GA server will contain this metric.

### Example
```
<app-analytics tracking-id="UA-XXXXXXX">
  <app-analytics-custom type="metric" index="1" value="5"></app-analytics-custom>
</app-analytics>
```
It will set a custom metric of index 1 to every hit with value 5.



### Events
| Name | Description | Params |
| --- | --- | --- |
| app-analytics-custom-changed | Fires when the metric/dimension has been set and should inform the app-analytics that it should use this data in hits. | name **String** - Name of the custom property. It will be string of `metric` or `dimension` with it's index. |
value **(String&#124;Number)** - The value of the custom property. |
| app-analytics-custom-removed | Fires when the element is removed from the DOM and `<app-analytics>` should unregister custom property. | name **String** - Name of the custom property to be removed. |
