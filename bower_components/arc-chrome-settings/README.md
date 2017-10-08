[![Build Status](https://travis-ci.org/advanced-rest-client/arc-chrome-settings.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/arc-chrome-settings)  

# arc-chrome-settings

An element that reads and sets ARC's settings in Chrome storage.

Because Google killed Chrome apps this element is deprecated and will be replaced by
indexDb representation of it.

### Example

```html
<arc-chrome-settings on-settings-changed="_settingsChanged"></arc-chrome-settings>

<script>
var event = new CustomEvent('settings-read', {
  detail: {}, // It always has to be set.
  cancelable: true,
  bubbles: true
});
document.body.dispatchEvent(event);
event.detail.result(settings => console.log(settings));
</script>
```

```html
<arc-chrome-settings></arc-chrome-settings>

<script>
var event = new CustomEvent('settings-changed', {
  detail: {
    name: 'test',
    value: 'test'
  },
  cancelable: true,
  bubbles: true
});
document.body.dispatchEvent(event);
event.detail.result(() => console.log('Settings updated'));
</script>
```



### Events
| Name | Description | Params |
| --- | --- | --- |
| settings-changed | Fired when a setting has changed.  This event is not cancelable. Should be used by view elements to update their state. | name **String** - Setting key name |
value **(String&#124;Object)** - The value of the setting |
area **String** - Source storage area (local, sync, managed) |
