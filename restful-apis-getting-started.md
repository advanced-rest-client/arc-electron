---
description: This page is a starting guide for working with RESTtul APIs
---

# RESTful APIs getting started

## API

An API or Application Programming Interface, is a way of how one system talk to another. It is how Instagram application on your phone talks to backend server to request for data. Without a common interface that both systems understands \(server understand the shape of the data to send and the client understand how to use the data\) applications wouldn't be able to talk to each other.

## REST API

**RE**presentational **S**tate **T**ransfer is one of architectures of an API. The REST API is all about a **resource** \(some data stored somehow on the server\(s\)\) and the way how this resource is being transferred to/from the client and what operations are permitted on a resource.

In RESTful APIs you have endpoints that provides an access to the resource. An **endpoint** is an [URI](https://en.wikipedia.org/wiki/Uniform_Resource_Identifier) under which a data may or may not exist. An operation that can be performed on an endpoint is the **method**, also sometimes called the verb. There is a lit of well defined methods and each of them has different semantic meaning. 

{% hint style="info" %}
A method is not defined by REST API but rather by underlying HTTP protocol. APIs just use those methods to provide a way to get or modify the data on the server.
{% endhint %}

**POST** method semantically means that this operation creates a new entity \(new data\). 

**GET** method means requesting current state of the data. Get request can be about a list of resources \(like getting a list of Instagram posts\) or about getting a single resource \(requesting for a single Instagram post\). 

**PUT** operation semantically means updating the whole resource from the request message payload. 

**PATCH**, similar to PUT, but it means to update only this part of the resource that is defined in the request payload. Other properties are unchanged.

**DELETE** method removes the data from the system.

There are more defined methods you can use with your API. You can read about it on [MDN pages](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods).

## HTTP Request

Each API methods can be invoked by making a HTTP \(in most cases\) connection to a server and by sending specially prepared message that every HTTP server understands.

The core Advanced REST Client role is to provide an UI for you to provide only relevant data to communicate with the server and it takes care of generating valid HTTP message. It also reads the response from the server and presents it in a meaningful way to you so you don't waste your time decoding HTTP messages.

An HTTP message is consistent of 3 parts: start line, headers, and the message. Depending on the method data can be different in each part.

The **start line** describes the requests. It contains method name, the path you are accessing \(the endpoint\) and the protocol version.

```http
GET /endpoint HTTP/1.1
```

Optional **headers** part of the messages contains a list of meta information that describes the request or the client. There is a list of predefined request headers that every HTTP server understands. It is also possible to use custom headers but only some servers will understand it.

Each line in the headers part of the message represent a single header. A header starts with a name, then the headers separator - a colon - and after that the value of the header.

An example headers part:

```http
Host: httpbin.org
Content-Type: application/json
user-agent: advanced-rest-client
accept: */*
content-length: 110459
```

Each of the headers has a meaning and the server use the values to properly process your request.You can read more about request headers on [MDN request headers reference](https://developer.mozilla.org/en-US/docs/Glossary/Request_header) page.

Optional **payload** or **body** part is the resource or data being transferred to the server. The body part must be separated from the previous part with an empty line. The body can be anything: an image, a text, some other binary data, or combination of them.

{% hint style="warning" %}
Even though technically in some situations it is possible to add a body part to GET and HEAD messages but most popular clients \(including all HTTP clients in the web\) disallow setting the body for this two methods. HTTP specification does not specify body for those requests and there's no default behavior.
{% endhint %}

Full example HTTP message

```http
POST /post HTTP/1.1
Host: httpbin.org
Content-Type: application/json
content-length: 23

{
  "data": "value"
}
```

## HTTP Response

A HTTP response, the one that is sent from the server back to the client, is very similar to HTTP request. The two differences is that the start line is formatted differently and it has different set of headers \(called [response headers](https://developer.mozilla.org/en-US/docs/Glossary/Response_header)\). 

The start line consists of HTTP version, status code, and optional status message.

```http
HTTP/1.1 200 OK
```

Status code can be one of pre-defined by HTTP transport specification codes. And so:

* codes of group 100 \(1xx\) are used when a communication protocol is being negotiated; only HTTP client and server cares about this group
* codes of group 200 \(2xx\) indicates a success of the request
* codes of group 300 \(3xx\) indicates a redirect of some sort \(resource location changed, there are multiple choices of a response, etc\)
* codes of group 400 \(4xx\) indicates client errors \(client not authorized, resource does not exists, etc\)
* codes of group 500 \(5xx\) indicates server errors

Read more about response status code, with the full list of predefined codes, on [MDN status code](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status) page.

The most common status codes are:

* **200** - Successful request. If the request method is GET it means that the message part contains requested data,
* **201** - Created - When a request method was POST it indicates that the data entity has been created
* **301** - The resource has been moved permanently to another location \(endpoint\)
* **307** - The resource has been moved temporarily to another location \(endpoint\)
* **401** - Unauthorized access to the resource. It usually that authorization data are missing, invalid, or expired.
* **404** - Resource not found for given URI
* **500** - A server encountered a problem which resulted in exception; the request processing was aborted
* **503** - The server is not yet ready to accept connections.

ARC shows additional non-standard status code: 0 \(zero\). It is reported when the application wasn't able to establish a connection to the server. There may be multiple reasons for that but most commonly is either URL is invalid \(check host name spelling\) or the server is down. Less common: DNS cannot find the domain or is down.

