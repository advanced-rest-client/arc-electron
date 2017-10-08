[![Build Status](https://travis-ci.org/advanced-rest-client/http-method-label.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/http-method-label)  

# http-method-label

The element displays a label for the HTTP method. If the method is one of the
predefined methods then it will use predefined colors to mark the method.

### Example

```html
<http-method-label method="GET"></http-method-label>
```

If the method is not one of the predefined methods it can be styled using regular
css.

```html
<style>
http-method-label[method="test"] {
  color: white;
  background-color: orange;
}
</style>
<http-method-label method="TEST"></http-method-label>
```

### Styling
`<http-method-label>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--http-method-label` | Mixin applied to the HTTP method | `{}`
`--http-method-label-color` | Color of the HTTP method | `rgb(128, 128, 128)`
`--http-method-label-background-color` | Background color of the HTTP method | `rgba(128, 128, 128, 0.12)`
`--http-method-label-get` | Mixin applied to the `GET` HTTP method | `{}`
`--http-method-label-get-color` | Color of the `GET` HTTP method | `rgb(0, 128, 0)`
`--http-method-label-get-background-color` | Background color of the `GET` HTTP method | `rgba(0, 128, 0, 0.12)`
`--http-method-label-post` | Mixin applied to the `POST` HTTP method | `{}`
`--http-method-label-post-color` | Color of the `POST` HTTP method | `rgb(33, 150, 243)`
`--http-method-label-post-background-color` | Background color of the `POST` HTTP method | `rgba(33, 150, 243, 0.12)`
`--http-method-label-put` | Mixin applied to the `PUT` HTTP method | `{}`
`--http-method-label-put-color` | Color of the `PUT` HTTP method | `rgb(255, 165, 0)`
`--http-method-label-put-background-color` | Background color of the `PUT` HTTP method | `rgba(255, 165, 0, 0.12)`
`--http-method-label-delete` | Mixin applied to the `DELETE` HTTP method | `{}`
`--http-method-label-delete-color` | Color of the `DELETE` HTTP method | `rgb(244, 67, 54)`
`--http-method-label-delete-background-color` | Background color of the `DELETE` HTTP method | `rgba(244, 67, 54, 0.12)`
`--http-method-label-patch` | Mixin applied to the `PATCH` HTTP method | `{}`
`--http-method-label-patch-color` | Color of the `PATCH` HTTP method | `rgb(156, 39, 176)`
`--http-method-label-patch-background-color` | Background color of the `PATCH` HTTP method | `rgba(156, 39, 176, 0.12)`

