[![Build Status](https://travis-ci.org/advanced-rest-client/url-history-saver.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/url-history-saver)  

# url-history-saver

# url-history-saver web component for ARC

An element that saves Request URL in the history and serves list of saved URLs.

The API of this element can be called directly and it is event based.
You can either call `query()` or `store()` function or use corresponding
`url-history-query` and `url-history-store` custom events

The `url-history-query` event expects the `q` property set on the `detail`
object. It will be passed to the `query()` function and result of calling this
function is set on detail's `result` property.

### Example

```javascript
var event = new CustomEvent('url-history-query', {
  detail: {
    q: 'http://mulesoft.com/path/'
  },
  cancelable: true,
  bubbles: true, // if not fired on window object
  composed: true // if fired in shaddow DOM
});
document.dispatchEvent(event);
```

The `url-history-store` expects to read a `value` property of the `detail`
object and it passes it to the `store()` function. Unlike the other event,
it doesn't adds promise to the details object.

### Example

```javascript
var event = new CustomEvent('url-history-store', {
  detail: {
    value: 'http://mulesoft.com/path/'
  },
  cancelable: true,
  bubbles: true, // if not fired on window object
  composed: true // if fired in shaddow DOM
});
document.dispatchEvent(event);
```

Both events are cancelled and propagation of the event is stopped. Therefore
the event should have to be dispatched with `caneclable` flag set to true.

The element listens for events on the `window` object so it can be placed
anywhere in the DOM.

### Example

```html
<body>
  <url-history-saver></url-history-saver>
</body>
```

