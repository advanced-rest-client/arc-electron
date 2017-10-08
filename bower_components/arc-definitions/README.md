[![Build Status](https://travis-ci.org/advanced-rest-client/arc-definitions.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/arc-definitions)  

# arc-definitions

Request / response information data used in ARC.
Contains definitions for status codes and request and response headers.

The fileds may be empty when not yet initialized.

The `<arc-definitions>` element listens at its nearest shadow root boundary for query events.
Other elements can send the `query-headers` and `query-status-codes` events that will be
handled by this element. Events will be stopped from propagation. Event returned value will
contain the data.

### Example
```
<arc-definitions
  requests="{{requestsDefinitions}}"
  responses="{{responsesDefinitions}}"
  status-codes="{{statusCodesDefinitions}}"></arc-definitions>
```

### Firing events Example

```javascript
// Polymer 1.x
let event = this.fire('query-headers', {
  'type': 'request', // or response, mandatory
  'query': 'Acce' // finds all request headers containing `acce` in their name
}, {
  cancelable: true
});
console.log(event.defaultPrevented); // true
let headers = event.detail.headers;  // Array[]
```

```javascript
// Vanilla JavaScript
var event = new CustomEvent('query-headers', {
  detail: {
    'type': 'request',
    'query': 'Acce'
  },
  bubbles: true,
  composed: true,
  cancelable: true
});
document.body.dispatchEvent(event);
console.log(event.defaultPrevented); // true
let headers = event.detail.headers;  // Array[]
```

```javascript
let event = this.fire('query-status-codes', {
  'code': 200
}, {
  cancelable: true
});
console.log(event.defaultPrevented); // true
let statusCode = event.detail.statusCode;  // Array[]
```

```javascript
// Vanilla JavaScript
var event = new CustomEvent('query-status-codes', {
  detail: {
    'code': 200
  },
  bubbles: true,
  composed: true,
  cancelable: true
});
document.body.dispatchEvent(event);
console.log(event.defaultPrevented); // true
let statusCode = event.detail.statusCode; // Array[]
```

The event should be cancellable so the element can cancel it and other
instances of this element will not handle it again. Though it's not an error
dispatching this event as not cancelable.

If the element was handled by the element and the event is cancelable then
event's `defaultPrevented` flag is set to `true`.

If query event do not contain query value then all values for given query type
will be returned.

For example following event returns all request headers

```javascript
let event = this.fire('query-headers', {
  'type': 'request',
  'query': '' // it might be not defined.
}, {
  cancelable: true
});
```

