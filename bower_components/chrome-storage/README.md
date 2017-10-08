# chrome-storage
A Chrome Apps component for Storage API.

Use the chrome.storage API to access local or sync storage in Chrome.

## Permissions
You need to declare "storage" permission in your manifest file.

    ...
       "permissions": [
          "storage"
       ],
    ...
API Docs: https://developer.chrome.com/apps/storage

Example:

    <chrome-storage
      storage="sync"
      name="myKey" value="{{value}}"
      on-read="onRead"
      on-error="onError"
      on-bytes-used="onBytesUsed"
      on-saved="onSaved"
      on-removed="onRemoved"
      on-clear="onCleared"></chrome-storage>

## API
### Events
| Event | Description | Parameters |
| --- | --- | --- |
| `read` | Fired when data was read from the storage. Read data is accessible via `value` property | _none_ |
| `error` | Fired when error occurred | - `String` message - Error message |
| `clear` | Fired when the store has been cleared | _none_ |
| `bytes-used` | Fired when store data usage has been read. | - `Number` bytes - Number of bytes used by the given key or whole storage |
| `saved` | Fired when data has been stored into the store. | _none_ |
| `removed` | Fired when data has been removed from the store. | _none_ |

### Properties
| Property | Description | Type | Default |
| --- | --- | --- | --- |
| storage |  A storage area to use.  It can be either `sync`, `local` or `managed`. Note that `managed` storage area is read only. | String | `local` |
| name | A property name to observe. A name can be either key name or a path to the key. For example `path.to.my.0.key` is valid path. | String | _none_ |
| value | Value read from the store or to be set in store. Chrome storage can store any serializable object. | String or Object or Number or Boolean | _none_ |
| auto | True when value change should save data automatically. | Boolean | `false` |
| defaultValue | A default value to read from the storage for given key. | String or Object or Number or Boolean | _none_ |
| valueAs | If set, it must be a valid function name. It will be called to wrap the object with. | String | _none_ |

### Methods
#### `read()`
Gets one or more items from storage.

This function will set a `this.value` property and fire `read` event.

If `valueAs` property is set then the element will attempt to wrap the value with the object so the final `value` will be type of `valueAs`. Note that the function name must by accessible from `window` object.

For example:
```javascript
this.name = 'not-existing-key';
this.defaultValue = 2;
this.valueAs = 'String';
this.read();
// result will be "2" even if type of original value was (Number) 2.
```
If `name` is a path (with dot notation, eg. 'path.to.key') then the `value` will contain value of the `key` property instead of whole property (as normally would).

**returns** _nothing_

#### `getBytesInUse()`
Gets the amount of space (in bytes) being used by one or more items.
* In order to work properly this function require a single key or list of keys to get the total usage for.
* An empty list will return 0.
* Set `name` to `null` to get the total usage of all of storage.

This function fires `bytes-used` event.

**returns** _nothing_

#### `store()`
Sets multiple items.

If `this.name` is an object then each key/value pair will be used to update storage with. Any other key/value pairs in storage will not be affected.

Primitive values such as numbers will serialize as expected. Values with a typeof "object" and "function" will typically serialize to {}, with the exception of Array (serializes as expected), Date, and Regex (serialize using their String representation).

`this.value` must be an object or string. If name is a string then the value will be transformed to object where path is a `this.name`.

This function fires `saved` event.

**returns** _nothing_

#### `remove()`
Removes one or more items from storage.

Note that this function will fail if the `this.name` if not either a string or array.

This function fires `removed` event.

**returns** _nothing_

#### `clear()`
Removes all items from storage.

This function fires `clear` event.

**returns** _nothing_
