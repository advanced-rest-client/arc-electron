# Set cookie action

Set cookie action allows you to create a new cookie or to update existing one from the request or the response data. The cookie is stored in Electron's internal cookie storage \(ARC is built on the Electron platform which is derivative of the Chromium project\).

To set a cookie you need to configure cookie name to set, it's URL configuration, and the value.

The **name** of the cookie can be any value that is acceptable as a cookie value in HTTP specification.

The **URL** of the cookie can be either a request or final response URL or manually configured from a domain and a path. In the Chromium project cookies are internally associated with an URL. This includes the host part of the URL and the path. Final response URL is the URL used to make the last request before receiving non-redirected response \(or the first response if redirects are disabled for the request\).

Finally the data can be extracted from the request or response data.It can be an URL, headers, or the body. Depending whether it's request or response action the source of the data can be either a HTTP method or the status code.

