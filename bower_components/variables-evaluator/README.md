[![Build Status](https://travis-ci.org/advanced-rest-client/variables-evaluator.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/variables-evaluator)  

# variables-evaluator

`<variables-evaluator>` Variables evaluator for the Advanced REST Client

The element listens for `before-request` custom event and evaluates its
properties. This element is responsible for applying variables to the request.

This elements works with `variables-manager`. When evaluation has been requested
it asks the manager for list of current variables. After the list is evaluated
then the requested value is evaluated for the variables.

### Example
```
<variables-evaluator></variables-evaluator>
```

A value can be evaluated on demand by dispatching `evaluate-variable` custom
event. It will perform evaluation on the `value` property of the detail object.
The element adds a `result` property to the detail object which is a Promise
that resolves to a value.
The event is cancelled and it's propagation is stopped so other evaluators won't
perform the same task again.

### Example

```javascript
// requesting to create an environment
var event = new CustomEvent('evaluate-variable', {
  bubbles: true,
  composed: true,
  cancelable: true,
  detail: {
    value: 'The timestamp is now() and generating random() value'
  }
});
document.dispatchEvent(event);
console.log(event.defaultPrevented); // true
event.detail.result.then(function(value) {
  console.log(value);
})
.catch(function(cause) {
  console.log(cause.message);
});
```

