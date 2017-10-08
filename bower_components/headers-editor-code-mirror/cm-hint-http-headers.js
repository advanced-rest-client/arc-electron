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

  var Pos = CodeMirror.Pos;
  var accept = [
    '*/*',
    'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'application/xml,application/xhtml+xml,text/html;q=0.9, text/plain;q=0.8,image/png,*/*;q=0.5',
    'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'image/jpeg, application/x-ms-application, image/gif, application/xaml+xml, image/pjpeg, ' +
      'application/x-ms-xbap, application/x-shockwave-flash, application/msword, */*',
    'text/html, application/xml;q=0.9, application/xhtml+xml, image/png, image/webp, image/jpeg,' +
      ' image/gif, image/x-xbitmap, */*;q=0.1',
    'image/png,image/*;q=0.8,*/*;q=0.5',
    'audio/webm, audio/ogg, audio/wav, audio/*;q=0.9, application/ogg;q=0.7, video/*;q=0.6; ' +
      '*/*;q=0.5',
    'video/webm, video/ogg, video/*;q=0.9, application/ogg=0.7, audio/*;q=0.6; */*;q=0.5',
    'application/javascript, */*;q=0.8',
    'text/css,*/*;q=0.1',
    'text/html, application/xml;q=0.9, application/xhtml+xml, image/png, image/webp, image/jpeg' +
      ', image/gif, image/x-xbitmap, */*;q=0.1'
  ];
  var contentTypes = [
    'application/json',
    'application/xml',
    'application/atom+xml',
    'multipart-form-data',
    'application/x-www-form-urlencoded',
    'application/base64',
    'application/octet-stream',
    'text/plain',
    'text/css',
    'text/html',
    'application/javascript'
  ];
  var authorizationHeaders = ['Basic {base64 of user:password}','Bearer {OAuth2 bearer}'];
  var authorizationParams = {
    'base64 of user:password': {
      type: String,
      call: 'authorizationBasic'
    },
    'OAuth2 bearer': {
      type: String,
      call: 'authorizationGoogleOauth2'
    }
  };

  var headersStructure = [{
    key: 'Accept',
    values: accept
  }, {
    key: 'Accept-Charset',
    values: [
      'UTF-8',
      'UTF-16',
      'ISO-8859-1',
      'ISO-8859-1,utf-8;q=0.7,*;q=0.7']
  }, {
    key: 'Accept-Encoding',
    values: [
      'compress',
      'gzip',
      'deflate',
      'identity',
      'br',
      '*',
      'gzip, deflate, sdch']
  }, {
    key: 'Accept-Language',
    values: [
      'en-US',
      'cad',
      'en-gb;q=0.8, en;q=0.7'
    ]
  }, {
    key: 'Authorization',
    values: authorizationHeaders,
    params: authorizationParams
  }, {
    key: 'Access-Control-Request-Method',
    values: ['GET','POST','PUT','DELETE']
  }, {
    key: 'Access-Control-Request-Headers',
    values: ['{list-of-headers}'],
    params: {
      'list-of-headers': {
        type: String
      }
    }
  }, {
    key: 'Cache-Control',
    values: [
      'no-cache',
      'no-store',
      'max-age={seconds}',
      'max-stale={seconds}',
      'min-fresh={seconds}',
      'no-transform',
      'only-if-cached'
    ],
    params: {
      seconds: {
        type: Number
      }
    }
  }, {
    key: 'Connection',
    values: ['close', 'keep-alive']
  }, {
    key: 'Content-MD5',
    values: ['{md5-of-message}'],
    params: {
      'length-in-bytes': {
        type: String
      }
    }
  }, {
    key: 'Content-Length',
    values: ['{length-in-bytes}'],
    params: {
      'length-in-bytes': {
        type: Number
      }
    }
  }, {
    key: 'Content-Type',
    values: contentTypes /*,
    params: {
      '*': {
        type: String,
        call: 'contentType'
      }
    }*/
  }, {
    key: 'Cookie',
    values: [
      '{cookie name}={cookie value}',
      '{cookie name}={cookie value}; expires={insert GMT date here}; domain={domain.com}; ' +
        'path=/; secure'
    ],
    params: {
      '*': {
        type: String,
        call: 'cookie'
      }
    }
  }, {
    key: 'Date',
    values: [
      '{insert GMT date here}'
    ]
  }, {
    key: 'DNT',
    values: [0, 1]
  }, {
    key: 'Expect',
    values: [
      '200-OK',
      '100-continue'
    ]
  }, {
    key: 'From',
    values: ['user@domain.com']
  }, {
    key: 'Front-End-Https',
    values: ['on', 'off']
  }, {
    key: 'Host',
    values: [
      'www.domain.com',
      'www.domain.com:80'
    ]
  }, {
    key: 'If-Match',
    values: ['{insert entity tag}']
  }, {
    key: 'If-Modified-Since',
    values: ['{insert GMT date here}']
  }, {
    key: 'If-None-Match',
    values: ['{insert entity tag}']
  }, {
    key: 'If-Range',
    values: ['{insert entity tag}', '{insert GMT date here}']
  }, {
    key: 'If-Unmodified-Since',
    values: ['{insert GMT date here}']
  }, {
    key: 'Max-Forwards',
    values: ['{number of forwards}'],
    params: {
      'number of forwards': {
        type: Number
      }
    }
  }, {
    key: 'Origin',
    values: []
  }, {
    key: 'Pragma',
    values: ['no-cache']
  }, {
    key: 'Proxy-Authorization',
    values: authorizationHeaders,
    params: authorizationParams
  }, {
    key: 'Proxy-Connection',
    values: ['close', 'keep-alive']
  }, {
    key: 'Range',
    values: [
      'bytes={from bytes}-{to bytes}',
      'bytes=-{final bytes}'
    ]
  }, {
    key: 'Referer',
    values: ['{http://www.domain.com/}']
  }, {
    key: 'TE',
    values: [
      '{header name}',
      'trailers, deflate;q=0.5'
    ]
  }, {
    key: 'Upgrade',
    values: ['HTTP/2.0, SHTTP/1.3, IRC/6.9, RTA/x11']
  }, {
    key: 'User-Agent',
    values: [
      navigator.userAgent,
      'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:33.0) Gecko/20120101 Firefox/33.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10; rv:33.0) Gecko/20100101 Firefox/33.0',
      'Opera/9.80 (Windows NT 6.0) Presto/2.12.388 Version/12.14',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_3) AppleWebKit/537.75.14 (KHTML, like Gecko)' +
        ' Version/7.0.3 Safari/7046A194A',
      'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.0; WOW64; Trident/4.0; SLCC1)',
      'Mozilla/5.0 (MSIE 10.0; Windows NT 6.1; Trident/5.0)',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 6_0 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gec' +
        'ko) Version/6.0 Mobile/10A5376e Safari/8536.25',
      'Mozilla/5.0 (iPad; CPU OS 6_0 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) ' +
        'Version/6.0 Mobile/10A5376e Safari/8536.25',
      'Mozilla/5.0 (Linux; Android 4.4.2; Nexus 4 Build/KOT49H) AppleWebKit/537.36 (KHTML, ' +
        'like Gecko) Chrome/34.0.1847.114 Mobile Safari/537.36',
      'Mozilla/5.0 (compatible; MSIE 10.0; Windows Phone 8.0; Trident/6.0; IEMobile/10.0; ARM;' +
        ' Touch; NOKIA; Lumia 920)'
    ]
  }, {
    key: 'Via',
    values: []
  }, {
    key: 'Warning',
    values: [
      '{code} {agent} {message} {date}'
    ],
    properties: {
      code: {
        type: Number
      },
      agent: {
        type: String
      },
      message: {
        type: String
      },
      date: {
        type: Date
      }
    }
  }, {
    key: 'X-ATT-DeviceId',
    values: []
  }, {
    key: 'X-Forwarded-For',
    values: []
  }, {
    key: 'X-Forwarded-Proto',
    values: ['http', 'https']
  }, {
    key: 'X-Requested-With',
    values: ['XMLHttpRequest']
  }, {
    key: 'X-Wap-Profile',
    values: []
  }];

  function getToken(editor, cur) {
    return editor.getTokenAt(cur);
  }
  /**
   * Get all keywords (headers names).
   * @param {Array} headersStructure List of possible headers
   * @return {Array} Array of founded header names.
   */
  var getKeywords = function(headersStructure) {
    var keywords = [];
    var clb = function(header, cm, data, completion) {
      cm.replaceRange(completion.text + ': ', data.from, data.to);
      CodeMirror.signal(cm, 'header-key-selected', completion.text);
    };
    for (var i = 0; i < headersStructure.length; i++) {
      keywords.push({
        text: headersStructure[i].key,
        hint: clb.bind(this, headersStructure[i])
      });
    }
    return keywords;
  };
  var getHeaderValuesFor = function(headersStructure, key) {
    var keywords = [];
    var clb = function(header, cm, data, completion) {
      cm.replaceRange(completion.text, data.from, data.to);
      CodeMirror.signal(cm, 'header-value-selected', completion.text);

      if (header.params && header.params['*'] && header.params['*'].call) {
        var fromChar = Math.min(data.from.ch, data.to.ch);
        var charTo = fromChar + completion.text.length;
        var line = data.from.line;
        cm.setSelection({
          line: line,
          ch: fromChar
        }, {
          line: line,
          ch: charTo
        });
        CodeMirror.signal(cm, 'header-value-support', {
          type: header.params['*'],
          key: header.key,
          value: completion.text
        });
      } else {
        var match = completion.text.match(/\{(.*?)\}/);
        if (match) {
          if (header.params && (match[1] in header.params)) {
            var fromChar = Math.min(data.from.ch, data.to.ch);
            var line = data.from.line;
            fromChar += completion.text.indexOf('{');
            var charTo = fromChar + match[1].length + 2;
            cm.setSelection({line: line, ch: fromChar}, {line: line, ch: charTo});
            CodeMirror.signal(cm, 'header-value-support', {
              type: header.params[match[1]],
              key: header.key,
              value: completion.text
            });
          }
        }
      }
    };

    for (var i = 0; i < headersStructure.length; i++) {
      if (headersStructure[i].key.toLowerCase() === key) {
        var valuesLenght = headersStructure[i].values && headersStructure[i].values.length || 0;
        for (var j = 0; j < valuesLenght; j++) {
          var item = headersStructure[i].values[j];
          var completion = {
            text: item,
            hint: clb.bind(this, headersStructure[i])
          };
          keywords.push(completion);
        }
        break;
      }
    }
    return keywords;
  };

  var cleanResults = function(text, keywords) {
    var results = [];
    var i = 0;
    for (i = 0; i < keywords.length; i++) {
      if (keywords[i].text) {
        if (keywords[i].text.toLowerCase().substring(0, text.length) === text) {
          results.push(keywords[i]);
        }
      } else {
        if (keywords[i].toLowerCase().substring(0, text.length) === text) {
          results.push(keywords[i]);
        }
      }
    }
    return results;
  };

  function getHints(editor) {
    var cur = editor.getCursor();
    var token = getToken(editor, cur);
    var tokenString = (!!token.string) ? '' : token.string.trim();
    var keywords = [];
    var i = 0;
    var fromCur = {
      line: cur.line,
      ch: cur.ch + 2
    };
    var toCur = {
      line: cur.line,
      ch: cur.ch
    };
    var flagClean = true;
    var last = editor.getRange({
      line: cur.line,
      ch: cur.ch - 1
    }, cur);
    var last2 = editor.getRange({
      line: cur.line,
      ch: cur.ch - 2
    }, cur);

    if ((last === ':' || last2 === ': ') || (last === ',' || last2 === ', ')) {
      var key = editor.getRange({
        line: cur.line,
        ch: 0
      }, cur);
      if (!key) {
        key = '';
      }
      key = key.substr(0, key.indexOf(':')).trim().toLowerCase();
      keywords = getHeaderValuesFor(headersStructure, key);

    } else if (editor.getRange({
        line: cur.line,
        ch: 0
      }, cur).trim() !== '') {
      var prev = editor.getRange({
        line: cur.line,
        ch: 0
      }, cur).trim();
      if (prev.indexOf(':') > -1) {
        //looking for value
        tokenString = prev.substr(prev.indexOf(':') + 1).trim().toLowerCase();
        keywords = getHeaderValuesFor(headersStructure, key);
      } else {
        //looking for header name starting with...
        tokenString = prev.toLowerCase();
        keywords = getKeywords(headersStructure);
      }
      fromCur.ch = token.start;

    } else {
      for (i = 0; i < headersStructure.length; i++) {
        keywords = getKeywords(headersStructure);
      }
    }

    if (flagClean === true && tokenString.trim() === '') {
      flagClean = false;
    }

    if (flagClean) {
      keywords = cleanResults(tokenString, keywords);
    }
    /*
     * from: replaceToken ? Pos(cur.line, tagStart == null ? token.start : tagStart) : cur,
     to: replaceToken ? Pos(cur.line, token.end) : cur
     */
    return {
      list: keywords,
      from: fromCur,
      to: toCur
    };
  }

  CodeMirror.registerHelper('hint', 'http-headers', getHints);
});
