goog.require('Zlib.Deflate');
goog.require('Zlib.exportObject');

goog.exportSymbol('Zlib.Deflate', Zlib.Deflate);
goog.exportSymbol(
  'Zlib.Deflate.compress',
  Zlib.Deflate.compress
);
goog.exportSymbol(
  'Zlib.Deflate.prototype.compress',
  Zlib.Deflate.prototype.compress
);
Zlib.exportObject('Zlib.Deflate.CompressionType', {
  'NONE': Zlib.Deflate.CompressionType.NONE,
  'FIXED': Zlib.Deflate.CompressionType.FIXED,
  'DYNAMIC': Zlib.Deflate.CompressionType.DYNAMIC
});
