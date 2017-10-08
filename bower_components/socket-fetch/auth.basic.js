(function(w) {
  'use strict';
  /* global FetchAuth */
  /**
   * A base class for auth methods used in the library.
   */
  class FetchBasicAuth extends FetchAuth {

    constructor(opts) {
      super(opts);
    }

    getHeader() {
      var enc = `${this.uid}:${this.passwd}`;
      var value = 'Basic ' + btoa(enc);
      return value;
    }
  }

  w.FetchBasicAuth = FetchBasicAuth;
})(window);
