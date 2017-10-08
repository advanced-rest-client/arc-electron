'use strict';
/* global self, Prism, importScripts */

self.document = {
  'currentScript': null,
  getElementsByTagName: function() {
    return [];
  }
};
importScripts(
  '../../prism/prism.js',
  '../../prism/plugins/autolinker/prism-autolinker.min.js',
  'prism-modes.js'
);
function getLanguagePath(lang) {
  return Prism.plugins.mods.path + 'prism-' + lang + '.min.js';
}
/**
 * Load a grammar with its dependencies
 * @param {string} lang
 */
var loadLanguage = function(lang) {
  var dependencies = Prism.plugins.mods.dependencies[lang];
  if (dependencies && dependencies.length) {
    loadLanguages(dependencies);
  }
  if (lang.indexOf('!') >= 0) {
    lang = lang.replace('!', '');
  }
  var src = getLanguagePath(lang);
  importScripts(src);
};
/**
 * Sequentially loads an array of grammars.
 * @param {string[]|string} langs
 * @param {function=} success
 * @param {function=} error
 */
var loadLanguages = function(langs) {
  if (typeof langs === 'string') {
    langs = [langs];
  }
  langs.forEach(function(lang) {
    loadLanguage(lang);
  });
};

// Prism.plugins.mods.langs.forEach(function(lang) {
//   loadLanguage(lang);
// });

function ensureLanguage(lang) {
  if (lang in Prism.languages) {
    return;
  }
  if (Prism.plugins.mods.langs.indexOf(lang) !== -1) {
    loadLanguage(lang);
  }
}

/**
 * Guess proper language parser for given code and mime type (lang).
 *
 * @param {string} code The source being highlighted.
 * @param {string=} mime A mime type.
 * @return {!prism.Lang}
 */
function detectLang(code, mime) {
  // console.log('Detecting lang for: ', lang);
  if (!mime) {
    ensureLanguage('markup');
    return Prism.languages.html;
  }
  if (mime.indexOf('html') !== -1) {
    ensureLanguage('markup');
    return Prism.languages.html;
  }
  if (mime.indexOf('js') !== -1 || mime.indexOf('es') === 0) {
    ensureLanguage('javascript');
    return Prism.languages.javascript;
  } else if (mime.indexOf('css') !== -1) {
    ensureLanguage('css');
    return Prism.languages.css;
  } else if (mime === 'c') {
    // console.log('Lang detected: clike');
    ensureLanguage('clike');
    return Prism.languages.clike;
  }
  {
    // text/html; charset=ISO-8859-2
    // application/vnd.dart;charset=utf-8
    // text/x-java-source;charset=utf-8
    var i = mime.indexOf('/');
    if (i !== -1) {
      mime = mime.substr(i + 1);
      i = mime.indexOf(';');
      if (i !== -1) {
        mime = mime.substr(0, i).trim();
      }
    }
  }
  // remove "vnd." prefix
  if (mime.indexOf('vnd.') === 0) {
    mime = mime.substr(4);
  }
  if (mime.toLowerCase().indexOf('x-') === 0) {
    mime = mime.substr(2);
  }
  var srcI = mime.toLowerCase().indexOf('-source');
  if (srcI > 0) {
    mime = mime.substr(0, srcI);
  }
  if (Prism.plugins.mods.langs.indexOf(mime) === -1) {
    // console.log('No lang found for mime: ', mime);
    // console.log('Lang detected: html');
    ensureLanguage('markup');
    return Prism.languages.html;
  }
  ensureLanguage(mime);
  if (mime in Prism.languages) {
    return Prism.languages[mime];
  }
  return Prism.languages.html;
}

function tokenize(data) {
  var lang = data.language;
  var code = data.code;
  lang = detectLang(code, lang);
  Prism.hooks.run('before-highlight', {
    code: code,
    grammar: lang
  });
  return Prism.tokenize(code, lang);
}
function makeTokens(obj) {
  if (obj instanceof Array) {
    return obj.map(makeTokens);
  } else if (typeof obj === 'string') {
    return obj;
  } else {
    return new Prism.Token(obj.type, makeTokens(obj.content || ''), obj.alias);
  }
}
function stringify(data) {
  data = makeTokens(data.tokens);
  return Prism.Token.stringify(Prism.util.encode(data));
}
self.onmessage = function(e) {
  var data = e.data;
  var result = {
    payload: data.payload
  };
  switch (data.payload) {
    case 'tokenize':
      result.tokens = tokenize(data);
      break;
    case 'stringify':
      result.html = stringify(data);
      break;
  }
  self.postMessage(result);
};
