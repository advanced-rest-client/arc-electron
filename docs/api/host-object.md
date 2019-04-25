# Host object

Hosts allows to connect to a server using mapped value as a host and use `host` header from the mapping.
This allows to (for example) test virtual hosts on your server when the domain is not yet connected to the IP address.

## Example

```json
{
  "comment": "",
  "enabled": true,
  "from": "domain.com",
  "to": "127.0.0.1",
  "updated": 1555783444231
}
```

The following example wiil cause the request to the URL `https://domain.com/endpoint` to be send to `https://127.0.0.1/endpoint`. The `Host` header will contain `domain.com` instead of `127.0.0.1`.


```
Connecting to 127.0.0.1 ...

GET /endpoint HTTP/1.1
Host: domain.com
Connection: close

```
