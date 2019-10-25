---
description: >-
  Cookies are important part of session mechanism in the web and when working
  with APIs. This section describes how to use cookie manager to authenticate
  the request using cookies.
---

# Cookies and session management

{% hint style="warning" %}
When possible, use other means to authenticate a request like Bearer token with JWT.
{% endhint %}

Advanced REST Client emulates browser behavior when it comes to handling cookies. When a `set-cookie` header is received as a response to an API call then the value of the cookie is processed according to [HTTP State Management Mechanism](https://tools.ietf.org/html/rfc6265) specification. When a request is made to the cookie domain after the cookie was received it is automatically added to the request.

{% hint style="info" %}
The "set-cookie" header tells the client \(web browser, ARC\) that the server requests to store some data on the client. This data should be then send back with any following request that matches set domain and path.
{% endhint %}

ARC is web based application and it has a browser included in it. To leverage this ARC allows you to open a Chromium browser window \(it is open source version of Chrome\), log in to a web service, and store received this way cookies into ARC storage. The window opened in ARC has a separate storage and session management than any other ARC window \(main application, menu popup window, task manager, and so on\). This way you can securely authenticate in the window and only incoming cookies are sent back to the application ignoring any other stored values.

## Authenticating to a web service

To obtain and store cookies by logging in to a web service using a browser window select Request &gt; Web Session &gt; Login to a web service menu option. This opens an URL input where you can put the login page URL.

![Login to a web service URL input](../.gitbook/assets/image%20%2826%29.png)

In this example we will use MuleSoft's Anypoint platform login scheme. The login page is accessible under `https://anypoint.mulesoft.com` URL.

![Login page to Anypoint platform](../.gitbook/assets/image%20%2821%29.png)

After successful login a regular page is rendered.

![Authorized user view](../.gitbook/assets/image%20%2825%29.png)

Now the login window can be be closed. All cookies sent by the authorization server are now synchronized with ARC's cookies manager. You can see the cookies by selecting Request &gt; Web session &gt; Cookie manager menu option.

![Cookies set by the web service](../.gitbook/assets/image%20%2835%29.png)

When a request to matching domain is executed the cookies are automatically added to the request.

![Request with cookies added automatically](../.gitbook/assets/image%20%2841%29.png)

## Creating cookies manually

In Cookie manager \(Request &gt; Web session &gt; Cookie manager\) you have an option to create a cookie manually or to edit existing cookie. I am going to create a new cookie that is going to be set to a request send to `domain.com.`

![Cookie editor with values](../.gitbook/assets/image%20%2837%29.png)

After saving the cookie a new entry is added to the list of cookies.

![Created cookie on the list of cookies](../.gitbook/assets/image%20%2860%29.png)

You can preview cookie details or edit the cookie after pressing "details" button next to cookie name.

![Cookie details](../.gitbook/assets/image%20%2819%29.png)

After a cookie is set it will be automatically added to a request that matches the domain `domain.com`.

![Request with cookie](../.gitbook/assets/image%20%2815%29.png)

{% hint style="info" %}
Because the cookie was created with dot "." in front of the cookie domain, the cookie is applied to all requests sent to the domain and all its subdomains. This means the request to domain `http://www.domain.com` will also have the cookie applied to it.
{% endhint %}

