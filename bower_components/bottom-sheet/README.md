[![Build Status](https://travis-ci.org/advanced-rest-client/bottom-sheet.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/bottom-sheet)  

# bottom-sheet

Material design: [Bottom sheets](https://material.google.com/components/bottom-sheets.html#)

# `<bottom-sheet>`
Bottom sheets slide up from the bottom of the screen to reveal more content.

### Example
```
<bottom-sheet>
  <paper-icon-item>
    <iron-icon src="inbox.png" item-icon></iron-icon>
    Inbox
  </paper-icon-item>
  <paper-icon-item>
    <iron-icon src="keep.png" item-icon></iron-icon>
    Keep
  </paper-icon-item>
  <paper-icon-item>
    <iron-icon src="hangouts.png" item-icon></iron-icon>
    Hangouts
  </paper-icon-item>
</bottom-sheet>
```

### Positioning
Use the `fit-bottom` class to position the bar at the bottom of the app and with full width;

Use `center-bottom` class to display the bar at the bottom centered on a page.


### Styling
`<bottom-sheet>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--bottom-sheet-background-color` | The bottom-sheet background-color | `#fff`
`--bottom-sheet-color` | The bottom-sheet color | `#323232`

