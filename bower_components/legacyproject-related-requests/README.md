[![Build Status](https://travis-ci.org/advanced-rest-client/legacyproject-related-requests.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/legacyproject-related-requests)  

# legacyproject-related-requests

An element that computes a list of requests related to a project.
It handles all request related events to update the list if the request object
change.

### Example
```html
<legacyproject-related-requests project-id="project-id"></legacyproject-related-requests>

<script>
document.querySelector('legacyproject-related-requests')
.addEventListener('project-related-requests-read', function(e) {
  console.log('Request for project: ', e.detail.projectId, ' are ready: ', e.detail.items);
});
</script>
```



### Events
| Name | Description | Params |
| --- | --- | --- |
| project-related-requests-read | Fired when the query function finished querying for the data. | projectId **String** - Current project ID |
items **Array** - List of requests related to the project. |
