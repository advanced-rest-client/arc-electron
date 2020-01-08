---
description: Learn basics of web APIs in our Web APIs school
---

# Web APIs basics

Before we begin, this article mostly focuses on REST APIs and ignores other types. This will be described in separate articles.

A web API, or web Application Programming Interface, is a formalized way of how one application talk to another. The web prefix means that the communication is based on HTTP protocol. Because the transport protocol is not relevant at this time you don't have to worry about it. 

To visualize this, consider having an application on your smartphone that renders a feed of pictures of people you follow. The application, when running on your phone, knows nothing about what others recently posted on their phones. To get the data about others activities the application has to communicate with the server - an application running on a remote machine publicly available over internet. Without the API the client application \(on your phone\) wouldn't be able to understand what server is talking about. It wouldn't even know how to request for latest updates!

Web APIs come in handy is such situation.They allow to define the vocabulary the applications \(the client and the server\) are using while talking to each other \(we will call them schemas or more widely resources\),  and the syntax \(endpoints and methods\).

On a the most basic level you need 2 to 4 ingredients to allow applications to communicate to each other:

1. Endpoint - the location of the resource,
2. Method, sometimes called the verb or an operation,
3. Optional headers that helps the recipient to read the message properly
4. Optional body if required \(I will explain later\)

To perform any operation on a resource, whether it is a read or create operation, the endpoint and  the method is always required to start communicating with the server. Endpoint tells where the resource is located \(the URI or Uniform Resource Identifier\). It is a unique address in the internet where the resource exists. The method has a semantic meaning and  tells what kind of operation can be performed on the resource. The most basic operations are:

* GET - read the resource or a collection of the resource
* POST - create a resource
* DELETE - remove existing resource
* PUT - update existing resource

There are more less common methods like PATCH \(partial update\), OPTIONS \(returns response headers without the actual body\), and few more we won't mention here. You can learn more about them in [MDN documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods).

So now just by having the URI and the method you can recognize what kind of operation on which resource can be performed.

## Headers in API communication

When it comes to web APIs, its integral part are headers. Headers are pairs of name and the value that helps the recipient to understand how to process the request. There are a number of standard request and response headers commonly used in communication with remote systems. Because they are integral part of the HTTP transport, in most cases the headers are automatically filled up for you when executing a request by the underlying framework your application is based on. Such common header would be `content-length` which tells the recipient how much body it should expect before finalizing processing the entire message and preparing response. When working with web APIs you almost never set this header manually. However, the other very common header `content-type` almost always has to be set by you. This header tells the recipient what is the format of the incoming data. It can be a JSON, XML, binary data of any form, any many more. You can also define own set of headers that are only used by your particular API if that's really needed. However, the standard set of the headers usually is enough for majority of cases.

## Request and response body

The most interesting part for you is obviously the body. This is the reason why the API exists in the first place: to exchange information about a resource. The body is the representation of the resource that resists on the server \(or client when creating a resource\). I am using "representation" because the resource may be represented in more than one form. For example, a Person resource, which is a user in the system, may be represented in JSON and and XML format depending on the [accept](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept) header sent with the request.

The response body contains the resource shaped by the request. The request may contain parameters \(query parameters, headers\) that may somehow transform the response. Consider our picture feed application. When requesting a list of latest pictures \(collection of resources\) you may ask the server to return a 100 latest posts instead of default 25. Usually this is done by defining a query parameters that are responsible for pagination. Other example would be searching for a specific tag associated with a picture. In this case the server would return the same collection of resources but the request parameters would be different and would include search phrase. 

After receiving the response, the client can do whatever it wants with it. It can be stored in local data store for offline use or for caching. Then it is rendered to the final user in the application UI \(I am purposely not using GUI as this may come in variety of forms, like spoken communication\).

## API specification

Small organizations like small start-ups may not formalize an API for their application in any of available API description languages. However, it doesn't scale and in long run not having API specification causes a lot of problems, even internally, not only with external developer teams. Larger organizations prefer design first approach where an API is first designed and after it meets all requirements then it is implemented. Currently the most commonly used languages to describe an API are RAML and OAS. Which one you will choose to use it's up to you. However, your should be aware that API description is as important as having an API.

API specification is a formal record of how your API works. It describes schemas \(data types\) that are used to communicate with the clients and the structure of the API \(endpoints and methods\). The obvious benefit of having an API specification is that multiple teams can work in parallel on the same API without the actual API being up an running. Because API specification describes the protocol used to communicate between the server and the application the development teams not always need access to live API. Second reason to have API specification is ability to use it in a wide range of API tooling that can read API specification and transform it into something else. For example there are applications that reads API specification and generates automated, but dummy, server response. It is called mocking service. It could be used to test client application before the API is running. Other example of such tooling is automated documentation generation for your API from such specification. It can be used internally by your teams but also externally by other developers that are using your API.

This is only tip of an icebug in API tooling. There is a lot of tools that allows you to automate your work by only just having an API specification.   

