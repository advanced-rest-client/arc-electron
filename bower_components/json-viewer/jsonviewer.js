'use strict';
/* global self */

var SafeHtmlUtils = {
  AMP_RE: new RegExp(/&/g),
  GT_RE: new RegExp(/>/g),
  LT_RE: new RegExp(/</g),
  SQUOT_RE: new RegExp(/'/g),
  QUOT_RE: new RegExp(/"/g),

  htmlEscape: function(s) {
    if (s.indexOf('&') !== -1) {
      s = s.replace(SafeHtmlUtils.AMP_RE, '&amp;');
    }
    if (s.indexOf('<') !== -1) {
      s = s.replace(SafeHtmlUtils.LT_RE, '&lt;');
    }
    if (s.indexOf('>') !== -1) {
      s = s.replace(SafeHtmlUtils.GT_RE, '&gt;');
    }
    if (s.indexOf('"') !== -1) {
      s = s.replace(SafeHtmlUtils.QUOT_RE, '&quot;');
    }
    if (s.indexOf('\'') !== -1) {
      s = s.replace(SafeHtmlUtils.SQUOT_RE, '&#39;');
    }
    return s;
  }
};

function JSONViewer(data) {
  var jsonData = data.json;
  this.rawData = data.raw || '';
  this.cssPrefix = data.cssPrefix || '';
  this._numberIndexes = {}; // Regexp number indexes
  this.linkRegExp = /([^"\s&;<>]*:\/\/[^"\s<>]*)(&quot;|&lt;|&gt;)?/gim;
  this.jsonValue = null;
  this.latestError = null;
  this.elementsCounter = 0;
  if (typeof jsonData === 'string') {
    try {
      this.jsonValue = JSON.parse(jsonData);
      if (!this.rawData) {
        this.rawData = jsonData;
      }
    } catch (e) {
      this.latestError = e.message;
    }
  } else {
    this.jsonValue = jsonData;
  }
}
/**
 * Get created HTML content.
 */
JSONViewer.prototype.getHTML = function() {
  var parsedData = '<div class="' + this.cssPrefix + 'prettyPrint">';
  parsedData += this.parse(this.jsonValue);
  parsedData += '</div>';

  var replace = '<a class="' + this.cssPrefix + '" title="Click to insert into URL field" ';
  replace += 'response-anchor href="$1">$1</a>';
  var match = parsedData.match(this.linkRegExp);
  replace = replace.replace(/\$0/, match);
  parsedData = parsedData.replace(this.linkRegExp, replace);

  return parsedData;
};
/**
 * Parse JSON data
 */
JSONViewer.prototype.parse = function(data, opts) {
  opts = opts || {};

  var result = '';
  if (data === null) {
    result += this.parseNullValue();
  } else if (typeof data === 'number') {
    result += this.parseNumericValue(data);
  } else if (typeof data === 'boolean') {
    result += this.parseBooleanValue(data);
  } else if (typeof data === 'string') {
    result += this.parseStringValue(data);
  } else if (data instanceof Array) {
    result += this.parseArray(data);
  } else {
    result += this.parseObject(data);
  }
  if (opts.hasNextSibling && !opts.holdComa) {
    result += '<span class="' + this.cssPrefix + 'punctuation hidden">,</span>';
  }
  return result;
};

JSONViewer.prototype.parseNullValue = function() {
  var result = '';
  result += '<span class="' + this.cssPrefix + 'nullValue">';
  result += 'null';
  result += '</span>';
  return result;
};

JSONViewer.prototype.parseNumericValue = function(number) {
  var expectedNumber;
  if (number > Number.MAX_SAFE_INTEGER) {
    var comp = String(number);
    comp = comp.substr(0, 15);
    var r = new RegExp(comp + '(\\d+),', 'gim');
    if (comp in this._numberIndexes) {
      r.lastIndex = this._numberIndexes[comp];
    }
    var _result = r.exec(this.rawData);
    if (_result) {
      this._numberIndexes[comp] = _result.index;
      expectedNumber = comp + _result[1];
    }
  }

  var result = '';
  result += '<span class="' + this.cssPrefix + 'numeric">';
  if (expectedNumber) {
    result += '<js-max-number-error class="' + this.cssPrefix +
      'number-error" expected-number="' + expectedNumber + '">';
  }
  result += number + '';
  if (expectedNumber) {
    result += '</js-max-number-error>';
  }
  result += '</span>';
  return result;
};

JSONViewer.prototype.parseBooleanValue = function(bool) {
  var result = '';
  result += '<span class="' + this.cssPrefix + 'booleanValue">';
  if (bool !== null && bool !== undefined) {
    result += bool + '';
  } else {
    result += 'null';
  }
  result += '</span>';
  return result;
};

JSONViewer.prototype.parseStringValue = function(str) {
  var result = '';
  var value = str || '';
  if (value !== null && value !== undefined) {
    value = SafeHtmlUtils.htmlEscape(value);
    if (value.slice(0, 1) === '/') {
      value = '<a class="' + this.cssPrefix + '" title="Click to insert into URL field" ' +
        'response-anchor add-root-url href="' + value + '">' + value + '</a>';
    }
  } else {
    value = 'null';
  }
  result += '<span class="' + this.cssPrefix + 'punctuation">&quot;</span>';
  result += '<span class="' + this.cssPrefix + 'stringValue">';
  result += value;
  result += '</span>';
  result += '<span class="' + this.cssPrefix + 'punctuation">&quot;</span>';
  return result;
};

JSONViewer.prototype.parseObject = function(object) {
  var result = '';
  result += '<div class="' + this.cssPrefix + 'punctuation brace">{</div>';
  result += '<div collapse-indicator class="' + this.cssPrefix + 'info-row">...</div>';
  Object.getOwnPropertyNames(object)
  .forEach(function(key, i, arr) {
    var value = object[key];
    var lastSibling = (i + 1) === arr.length;
    var parseOpts = {
      hasNextSibling: !lastSibling
    };
    if (value instanceof Array) {
      parseOpts.holdComa = true;
    }
    var elementNo = this.elementsCounter++;
    var data = this.parse(value, parseOpts);
    var hasManyChildren = this.elementsCounter - elementNo > 1;
    result += '<div data-element="' + elementNo + '" style="margin-left: 24px" class="' +
      this.cssPrefix + 'node">';
    var _nan = isNaN(key);
    if (_nan) {
      result += '"';
    }
    result += this.parseKey(key);
    if (_nan) {
      result += '"';
    }
    result += ': ' + data;
    if (hasManyChildren) {
      result += '<div data-toggle="' + elementNo + '" class="' + this.cssPrefix +
        'rootElementToggleButton"></div>';
    }
    result += '</div>';
  }, this);
  result += '<div class="' + this.cssPrefix + 'punctuation brace">}</div>';
  return result;
};

JSONViewer.prototype.parseArray = function(array) {
  var cnt = array.length;
  var result = '';
  result += '<span class="' + this.cssPrefix + 'punctuation hidden">[</span>';
  result += '<span class="' + this.cssPrefix + 'array-counter brace punctuation" count="' +
    cnt + '"></span>';
  for (var i = 0; i < cnt; i++) {
    var elementNo = this.elementsCounter++;

    var lastSibling = (i + 1) === cnt;
    var data = this.parse(array[i], {
      hasNextSibling: !lastSibling
    });
    var hasManyChildren = this.elementsCounter - elementNo > 1;
    result += '<div data-element="' + elementNo + '" style="margin-left: 24px" class="' +
      this.cssPrefix + 'node">';
    result += '<span class="' + this.cssPrefix + 'array-key-number" index="' + i +
      '"> &nbsp;</span>';
    result += data;
    if (hasManyChildren) {
      result += '<div data-toggle="' + elementNo + '" class="' + this.cssPrefix +
        'rootElementToggleButton"></div>';
    }
    result += '</div>';
  }
  result += '<span class="' + this.cssPrefix + 'punctuation hidden">],</span>';
  return result;
};

JSONViewer.prototype.parseKey = function(key) {
  var result = '';
  result += '<span class="' + this.cssPrefix + 'key-name">' + key + '</span>';
  return result;
};

self.onmessage = function(e) {
  var parser = new JSONViewer(e.data);
  if (parser.latestError !== null) {
    self.postMessage({
      message: parser.latestError,
      error: true
    });
    return;
  }
  var result = parser.getHTML();
  parser = null;
  self.postMessage({
    message: result,
    error: false
  });
};
