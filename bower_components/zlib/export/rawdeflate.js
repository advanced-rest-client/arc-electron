goog.require('Zlib.RawDeflate');
goog.require('Zlib.exportObject');

goog.exportSymbol(
  'Zlib.RawDeflate',
  Zlib.RawDeflate
);

goog.exportSymbol(
  'Zlib.RawDeflate.prototype.compress',
  Zlib.RawDeflate.prototype.compress
);

Zlib.exportObject(
  'Zlib.RawDeflate.CompressionType',
  {
    'NONE': Zlib.RawDeflate.CompressionType.NONE,
    'FIXED': Zlib.RawDeflate.CompressionType.FIXED,
    'DYNAMIC': Zlib.RawDeflate.CompressionType.DYNAMIC
  }
);
