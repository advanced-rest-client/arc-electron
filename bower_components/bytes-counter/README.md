[![Build Status](https://travis-ci.org/advanced-rest-client/bytes-counter.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/bytes-counter)  

# bytes-counter

An element that computes number of bytes in `String`, `ArrayBuffer`, `Blob`
(and therefore `File`) and in supported browsers `FormData`.

Note that Safari is excluded from FormData tests because there's some bug in
WebKit iplementation of the Request object and it doesn't read FormData
properly. Chrome had similar bug but they fixed it already. See demo page
to check if your browser support FormData.

### Example
```
<textarea value="{{value::input}}"></textarea>
<bytes-counter value="[[value]]" bytes="{{bytes}}"></bytes-counter>
```

In the example above the `bytes` variable contains size of the input.

Note that computations are synchronous and there is a delay between setting the
`value` property (or calling `calculate()` function) and getting a result.

