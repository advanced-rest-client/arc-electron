# Introduction

ARC actions allows you automate some work before and after request is made. 

The request actions allow to perform some logic before the connection to the destination URL is made. At this time you can modify the request values by setting up variables or modifying cookies. The actions run before other transformations are made to the request object like applying cookies or variables.

The response actions are performed after the response has been completely ready from the connection, the response object has been created, and cookies has been processed. This way you can modify data stored in ARC after a response has been processed.

Actions by default runs synchronously. This means that the request is being made after all request actions finish. The same for the response actions. Response is reported after the actions are performed. When it make sense some actions may have configuration option to enable asynchronous processing.

When an action fails the request fails. Some actions may have a configuration option to ignore failures and allow to continue the request.

