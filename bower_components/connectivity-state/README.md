
`<connectivity-state>` An element that detects online/offline states and informs about it other compopnents

Checking conectivity in browser is a tricky task. Browsers vendors can't agree
on what the online/offline status means and therefore event if the browser
says that it has intentet connection in reality it may not (because it may
have LAN aceess).

This element is doing whatever it's available in current browser to
inform other element about current conectivity state.

*Note: You can be sure that if the status is `offline` the browser is offline.
But when the status is onLine it may mean that there is a network konnected
but there's no internet connection (and therefore you are offline for the
outside world).**
In the element, if the `online` attribute is set to `false` the the app
is offline but when it's set to true it probably is online but may not have
access to the internet.

P.S.
Why there's not 3rd state alonside 'online' and 'offline' that will tell that
you are online meaning you have a network active but you are not have access to
the outside world?


### Example
```
<connectivity-state online="{{isOnline}}"></connectivity-state>
```
Other elements and/or app can access this information via Polymer's data binding system or:

1) By listening for an event `connectivity-state-changed`
```javascript
document.addEventListener('connectivity-state-changed', (e) => {
  // e.detail.online; (boolean, false is offline)
});
```
2) Reading value from the `<iron-meta>` element
```html
<iron-meta key="connectivity-state" value="{{networkOnline}}"></iron-meta>
```
3) In javascript using one of this methods:
```javascipt
// When Polymer is available in current namespace.
new Polymer.IronMetaQuery({key: 'connectivity-state'}).value;
// Otherwise
document.createElement('iron-meta').byKey('connectivity-state');
// false if offline.
```
Methods above are equal and can be used with this element.

