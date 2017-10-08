// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function(mod) {
  if (typeof exports == 'object' && typeof module == 'object') { // CommonJS
    mod(require('../../lib/codemirror'));
  } else if (typeof define == 'function' && define.amd) { // AMD
    define(['../../lib/codemirror'], mod);
  } else { // Plain browser env
    mod(CodeMirror);
  }
})(function(CodeMirror) {
  'use strict';

  CodeMirror.defineMode('http-headers', function() {

    function failRest(stream, state) {
      stream.skipToEnd();
      state.cur = failRest;
      return 'error';
    }

    function header(stream) {
      if (stream.sol() && !stream.eat(/[ \t]/)) {
        if (stream.match(/^.*?:/)) {
          return 'atom';
        } else {
          stream.skipToEnd();
          return 'error';
        }
      } else {
        stream.skipToEnd();
        return 'string';
      }
    }

    return {
      token: function(stream, state) {
        var cur = state.cur;
        if (!cur || cur !== header && stream.eatSpace()) {
          return null;
        }
        return cur(stream, state);
      },

      blankLine: function(state) {
        state.cur = failRest;
      },

      startState: function() {
        return {
          cur: header
        };
      }
    };
  });
  CodeMirror.defineMIME('message/http-headers', 'http-headers');
});
