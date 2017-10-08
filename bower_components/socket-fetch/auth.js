(function(w) {
  'use strict';

  /**
   * A base class for auth methods used in the library.
   */
  class FetchAuth {
    constructor(opts) {
      // Login to authorize with
      this.uid = opts.uid || undefined;
      // Password to authorize with
      this.passwd = opts.passwd || undefined;
      // Aythentication method: basic, ntlm, digest (lowercase)
      this.method = opts.method || undefined;
      // Optional domain for authentication.
      this.domain = opts.domain || undefined;
      // If true it is a proxt authorization.
      this.proxy = opts.proxy || undefined;
    }

    authenticate() {
      return Promise.reject(`Method ${this.method} not implemented.`);
    }
  }

  w.FetchAuth = FetchAuth;
})(window);
