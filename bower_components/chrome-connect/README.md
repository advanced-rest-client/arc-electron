[![Build Status](https://travis-ci.org/advanced-rest-client/chrome-connect.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/chrome-connect)  

# chrome-connect

An element to be used in Chrome extension to connect to another extension

### Example
```html
<chrome-connect extension-id="apcedakaoficjlofohhcmkkljehnmebp" on-message="_onExternalMessage" connected="{{connected}}"></chrome-connect>
<script>
document.querySelector('chrome-connect')
.postMessage({
  hello: 'world'
});
</script>
```

The element connects automatically to external extension if the extension conect
to this extension, this extension is not connected yet and the external extension
is whitelisted in the `allowedClients` property.



### Events
| Name | Description | Params |
| --- | --- | --- |
| error | Fires when error ocurred. | An **Object** - error object. |
| message | Fires when message has been received. | Message **Any** - received from externall extension / app. |
