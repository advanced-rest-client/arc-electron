[![Build Status](https://travis-ci.org/advanced-rest-client/variables-manager.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/variables-manager)  

# variables-manager

A manager for environments and variables. Non UI element that manages variables
state and handle data storage.

### Example
```
<variables-manager></variables-manager>
```

This element is designed to work with browser's event system. That means that
each operation can be done by dispatching [CustomEvent](https://developer.mozilla.org/en/docs/Web/API/CustomEvent).

*Important** Events that request data update (create/update/delete) must be
cancellable. Otherwise the element will not handle the event at all.

When the update event is handled it is cancelled so 1) other managers that
exists in the DOM and listens fo the same event will not execute change 2)
after execution the manager dispatches the same event which is not cancellable.
UI element and other relevant parts of the application should handle only the
event that is not cancellable because it contains data **after** the update
has been stored in the datastore.

### Example
```javascript
// requesting to create an environment
var event = new CustomEvent('environment-updated', {
  bubbles: true,
  composed: true,
  cancelable: true,
  detail: {
    name: 'Test environment'
  }
});
document.dispatchEvent(event);

console.log(event.defaultPrevented); // true
```
The event requesting data change is cancelled and propagation of the
event is stopped. The same script should listen for the same event to
check for data update:

```javascript
window.addEventListener('environment-updated', function(e) {
  if (e.cancelable) {
    // This event requesting data change. We shouldn't be interested in this
    // event.
    return;
  }
  var environment = e.detail.value;
  console.log(environment._id, environment._rev);
});
```

Updated object will have updated `_rev` property and `_id`. This are
[PouchDb](https://pouchdb.com/api.html) properties to identify data in the
datastore.

## Events API

### selected-environment-changed

Changes currently selected environment in the manager. This event doesn't have
to be cancelable. The change trigges request to read variables for new
environment so `variables-list-changed` event is expected to be fired.

#### Properties
`value` (`string`) - Selected environment name

### environment-updated

Updates or creates new environment. This event have to be cancelable.
If the `value` property contains `_id` then the object will be updated.

#### Properties
`value` (`object`) - Environment datastore object.

### environment-deleted

Deletes an environment. This event have to be cancelable.

#### Properties
`value` (`string`) - The `_id` property of the environment object.

### environment-current

Request for current environment information. This event have to be cancelable.
The manager will set a `value` property on the details object so the event
source should read it after the event is dispatched.

Note: you have to set a detail object or otherwise it won't be created after
the event is dispatched.

```javascript
var event = new CustomEvent('environment-current', {
  bubbles: true,
  composed: true,
  cancelable: true,
  detail: {}
});
document.dispatchEvent(event);
if (event.defaultPrevented) {
  console.log(event.detail.value); // Current environment
}
```

### environment-list

Request for current environments list information. This event have to be
cancelable. The manager will set a `value` property on the details object so
the event source should read it after the event is dispatched.

Note: you have to set a detail object or otherwise it won't be created after
the event is dispatched.

Note: The value contains a list of user created environments (without
the `default` environment). Therefore it can be `undefined` or empty array.

```javascript
var event = new CustomEvent('environment-list', {
  bubbles: true,
  composed: true,
  cancelable: true,
  detail: {}
});
document.dispatchEvent(event);
if (event.defaultPrevented) {
  console.log(event.detail.value); // All available environments.
}
```

### variable-updated

Updates or creates new variable. This event have to be cancelable.
If the `value` property contains `_id` then the object will be updated.

#### Properties
`value` (`object`) - Variable datastore object.

The object must contain `variable` (variable name), `value` (it's body) and
`environment` properties. Otherwise an error will be throw.

### variable-deleted

Deletes an environment. This event have to be cancelable.

#### Properties
`value` (`string`) - The `_id` property of the variable object.

### variable-list

Request for current variables list information. This event have to be
cancelable. The manager will set a `value` property on the details object so
the event source should read it after the event is dispatched.

Note: you have to set a detail object or otherwise it won't be created after
the event is dispatched.

Note: The value contains a list of user created variables. Therefore it can be
`undefined` or empty array.

Note: Additional `environment` property is set to the `detail` object to indicate
to which environment the variables belongs.

```javascript
var event = new CustomEvent('variable-list', {
  bubbles: true,
  composed: true,
  cancelable: true,
  detail: {}
});
document.dispatchEvent(event);
if (event.defaultPrevented) {
  console.log(event.detail.value); // All available variables.
  console.log(event.detail.environment); // Environment name.
}
```

### Styling

The element doesn't provide any UI.



### Events
| Name | Description | Params |
| --- | --- | --- |
| environment-deleted | Fired when the environment has been deleted from the data store.  Event fired by this element is not cancellable. While request to delete an evironment is cancellable (implementations cancels the event so it will be deleted only once) this event isn't, to differentiate between this two states. Generally: cancellable event - request for change, not cancellable event - change has been applied to the data in the data store. | value **String** - Id of the environment in the data store |
rev **String** - Updated `_rev` after the environment was deleted. |
| environment-updated | Fired when the environment has been saved / updated in the data store.  Event fired by this element is not cancellable. While request to update an evironment is cancellable (implementations cancels the event so it will be updated only once) this event isn't, to differentiate between this two states. Generally: cancellable event - request for change, not cancellable event - change has been applied to the data in the data store. | value **Object** - Updated PouchDB document (with new `_rev`). |
| environments-list-changed | Fired when the list of available custom envrionments have been updated. Usually it means that the element has been initialized or the `environment` property has changed. UIs should update list of available environments from this events.  The list do not contain the default environment. | value **Array** - Array of PouchDB items with `_id` and `_rev` that should be present when updating the envitonment. |
| selected-environment-changed | Fired when selected environment has changed. This event is not fired if the change has been causes by the `selected-environment-changed` fired by other element. | value **String** - Name of the selected environment. |
| variable-deleted | Fired when the variable has been deleted from the data store.  Event fired by this element is not cancellable. While request to delete a variable is cancellable (implementations cancels the event so it will be deleted only once) this event isn't, to differentiate between this two states. Generally: cancellable event - request for change, not cancellable event - change has been applied to the data in the data store. | value **String** - Id of the variable in the data store |
rev **String** - Updated `_rev` after the variable was deleted. |
| variable-updated | Fired when the variable has been added to / updated in the data store.  Event fired by this element is not cancellable. While request to delete an evironment is cancellable (implementations cancels the event so it will be deleted only once) this event isn't, to differentiate between this two states. Generally: cancellable event - request for change, not cancellable event - change has been applied to the data in the data store. | value **Object** - Updated PouchDB document (with new `_rev`). |
| variables-list-changed | Fired when the list of variables for current environment has been read and set. UIs should update list of current varables from this events. | value **Array** - Array of PouchDB items with `_id` and `_rev` that should be present when updating the envitonment. |
environment **String** - Name of the environment the the variables belongs to. |
