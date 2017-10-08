(function(scope) {
  'use strict';
  // http://domain.com
  // http://domain.com/path
  // http://domain.com/path/endpoint
  // http://domain.com/path/endpoint?param
  // http://domain.com/path/endpoint?param=value
  // http://domain.com/path/endpoint?param=value&other
  // http://domain.com/path/endpoint?param=value&other=value
  // http://domain.com/path/endpoint?param=value&other=value#123
  // http://domain.com/path/endpoint?${variable}=value&other=value
  // http://domain.com/path/endpoint?param=${variable}&other=value
  // ${variable}
  // http://domain.com/${variable}
  // http://domain${variable}
  // http://domain${variable}/
  // ${variable}://
  // ${variable}://host

  var options = {};

  function setOptions(opts) {
    opts = opts || {};
    options.queryDelimiter = opts.queryDelimiter || '&';
  }
  /**
   * Returns protocol value in format `protocol` + ':'
   *
   * @param {String} value The URL to parse
   * @return {String|undefined} Value of the protocol or undefined.
   */
  function getProtocol(value) {
    var delimIndex = value.indexOf('://');
    if (delimIndex !== -1) {
      return value.substr(0, delimIndex + 1);
    }
  }
  /**
   * Gets a host value from the url.
   * It reads the whole authority value of given `value`. It doesn't parses it to host, port and
   * credentials parts. For URL panel it's enough.
   *
   * @param {String} value The URL to parse
   * @return {String|undefined} Value of the host or undefined.
   */
  function getHost(value) {
    var delimIndex = value.indexOf('://');
    if (delimIndex !== -1) {
      value = value.substr(delimIndex + 3);
    }
    if (!value) {
      return;
    }
    // We don't need specifics here (username, password, port)
    var host = value.split('/')[0];
    return host;
  }

  function getPath(value) {
    var index = value.indexOf('://');
    if (index !== -1) {
      value = value.substr(index + 3);
    }
    index = value.indexOf('?');
    if (index !== -1) {
      value = value.substr(0, index);
    }
    index = value.indexOf('#');
    if (index !== -1) {
      value = value.substr(0, index);
    }
    var lastIsSlash = value[value.length - 1] === '/';
    var parts = value.split('/');
    parts = parts.filter(function(part) {
      return !!part;
    });
    parts.shift();
    var path = '/' + parts.join('/');
    if (lastIsSlash && parts.length > 1) {
      path += '/';
    }
    return path;
  }
  /**
   * Returns query parameters string (without the '?' sign) as a whole.
   *
   * @param {String} value The URL to parse
   * @return {String|undefined} Value of the search string or undefined.
   */
  function getSearch(value) {
    var index = value.indexOf('?');
    if (index === -1) {
      return;
    }
    value = value.substr(index + 1);
    index = value.indexOf('#');
    if (index === -1) {
      return value;
    }
    return value.substr(0, index);
  }
  /**
   * Reads a value of the anchor (or hash) parameter without the `#` sign.
   *
   * @param {String} value The URL to parse
   * @return {String|undefined} Value of the anchor (hash) or undefined.
   */
  function getAnchor(value) {
    var index = value.indexOf('#');
    if (index === -1) {
      return;
    }
    return value.substr(index + 1);
  }
  /**
   * Returns an array of items where each item is an array where first item is param name and
   * second is it's value. Both always strings.
   *
   * @param {?String} search Parsed search parameter
   * @return {Array} Always returns an array.
   */
  function getSearchParams(search) {
    var result = [];
    if (!search) {
      return result;
    }
    var parts = search.split(options.queryDelimiter);
    result = parts.map(function(item) {
      var _part = ['', ''];
      var _params = item.split('=');
      var _name = _params[0].trim();
      if (_name) {
        _part[0] = _name;
      } else {
        return;
      }
      if (_params[1]) {
        var _value = _params[1].trim();
        if (_value) {
          _part[1] = _value;
        }
      } else {
        _params[1] = '';
      }
      return _part;
    });
    return result.filter(function(item) {
      return !!item;
    });
  }

  function setSearchParams(context, value) {
    if (!value || !value.length) {
      context.search = undefined;
      return;
    }
    context.search = value.map(function(item) {
      if (!item[0] && !item[1]) {
        return;
      }
      item[1] = item[1] || '';
      return item[0] + '=' + item[1];
    })
    .filter(function(item) {
      return !!item;
    })
    .join(options.queryDelimiter);
  }

  function parse(context, value) {
    var protocol = getProtocol(value);
    var host = getHost(value);
    var path = getPath(value);
    var search = getSearch(value);
    var anchor = getAnchor(value);

    context.protocol = protocol;
    context.host = host;
    context.path = path;
    context.search = search;
    context.anchor = anchor;
  }

  function UrlParser(value, opts) {
    setOptions(opts);
    this.value = value;
  }

  UrlParser.prototype.toString = function() {
    var result = '';
    if (this.protocol) {
      result += this.protocol;
      result += '//';
    }
    if (this.host) {
      result += this.host;
    }
    if (this.path) {
      if (this.path === '/' && !this.host && !this.search && !this.anchor) {
      } else {
        if (this.path[0] !== '/') {
          result += '/';
        }
        result += this.path;
      }
    } else {
      if (this.search || this.anchor) {
        result += '/';
      }
    }
    if (this.search) {
      var p = this.searchParams;
      this.searchParams = p;
      result += '?' + this.search;
    }
    if (this.anchor) {
      result += '#' + this.anchor;
    }
    return result;
  };

  Object.defineProperty(UrlParser.prototype, 'value', {
    get: function() {
      return this.toString();
    },
    set: function(value) {
      parse(this, value);
    },
    enumerable: true,
    configurable: true
  });

  Object.defineProperty(UrlParser.prototype, 'options', {
    get: function() {
      return Object.assign({}, options);
    },
    set: function(value) {
      setOptions(value);
    },
    enumerable: true,
    configurable: true
  });
  // Returns an array of query parameters.
  Object.defineProperty(UrlParser.prototype, 'searchParams', {
    get: function() {
      return getSearchParams(this.search);
    },
    set: function(value) {
      setSearchParams(this, value);
    },
    enumerable: true,
    configurable: true
  });

  scope.UrlParser = UrlParser;
})(this);
