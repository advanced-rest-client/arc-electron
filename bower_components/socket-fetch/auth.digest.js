(function(w) {
  'use strict';
  /* global FetchAuth */
  /**
   * A base class for auth methods used in the library.
   * Based on https://github.com/inorganik/digest-auth-request/blob/master/digestAuthRequest.js
   */
  class FetchDigestAuth extends FetchAuth {

    constructor(opts) {
      super(opts);
      this.method = 'digest';
      this.url = opts.url;
      this.httpMethod = opts.httpMethod;
      this.scheme = opts.scheme;
      this.nonce = opts.nonce;
      this.realm = opts.realm;
      this.qop = opts.qop;
      this.opaque = opts.opaque;
      this.nc = opts.nc || 1;
      this.cnonce = opts.cnonce;
    }

    generateCnonce() {
      var characters = 'abcdef0123456789';
      var token = '';
      for (var i = 0; i < 16; i++) {
        var randNum = Math.round(Math.random() * characters.length);
        token += characters.substr(randNum, 1);
      }
      this.cnonce = token;
    }

    getAuthHeader() {
      if (!this.uid || !this.passwd || !this.realm || !this.httpMethod || !this.url ||
        !this.nonce) {
        return null;
      }
      var response = this.formulateResponse();
      var h = '';
      h += this.scheme + ' ';
      h += 'username="' + this.uid + '", ';
      h += 'realm="' + this.realm + '", ';
      h += 'nonce="' + this.nonce + '", ';
      h += 'uri="' + this.url + '", ';
      h += 'response="' + response + '", ';
      h += 'opaque="' + this.opaque + '", ';
      h += 'qop=' + this.qop + ', ';
      h += 'nc=' + ('00000000' + this.nc).slice(-8) + ', ';
      h += 'cnonce="' + this.cnonce + '"';
      return h;
    }

    formulateResponse() {
      /* global CryptoJS */
      var HA1 = CryptoJS.MD5(this.uid + ':' + this.realm + ':' + this.passwd).toString();
      var HA2 = CryptoJS.MD5(this.httpMethod + ':' + this.url).toString();
      var response = CryptoJS.MD5(HA1 + ':' +
          this.nonce + ':' +
          ('00000000' + this.nc).slice(-8) + ':' +
          this.cnonce + ':' +
          this.qop + ':' + HA2).toString();
      return response;
    }
  }

  w.FetchDigestAuth = FetchDigestAuth;
})(window);
