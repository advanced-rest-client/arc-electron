---
description: This page describes how to use host rules in Advanced REST Client
---

# Host rules

## What are the host rules?

Host rules assist your operating system to map a host name to an IP address. Historically it was used in first computers before first DNS \(Domain Naming System\) was created to tell the system what is the IP address of the remote machine while having it's name only. Today it is primarily used to alter host - IP address mapping to something different than DNS tells or to create a mapping that DNS is not aware of.

## Why would you need it in ARC?

While developing a web server or an API often the server is run locally or in local network. In most cases IP address, that is well known to you, is enough to run a request. However sometimes you need to test a configuration that depends on the value of `host` header. This is quite common for servers that are hosting several virtual hosts.

Technically you can manually set the URL to an IP address and then put `host` header in the headers editor to test for virtual hosts. Other option is to alter system's `hosts` file to create a mapping but this usually requires administrative privileges. In ARC, however, recommended way of doing this is to define own hosts rules that maps parts of your URL to some other value, but keeps the original URL to generate a host header when connecting to a server.

When you define a rule and the rule matches the URL of currently executed request, the URL that is used to make a connection is replaced by the mapping value. This way, say, instead of connecting to `host.com` you would be connecting to `127.0.0` \(local host\). However, when the HTTP message is constructed, the original URL value is used to set a value for `host` header which in this example will be `host: host.com`

## Defining rules

From the menu Request select Hosts. A host rules mapping screen appears. Click on the add button \(right bottom corner of the screen\) to add new entry.

![Empty rule in hosts rules mapping](../.gitbook/assets/image%20%2848%29.png)

In the `from` filed enter the part of the URL that should be replaced with another value. It doesn't have to be a host name only. It can be a full URL or a part of it.

![Defining a rule in hosts mapping editor](../.gitbook/assets/image%20%2840%29.png)

In this example the rules mapping maps `https://hosts.com` to `http://127.0.0.1`. Notice that we are not only changing the host but also the scheme.

Now you can test whether the mapping meets your expectations by running a request URL through rules tester.

![Rules tester with result](../.gitbook/assets/image%20%2865%29.png)

We are testing `https://host.com/index.html` URL against defined rules. The result shows that expected result is `http://127.0.0.1/index.html`.

Now, we can run a request that uses `host.com` in the URL and the connection is made to the local host.

![Request made to mapped location](../.gitbook/assets/image%20%2862%29.png)

Even though the request URL contains non-existing URL the request returned data from my locally run server.

{% hint style="info" %}
All rules are evaluated in order from the first one to the last one. Already altered URL can be altered again by another rule.
{% endhint %}

## Examples

### Host only mapping

From: `212.77.100.101` To: `127.0.0.1`

This will result with translating the following URL `https://212.77.100.101/index.html` into `https://127.0.0.1/index.html`.

### URI mapping

From: `http://domain.com/api` To: `http://127.0.0.1:8081`

This will result with translating the following URL `http://domain.com/api/endpoint/?query=something` into `https://127.0.0.1:8081/endpoint/?query=something`.

### With asterisk

From: `http://212.77.100.101/*/` To: `http://localhost/path/to/endpoint/`

This will result with translating the following URL `http://212.77.100.101/api/whathever/here/test?query=something` into `http://localhost/path/to/endpoint/test?query=something`.

