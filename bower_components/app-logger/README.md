[![Build Status](https://travis-ci.org/advanced-rest-client/app-logger.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/app-logger)  

# app-logger

A logger for web components. Allows to print messages and save them into the datastore

It listening for `app-log` events and logs evens when the event occure.
The event detail object may have `level` property which describes log level of the message.
It should also contain `message` property with the message to log.

See `level` property documentation for logging level details.

### Example

#### Handling info events only

```html
<app-logger level="info"></app-logger>
```

#### Handling all events

```html
<app-logger></app-logger>
```

