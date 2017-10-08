
`<app-pouchdb-collate>` A component that support a pouchdb-collate plugin

Basically it creates an primary indexd (the `id` property of the object)
that can be queried.

From plugin's documentation page (https://github.com/pouchdb/collate/):

> if you want to sort your documents by many properties in an array, you can do e.g.:
```javascript
var myDoc = {
  firstName: 'Scrooge',
  lastName: 'McDuck',
  age: 67,
  male: true
};
// sort by age, then gender, then last name, then first name
myDoc._id = pouchCollate.toIndexableString(
  [myDoc.age, myDoc.male, mydoc.lastName, mydoc.firstName]);
```
> The doc ID will be:
```
'5323256.70000000000000017764\u000021\u00004McDuck\u00004Scrooge\u0000\u0000'
```
Then it will be possible to get sorted documents much faster.

### Example
Equivalent of the example above is following:
```html
<app-pouchdb-collate
  sort='["age","male","lastName","firstName"]'
  doc="{{doc}}">
</app-pouchdb-collate>
```
When the `doc` changes (the whole object, not a subpropery) and the `_id` is
not set then it will set the `_id` on the `doc` automatically.

You can also call a `getId()` function to generate an `_id`:
```javascript
let _id = this.$.collate.getId(doc)
```
Or if the `doc` attribute is set you can call this function without argument:
```javascript
let _id = this.$.collate.getId();
```

The key can be decoded using the `fromKey(_id)` function. It will return
an array of values encoded in the keys. Order of elements in the array is the
same as an order in the `sort` array during encoding.

Finally event based API allows to put a single element in the document and
communicate with it using HTML events. `<app-pouchdb-collate>` will handle
the `app-pouchdb-collate-index` event and in result set the `_id` propery to the
event's details object. The event is required to contain a `sort` and `doc`
properties on the event's detail object. If it's not present then the element
will try to use values defined in the element's attributes. If they are not
set then it will return `null` `_id`'s value.

### Event based example
Somewhere in the document:
```javascript
let event = this.$.fire('app-pouchdb-collate-index', {
  'doc': this.doc,
  'sort': ['age', 'male', 'lastName', 'firstName']
});
assert.isString(event.detail._id);
```
Note: The event based API won't change the `doc` object. You have to set the
`_id` value on the doc. This is because of data binding system and changing
the object in the event may not cause the change listeners to go off.

Pure JavaScript example of above:
```javascript
var event = new CustomEvent('app-pouchdb-collate-index', {
  detail: {
    'doc': this.doc,
    'sort': ['age', 'male', 'lastName', 'firstName']
  }
});
document.dispatchEvent(event);
assert.isString(event.detail._id);
```

To decode key fire an `app-pouchdb-collate-decode` event with the `_id`
property in it's detail object. As a result the `detail` object will contain
`result` property with the array of values.

The event handled by the element will be canceled and prevented from bubbling.

### Empty values
If the key for `sort` array is not present in the `doc` object it will be
transformed into `null` but never dropped. In this case PouchDB will treat it
as an empty value. Query like `lastName $exists true` will omit the value
if `lastName` was no set.

