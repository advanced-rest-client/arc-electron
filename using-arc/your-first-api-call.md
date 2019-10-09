---
description: This guide describes how to make your first request to the API endpoint
---

# Your first API call

## The request editor

You will use the request panel to enter request properties like method, URL, headers, and the body.

![Empty request panel](../.gitbook/assets/image%20%2814%29.png)

### Request URL

The request URL it is an API endpoint URL you want to connect to. The input field allows to provide any valid URL data, like, `https://api.domain.com/endpoint?param=value`

![URL editor with url](../.gitbook/assets/image%20%2810%29.png)

{% hint style="info" %}
The URL is passed to the HTTP client unprocessed to give you more control over request parameters. This means that special characters must be encoded before sending the request.
{% endhint %}

#### URL editor

The URL editor has an alternative view to provide URL data. It allows to define each part of the URL separately. It also has a convenient way of defining query parameters.

![](../.gitbook/assets/image%20%2817%29.png)

Query parameters can be added, removed, or disabled. 

You can add as much query parameters as you need. Names and values must be valid query parameter string.  

![Invalid parameters values](../.gitbook/assets/image%20%2819%29.png)

Don't worry, when the application say that the parameter is invalid you can use "Encode URL" button to fix the problem. 

![Encoded correct values in the URL editor](../.gitbook/assets/image%20%2821%29.png)

{% hint style="info" %}
Once encoded value will be encoded again producing invalid entry. When you want to encode values again, decode the values first and then encode.
{% endhint %}

To remove query parameter just press the "X" button on the right-hand side of the parameters.

You can also disable query parameter using the toggle button on the left-hand side. This option removes the parameter from the final URL but keeps it in the editor so you can test various scenarios. 

### Request method

The method tells what kind of operation is to be performed on the resource. In REST methods describe type of the operation:

* POST - create resource operation
* GET - read operation, like list resources, get a resource
* PUT, PATCH - update a resource
* DELETE - deletes a resource

There are more less commonly used methods and Advanced REST Client support them all. You can even define custom method by selecting "custom" option in the drop down.

 

![Custom HTTP method](../.gitbook/assets/image.png)

{% hint style="warning" %}
Custom methods are allowed but some clients may not fully support them.
{% endhint %}

### HTTP headers

The headers are additional meta-information send to the server to inform it how to process the message. There are well defined request and response headers like `content-type` or `accept`. Your server, however, may require custom headers. The headers editor allows you to define this headers.

{% hint style="info" %}
ARC does not generate any request headers with exception of `Host` header which is required to make a request. Unlike other HTTP clients, only headers that are defined in the editor are send to the server.
{% endhint %}

By default ARC renders a form view with autofill options when defining headers.

![Headers editor - form view](../.gitbook/assets/image%20%282%29.png)

When a header is recognized as one of the standard header is renders a help icon that opens a description for the header.

![Hint message for known header](../.gitbook/assets/image%20%2811%29.png)

Similarly to query parameters editor, headers can be temporarily disabled to test various options. When the checkbox is unselected then the header value is kept in the editor but it is excluded from the request.

For more advanced use you can switch to "Source view" which renders a text editor to provide header values manually.

![Source view in headers editor](../.gitbook/assets/image%20%2816%29.png)

The editor support suggestions for header names and values.

### Request body

Body is the message you want to send to the server. In RESTful APIs this is the resource you create or update.

![JSON body editor](../.gitbook/assets/image%20%286%29.png)

{% hint style="info" %}
GET and HEAD methods cannot define a body on a request. Even though it is technically possible, clients probably won't work with such request. 
{% endhint %}

{% hint style="info" %}
You don't need to set Content-Length header. It is added automatically when preparing the message. When this header is defined in the headers list it will be used instead. This way you can test your server for invalid input.
{% endhint %}

The body editor supports syntax highlighting for several content types like JSON and XML. Use the drop down type selector to switch between some popular media types.

Form data editor can be a form based editor that allows you to enter and encode the data if needed.

![x-www-urlencode media type editor](../.gitbook/assets/image%20%288%29.png)

Multipart values are also supported. The editor allows you to add both file and text part to the message. You need to provide a name of the part and the value \(either a text for text part or a file for file part\). Additionally you can define a media type for the text part.

![Multipart data editor](../.gitbook/assets/image%20%284%29.png)

ARC takes care about `content-type` header for multipart data. It is generated automatically when sending the request to comply with multipart specification.

{% hint style="danger" %}
Do not modify content-type header in the headers editor when using multipart data. When the "boundary" is not the same as in generated message then the request will fail.
{% endhint %}

When your request is ready you can press the "send" button to initialize the request. This sends the request data to ARC's HTTP client which generates HTTP message, makes a connection, send the message, and awaits the response.

Try it with this example request data

```
Method: POST
URL: https://httpbin.org/post
Headers:
Content-Type: application/json
Accept: application/json
x-custom-header: header value
Payload:
{
  "page": "test"
}
```

## The response view

When the response is ready ARC renders a response view below the request panel. By default it renders information about response status, processing time, and the received message.

![Response view](../.gitbook/assets/image%20%2812%29.png)

In most cases the response is parsed and syntax is highlighted for your convenience. You can see the original message by pressing "Source view" button.

![Source view in the response view](../.gitbook/assets/image%20%281%29.png)

JSON response has additional option to render it in table view. It is an alternative way of presenting the data.

![JSON data table](../.gitbook/assets/image%20%285%29.png)

Advanced REST Client collect detailed information about the request, response, and the process of receiving the response. Data like request and response headers, redirects, connection timings are available under "Details" panel.

**Request headers** contains a final list of headers sent to the server. It also has a view that renders full HTTP message sent to the server.

![](../.gitbook/assets/image%20%2813%29.png)

In this case the HTTP client added Host, Connection, and Content-Length headers to manage the the connection process and inform the server about the content.

The **response headers** contains a list of all headers received from the server.

![Response headers](../.gitbook/assets/image%20%2820%29.png)

{% hint style="success" %}
Cookies are processed like a web browser would process it. Cookies are stored in internal protected storage and applied to a request send to the same domain and path.
{% endhint %}

The **redirects** panel renders a response for each redirect that happened during the request. It shows information where the request was redirect to, status code, and the list of headers.

![](../.gitbook/assets/image%20%289%29.png)

{% hint style="info" %}
Only the final response is reported in the response body view.
{% endhint %}

{% hint style="info" %}
Cookies are processed when redirecting the request as it would be for direct request.
{% endhint %}

The **timings tab** renders detailed information about each part of the request process like DNS lookup, connecting, SSL negotiation, message sending, and receiving time. 

If the request was redirected this will render timing information for each redirect.

![Timings panel with redirects](../.gitbook/assets/image%20%2818%29.png)

{% hint style="info" %}
The reported timing in the main response view is for the last request in the redirects chain. The timing panel shows the total time for all requests.
{% endhint %}

