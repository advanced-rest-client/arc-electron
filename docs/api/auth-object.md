# Auth object

An object represeting authorization configuration for the request.

## Example

```json
{
  "type": "oauth2",
  "settings": {}
}
```

The `type` property represents auhorization method type. One of `basic`, `ntlm`, `digest`, `oauth2`, and `oauth1`.

The `settings` property vary and depends on the `type.`

### Basic

```json
{
  "type": "basic",
  "settings": {
    "hash": "dGVzdDp0ZXN0",
    "password": "test",
    "username": "test"
  }
}
```

### NTLM

```json
{
  "type": "ntlm",
  "settings": {
    "domain": "my-domain",
    "password": "test",
    "username": "test"
  }
}
```

### Digest

```json
{
  "type": "digest",
  "settings": {
    "username": "user",
    "realm": "realm",
    "nonce": "nonce",
    "response": "58f63c763ba73a09643eece458124266",
    "opaque": "opaque",
    "qop": "auth",
    "nc": "00000001",
    "cnonce": "edad6fdf6f5cbc3"
  }
}
```

### OAuth2 - Implicit (access token) type

```json
{
  "type": "oauth2",
  "settings": {
    "type": "implicit",
    "clientId": "my-client-id",
    "accessToken": "",
    "tokenType": "Bearer",
    "scopes": [
      "profile"
    ],
    "deliveryMethod": "header",
    "deliveryName": "authorization",
    "authorizationUri": "https://auth.domain.com/auth",
    "redirectUri": "https://auth.domain.com/callback"
  }
}
```

### OAuth2 - Authorization code type

```json
{
  "type": "oauth2",
  "settings": {
    "type": "authorization_code",
    "clientId": "my-client-id",
    "accessToken": "",
    "tokenType": "Bearer",
    "scopes": [
      "profile"
    ],
    "deliveryMethod": "header",
    "deliveryName": "authorization",
    "clientSecret": "secret",
    "authorizationUri": "https://auth.domain.com/auth",
    "accessTokenUri": "https://auth.domain.com/token",
    "redirectUri": "https://auth.domain.com/callback"
  }
}
```

### OAuth2 - Client credentials type

```json
{
  "type": "oauth2",
  "settings": {
    "type": "client_credentials",
    "clientId": "my-client-id",
    "accessToken": "",
    "tokenType": "Bearer",
    "scopes": [
      "profile"
    ],
    "deliveryMethod": "header",
    "deliveryName": "authorization",
    "clientSecret": "secret",
    "accessTokenUri": "https://auth.domain.com/token"
  }
}
```

### OAuth2 - Password type

```json
{
  "type": "oauth2",
  "settings": {
    "type": "password",
    "clientId": "my-client-id",
    "accessToken": "",
    "tokenType": "Bearer",
    "scopes": [
      "profile"
    ],
    "deliveryMethod": "header",
    "deliveryName": "authorization",
    "username": "username",
    "password": "password",
    "accessTokenUri": "https://auth.domain.com/token"
  }
}
```

### OAuth1

```json
{
  "type": "oauth2",
  "settings": {
    "consumerKey": "key",
    "consumerSecret": "secret",
    "token": "token",
    "tokenSecret": "token-secret",
    "timestamp": 1555778946,
    "nonce": "QxVd8wL3CFG4Q1ULnG0bxWNIPmsdu3mK",
    "realm": "realm",
    "signatureMethod": "HMAC-SHA1",
    "requestTokenUri": "https://auth.domain.com/token",
    "accessTokenUri": "https://auth.domain.com/auth",
    "redirectUri": "https://auth.domain.com/callback",
    "authTokenMethod": "POST",
    "authParamsLocation": "authorization",
    "authorizationUri": "https://auth.domain.com/login"
  }
}
```
