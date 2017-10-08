[![Build Status](https://travis-ci.org/advanced-rest-client/chrome-xhr-request.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/chrome-xhr-request)  

# chrome-xhr-request

Element to send a request via Chrome extension as a proxy.

It takes ARC's request object and sends it to ARC proxy extension. It reports back
the response by sending `response-ready` event and `report-response`.

Details of the request / response events flow is described in the `request-panel`
documentation:
https://elements.advancedrestclient.com/elements/request-panel

### Example

```
<chrome-xhr-request></chrome-xhr-request>
```



### Events
| Name | Description | Params |
| --- | --- | --- |
| report-response | Fired when the response is no longer available for any alterations and can be displayed as a result. This event is only fired when `response-ready` is not canceled. See [response-panel](https://elements.advancedrestclient.com/elements/request-panel) documentation for details. | __none__ |
| response-ready | Fired when the response is ready to be reported. This event can be canceled. See [response-panel](https://elements.advancedrestclient.com/elements/request-panel) documentation for details. | __none__ |
