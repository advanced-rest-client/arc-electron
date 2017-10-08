var zlib = require('../bin/node-jszlib.js');
var size = 123456;
var testData = new Uint8Array(size);
var i, il;

for (i = 0, il = size; i < il; ++i) {
  testData[i] = i & 0xff;
}

var Zlib = require('zlib');
var deflated = zlib.deflateSync(testData);

var USE_TYPEDARRAY = typeof Uint8Array === 'function';

function decodeB64(b64buf) {
  var decoded =
    new (USE_TYPEDARRAY ? Uint8Array : Array)(b64buf.length * 3 / 4 | 0);
  var tmp;
  var pos = 0;
  var i, il;
  var table = decodeB64.DecodeTable;

  for (i = 0, il = b64buf.length; i < il; i += 4, pos += 3) {
    tmp = (table[b64buf.charCodeAt(i)  ] << 18) |
          (table[b64buf.charCodeAt(i+1)] << 12) |
          (table[b64buf.charCodeAt(i+2)] <<  6) |
          (table[b64buf.charCodeAt(i+3)]);
    decoded[pos]   = tmp >>> 16;
    decoded[pos+1] = tmp >>> 8 & 0xff;
    decoded[pos+2] = tmp       & 0xff;
  }

  return decoded;
}
decodeB64.DecodeTable = (function(chars){
  var table = new (USE_TYPEDARRAY ? Uint8Array : Array)(256);

  for (var i = 0, il = chars.length; i < il; ++i) {
    table[chars.charCodeAt(i)] = i;
  }

  return table;
})('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/');


console.log(deflated.toString("base64").length);
console.log(decodeB64(deflated.toString('base64')).length);
