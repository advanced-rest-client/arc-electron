/**
 * zlib.js wrapper for node.js
 */
goog.require('Zlib.Inflate');
goog.require('Zlib.Deflate');
goog.require('Zlib.Gunzip');

//-----------------------------------------------------------------------------
// exports methods
//-----------------------------------------------------------------------------
exports['deflate'] = deflate;
exports['deflateSync'] = deflateSync;
exports['inflate'] = inflate;
exports['inflateSync'] = inflateSync;
exports['gzip'] = gzip;
exports['gzipSync'] = gzipSync;
exports['gunzip'] = gunzip;
exports['gunzipSync'] = gunzipSync;


/**
 * deflate async.
 * @param {!(Buffer|Array.<number>|Uint8Array)} buffer plain data buffer.
 * @param {function(Error, !(Buffer|Array.<number>|Uint8Array))} callback
 *     error calllback function.
 * @param {Object=} opt_params option parameters.
 */
function deflate(buffer, callback, opt_params) {
  process.nextTick(function(){
    /** @type {Error} error */
    var error;
    /** @type {!(Buffer|Array.<number>|Uint8Array)} deflated buffer. */
    var deflated;

    try {
      deflated = deflateSync(buffer, opt_params);
    } catch(e){
      error = e;
    }

    callback(error, deflated);
  });
}


/**
 * deflate sync.
 * @param {!(Buffer|Array.<number>|Uint8Array)} buffer plain data buffer.
 * @param {Object=} opt_params option parameters.
 * @return {!(Buffer|Array.<number>|Uint8Array)} deflated buffer.
 */
function deflateSync(buffer, opt_params) {
  /** @type {Zlib.Deflate} deflate encoder. */
  var deflate = new Zlib.Deflate(
    /** @type {!(Array.<number>|Uint8Array)} */(buffer)
  );
  /** @type {!(Array.<number>|Uint8Array)} deflated buffer. */
  var deflated;

  deflated = deflate.compress();

  if (!opt_params) {
    opt_params = {};
  }

  return opt_params.noBuffer ? deflated : toBuffer(deflated);
}


/**
 * inflate async.
 * @param {!(Array.<number>|Uint8Array)} buffer deflated buffer.
 * @param {function(Error, !(Buffer|Array.<number>|Uint8Array))} callback
 *     error calllback function.
 * @param {Object=} opt_params option parameters.
 */
function inflate(buffer, callback, opt_params) {
  process.nextTick(function(){
    /** @type {Error} error */
    var error;
    /** @type {!(Buffer|Array.<number>|Uint8Array)} inflated plain buffer. */
    var inflated;

    try {
      inflated = inflateSync(buffer, opt_params);
    } catch(e){
      error = e;
    }

    callback(error, inflated);
  });
};


/**
 * inflate sync.
 * @param {!(Array.<number>|Uint8Array)} buffer deflated buffer.
 * @param {Object=} opt_params option parameters.
 * @return {!(Buffer|Array.<number>|Uint8Array)} inflated plain buffer.
 */
function inflateSync(buffer, opt_params) {
  /** @type {Zlib.Inflate} deflate decoder. */
  var inflate;
  /** @type {!(Buffer|Array.<number>|Uint8Array)} inflated plain buffer. */
  var inflated;

  buffer.subarray = buffer.slice;
  inflate = new Zlib.Inflate(buffer);
  inflated = inflate.decompress();

  if (!opt_params) {
    opt_params = {};
  }

  return opt_params['noBuffer'] ? inflated : toBuffer(inflated);
}

/**
 * gunzip async.
 * @param {!(Array.<number>|Uint8Array)} buffer inflated buffer.
 * @param {function(Error, !(Buffer|Array.<number>|Uint8Array))} callback
 *     error calllback function.
 * @param {Object=} opt_params option parameters.
 */
function gzip(buffer, callback, opt_params) {
  process.nextTick(function(){
    /** @type {Error} error */
    var error;
    /** @type {!(Buffer|Array.<number>|Uint8Array)} deflated buffer. */
    var deflated;

    try {
      deflated = gzipSync(buffer, opt_params);
    } catch(e){
      error = e;
    }

    callback(error, deflated);
  });
}

/**
 * deflate sync.
 * @param {!(Array.<number>|Uint8Array)} buffer inflated buffer.
 * @param {Object=} opt_params option parameters.
 * @return {!(Buffer|Array.<number>|Uint8Array)} deflated buffer.
 */
function gzipSync(buffer, opt_params) {
  /** @type {Zlib.Gzip} deflate compressor. */
  var deflate;
  /** @type {!(Buffer|Array.<number>|Uint8Array)} deflated buffer. */
  var deflated;

  buffer.subarray = buffer.slice;
  deflate = new Zlib.Gzip(buffer);
  deflated = deflate.compress();

  if (!opt_params) {
    opt_params = {};
  }

  return opt_params.noBuffer ? deflated : toBuffer(deflated);
}

/**
 * gunzip async.
 * @param {!(Array.<number>|Uint8Array)} buffer deflated buffer.
 * @param {function(Error, !(Buffer|Array.<number>|Uint8Array))} callback
 *     error calllback function.
 * @param {Object=} opt_params option parameters.
 */
function gunzip(buffer, callback, opt_params) {
  process.nextTick(function(){
    /** @type {Error} error */
    var error;
    /** @type {!(Buffer|Array.<number>|Uint8Array)} inflated plain buffer. */
    var inflated;

    try {
      inflated = gunzipSync(buffer, opt_params);
    } catch(e){
      error = e;
    }

    callback(error, inflated);
  });
}

/**
 * inflate sync.
 * @param {!(Array.<number>|Uint8Array)} buffer deflated buffer.
 * @param {Object=} opt_params option parameters.
 * @return {!(Buffer|Array.<number>|Uint8Array)} inflated plain buffer.
 */
function gunzipSync(buffer, opt_params) {
  /** @type {Zlib.Gunzip} deflate decompressor. */
  var inflate;
  /** @type {!(Buffer|Array.<number>|Uint8Array)} inflated plain buffer. */
  var inflated;

  buffer.subarray = buffer.slice;
  inflate = new Zlib.Gunzip(buffer);
  inflated = inflate.decompress();

  if (!opt_params) {
    opt_params = {};
  }

  return opt_params.noBuffer ? inflated : toBuffer(inflated);
}


/**
 * convert to Buffer.
 * @param {!(Array.<number>|Uint8Array)} array arraylike object.
 * @return {!Buffer} Buffer object.
 */
function toBuffer(array) {
  var buffer = new Buffer(array.length);
  var i;
  var il;

  // TODO: loop unrolling for performance
  for (i = 0, il = array.length; i < il; ++i) {
    buffer[i] = array[i];
  }

  return buffer;
}

