Polymer({
  is: 'form-action-bar',

  properties: {
    /**
     * The z-depth of this element, from 0-5. Setting to 0 will remove the
     * shadow, and each increasing number greater than 0 will be "deeper"
     * than the last.
     */
    elevation: {
      type: Number,
      reflectToAttribute: true,
      value: 1
    }
  }
});
