[![Build Status](https://travis-ci.org/advanced-rest-client/paper-autocomplete.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/paper-autocomplete)  

# paper-autocomplete

# `<paper-autocomplete>`

Use `paper-autocomplete` to add autocomplete functionality to the input elements.
It also works wilt polymer inputs.

The element works with static list of suggestions or with dynamic (asynchronous)
operation that require calling te backend or local datastore.
In second case you should set `loader` property which will display a loader animation
while results are loaded.

You must associate suggestions with the input field. This can be done by passing
an element reference to the `target` property.

## Example:

### Static suggestions
```
<paper-input label="Enter fruit name" id="fruits"></paper-input>
<paper-autocomplete
  id="fruitsSuggestions"
  target="[[fruits]]"
  on-selected="_fruitSelected"></paper-input-autocomplete>

<script>
  document.querySelector('#fruitsSuggestions').source = ['Apple', 'Orange', 'Bananas'];
</script>
```
### Dynamic suggestions
```
<paper-input-container>
  <label>Enter friut name</label>
  <input is="iron-input" type="text" value="{{async::input}}" id="asyncField" />
</paper-input-container>
<paper-autocomplete loader id="fruitAsync" on-query="_asyncSuggestions"></paper-input-autocomplete>

<script>
  document.querySelector('#fruitAsync').target = document.querySelector('#asyncField');
  document.querySelector('#fruitAsync').addEventListener('query', (e) => {
    var query = e.detail.value;
    asyncQuery(query, (suggestions) => {
      document.querySelector('#fruitAsync').source = suggestions;
    });
  });
</script>
```

## Displaying the suggestions
Suggestions array can be either an array of strings or objects.
For strings, displayed in the list and inserted to the input field value is the same item.

You can set different list item display value and value inserted into the field when the array contains
onject. Each object must contain `value` and `display` properties where `value` property
will be inserted into the text field and `display` will be used to display description inside the list.

## Query event
The `query` event is fired when the user query change in the way so the element is
not able to display suggestions properly.
This means if the user add a letter to previously entered value the query event will not
fire since it already have list of suggestion that should be used to filter suggestions from.
And again when the user will delete a letter the element will still have list of
source suggestions to filter suggestions from.
However, if the user change the query entirely it will fire `query` event
and the app will expect to `source` to change. Setting source is not mandatory.

## Preventing from changing the input value
To prevent the element to update the value of the target input, listent for
`selected` event and cancel it by calling `event.preventDefault()` function.

## Styling
Suggestions are positioned absolutely! You must include relative positioned parent to contain the suggestion
display in the same area.
Use CSS properties to position the display in the left bottom corner of the input field.

`<paper-autocomplete>` provides the following custom properties and mixins
for styling:

| Custom property | Description | Default |
----------------|-------------|----------
| `--paper-autocomplete` | Mixin applied to the display | `{}` |



### Events
| Name | Description | Params |
| --- | --- | --- |
| query | Fired when user entered some text into the input. It is a time to query external datastore for suggestions and update "source" property. Source should be updated event if the backend result with empty values and should set the list to empty array.  Nore that setting up source in response to this event after the user has closed the dropdown it will have no effect at the moment. | value **String** - An entered phrase in text field. |
| selected | Fired when the item was selected by the user. At the time of receiving this event new value is already set in target input field. | value **String** - Selected value |
