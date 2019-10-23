---
description: >-
  Internally Advanced REST Client is using IndexedDB, a web standard of storing
  a data in client application. This comes with some limitations. This page
  describes search capabilities in the application
---

# Searching for a request

In general a request is stored in the data store as **History object** and **Saved object**. 

History object is created when history is not disabled in settings and every time you run a request in the workspace. A history entry is created for a combination of an URL and a method. Only one entry a day for the combination is created. This means that if you run the same request multiple time during the day only one entry is created and it reflects the last state after running the request. The history object does not recognize changes to headers or payload. It is always the last sent values.

Saved object is generated when you press CTRL/CMD + S \(or File &gt; Save\) and explicitly save a request to saved store. The difference between history and saved request is that the saved request have a name, description, and can be added to a project.

Both types are stored in separate data stores. This means that when performing a search you are defining the type of a request you are searching for.

## Search UI

To search for a request go to  history or saved screen. You can access it from the application menu:

![Access to the history screen](../.gitbook/assets/image%20%2828%29.png)

In the requests list screen \(for either history or saved\) there is a search text field that you can use to input your query.

![Search text box in history screen](../.gitbook/assets/image%20%2811%29.png)

The search is performed on the following fields:

* name \(saved request\)
* headers
* payload
* url
* method

For name, headers, payload, and method is compares whole words. This means that for name "my saved request" the search will find the request for query like "my" or "request" but not "save".

The URL is treated slightly different. Each URL is processed to produce few meaningful values that can help while searching for an endpoint. In normal circumstances you would have to provide the full URL to find a request which is not what anyone would expect. When an URL is stored it is stored as:

* host, path, and search part of the URL, eg. `https://domain.com/path?param=value`
* path and search part of the URL, eg. `path?param=value`
* search parameters, each entry for each parameter, eg. `param=value`

When searching for an URL each of this fields is queried for the data. IndexedDb does not support full search queries. ARC implements an algorithm that iterates over keys and compares compares whether an URL contains search phrase. This way it is a good compromise between functionality and performance. 

![Search result](../.gitbook/assets/image%20%2837%29.png)

If you are more technical, you can check how searching is implemented in [url-indexer](https://github.com/advanced-rest-client/arc-models/blob/stage/url-indexer.js#L727).

