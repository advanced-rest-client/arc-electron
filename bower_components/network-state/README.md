[![Build Status](https://travis-ci.org/advanced-rest-client/network-state.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/network-state)  

# network-state

`<network-state>` A simple element to detect and notify online/offline swtatus

### Example
```
<network-state online="{{networkEnabled}}"></network-state>
```



### Events
| Name | Description | Params |
| --- | --- | --- |
| network-state-changed | Fired when online state changed. | online **Boolean** - The state of the network. |
