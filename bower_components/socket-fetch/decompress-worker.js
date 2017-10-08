/* global Zlib, importScripts, self */
importScripts('../zlib/bin/zlib_and_gzip.min.js');

self.addEventListener('message', function(e) {
  var buffer = e.data.buffer;
  var compression = e.data.compression;
  var inflate;
  if (compression.indexOf('gzip') !== -1) {
    inflate = new Zlib.Gunzip(buffer);
    buffer = inflate.decompress();
  } else if (compression.indexOf('deflate') !== -1) {
    inflate = new Zlib.Inflate(buffer);
    buffer = inflate.decompress();
  }
  self.postMessage(buffer);
});
