[![Build Status](https://travis-ci.org/advanced-rest-client/cookie-jar.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/cookie-jar)  

# cookie-jar

A cookie storage and request / response manipulation for other that XHR
transport methods.

It updates the request headers before sending the request
to the transport agent. If the request URL matches any data in the datastore
(as described in [RFC6265](https://tools.ietf.org/html/rfc6265#section-5.1.3))
then it add the `cookie` header to the headers list.

The element also reacts on the response event and stores cookies set by the
server for furure use.

### Example
```
<cookie-jar></cookie-jar>
```

