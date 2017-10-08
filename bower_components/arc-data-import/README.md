[![Build Status](https://travis-ci.org/advanced-rest-client/arc-data-import.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/arc-data-import)  

# arc-data-import

An element that imports data into the ARC datastore.

Supported data import types:

-   legacy (the first one) ARC data system
-   legacy Dexie and HAR based data system
-   current ARC export object
-   Postman data export

To import data it must be first normalized by calling `normalizeImportData`
function. It creates datastore objects that are resdy to be inserted into the
datastore.

Objects that are missing IDs will be assigned a new ID. Because of that data
duplication may occur.
Request objects will generate the same ID unless the request is assigned to a
project and project has new ID generated.

Conflicts are resolved by replacing existing data with new one.

### Example
```html
<arc-data-import></arc-data-import>
<script>
var importer = document.querySelector('arc-data-import');
var data = await getFileContent();
data = await importer.normalizeImportData();
var errors = await importer.storeData(data);
if (errors && errors.length) {
  console.log(errors);
}
</script>
```

