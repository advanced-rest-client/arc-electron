[![Build Status](https://travis-ci.org/advanced-rest-client/app-pouchdb-quick-search.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/app-pouchdb-quick-search)  

# app-pouchdb-quick-search

The `<arc-pouchdb-quick-search>` component uses PouchDB's `quick-search` plugin which is very
efficient and accurate full-text search engine built on top of PouchDB.
Analyzes text, indexes it, and provides a simple but powerful API for querying.
Ideal for PhoneGap apps or any webapp that needs offline search support.

Full docs: https://github.com/nolanlawson/pouchdb-quick-search

Note: At first run call to `<arc-pouchdb-quick-search>.refresh()` function may be very slow. At the
time the index has to be built up. To manually trigger index build (e.g. while the app is iddle)
set `buildIndex` attribute without `query` attribute. It will automatically call index build. It must
be called each time the documents list change.

When index (a cobination of fields) is not needed anymore it can be deleted by setting `destroy`
attribute.

This element will not perform search automatically after setting required attributes.
To perform the query you must call `refresh()` manually. After successful query the `data` event
will be fired containing desired results.

It should always handle errors by listening for `error` event.

## initialize
You must set the `adapter` and `dbName` attributes to initialize the database.

## Querying
To perform a simplest query set the `fields` and `query` attributes. `fields` is the key generated
internally by **pouchdb-quick-search** plugin and is independed on IndexedDB keys.
To perform a query call the `refresh()` function. As a result the element will set a `data`
attribute with the query result and fire `data` event with the `result` property in it's detail
object.

```
<arc-pouchdb-quick-search
  id="q"
  query="donkey kong"
  fields='["title", "description"]'></arc-pouchdb-quick-search>
...
this.$.q.refresh();
```
### Response
The results contain a list of matching document ids and scores, sorted from high to low.
```
{ rows:
   [
     { id: 'mydoc5', score: 0.08027856564851082 },
     { id: 'mydoc3', score: 0.044194173824159216 },
     { id: 'mydoc4', score: 0.044194173824159216 }
   ],
  total_rows: 3
}
```
Score is the accuracy of the result calculated by the underlaying
[linr.js library](https://github.com/olivernn/lunr.js).

The `total_rows` property will contain a number of all matched document. It can be usefull with
pagination to present number of pages.

## Querying full docs
To receive full docs from the datastore while querying it set the `includeDocs` attribute:
```
<arc-pouchdb-quick-search
  id="q"
  query="donkey kong"
  fields='["title", "description"]'
  include-docs></arc-pouchdb-quick-search>
...
this.$.q.refresh();
```
### Response
```
{
  "rows": [
    {
      "doc": {
        "_id": "mydoc5",
        "_rev": "1-5252b7faa1062e74ef0881fc908274cd",
        "text": "This kong likes to surf!",
        "title": "Funky Kong"
      },
      "id": "mydoc5",
      "score": 0.08027856564851082
    },
    {
      "doc": {
        "_id": "mydoc3",
        "_rev": "1-895f4289f96485c86ab62b02603220ae",
        "text": "He's the leader of the bunch, you know him well.",
        "title": "Donkey Kong"
      },
      "id": "mydoc3",
      "score": 0.044194173824159216
    },
    {
      "doc": {
        "_id": "mydoc4",
        "_rev": "1-00117a7b1d05df952474206e51ff19a5",
        "text": "His coconut gun can fire in spurts.",
        "title": "Diddy Kong"
      },
      "id": "mydoc4",
      "score": 0.044194173824159216
    }
  ],
  "total_rows": 3
}
```
## Highlighting results
By setting a `highlight` attribute the engine will highlight matched words with `<strong></strong>`
element. The sorrounding element can be adjusting by setting `highlightingPre` and `highlightingPost`
attributes:

```
<arc-pouchdb-quick-search
  id="q"
  query="donkey kong"
  fields='["title", "description"]'
  include-docs
  highlight
  highlighting-pre="<mark>"
  highlighting-post="</mark>"></arc-pouchdb-quick-search>
...
this.$.q.refresh();
```
### Response
```
{
  "rows": [
    {
      "highlighting": {
        "text": "This <mark>kong</mark> likes to surf!",
        "title": "Funky <mark>Kong</mark>"
      },
      "id": "mydoc5",
      "score": 0.08027856564851082
    },
    {
      "highlighting": {
        "title": "Donkey <mark>Kong</mark>"
      },
      "id": "mydoc3",
      "score": 0.044194173824159216
    },
    {
      "highlighting": {
        "title": "Diddy <mark>Kong</mark>"
      },
      "id": "mydoc4",
      "score": 0.044194173824159216
    }
  ],
  "total_rows": 3
}
```

## Pagination
See https://github.com/nolanlawson/pouchdb-quick-search#pagination section for more information.

## Manually building index
As mentioned, index if the combination of `fields` attribute. The `language` property of the
`pouchdb-quick-search` is not yet supported. Also, index is created automatically during first query
if it wasn't created earlier. It may take a while depending on the machine speed and number of data
to index. In some cases it may be benefitial for the user to perform manual index update for example
the the app is iddle. Another use case is while upgrading the app and during upgrade to new structure
it will also create an index.

It is required to provide at least the `fields` attribute. When both `fields` and `buildIndex`
attributes are set it will perform this task automatically. When ready the `index-updated` event
will be fired.

## Deleting an index
Similar to creating an index it is possible to destroy the index if it won't be used anymore.
To do so at least the `fields` attribute must be ste along with `destroy` attribute. The action
will be performed automatically and `index-deleted` event will be fired when finished.



### Events
| Name | Description | Params |
| --- | --- | --- |
| data | Fires when `data` is ready to read. | result **Array.<Object>** - Result of the query, always array |
| error | Fires when an error occured during any operation. | error **Error** - An error object. |
| index-deleted | Fires when the index has been deleted. | __none__ |
| index-updated | Fires when the index has been updated (or generated). This event is not triggered during initial index built during a query. | result **Object** - The result from the search engine. |
