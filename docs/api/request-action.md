# RequestAction

An object representing an action to be executed before the request is made.

## Example

```json
{
  "variables": [{
    "variable": "AnypointToken",
    "action": "store-variable",
    "value": "unused",
    "enabled": true
  }]
}
```

## Description

### variables

`Array` A list of variables to manipulate before executing the request.


__variables.variable__

`String`. Name of the variable to update

__variables.action__

`String`. `store-variable` to save value in the datastore or `assign-variable` to store variable in memory only. In memory values always overrides stored values.

__variables.value__

`String`. New value. Can contain other variables, like `Bearer ${authToken}`.

__variables.enabled__

`Boolean`. Whether or not the action is enabled. It is always rendered in the UI but excludes it from the execution.
