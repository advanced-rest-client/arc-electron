goog.require('Zlib.RawInflate');
goog.require('Zlib.exportObject');

goog.exportSymbol('Zlib.RawInflate', Zlib.RawInflate);
goog.exportSymbol(
  'Zlib.RawInflate.prototype.decompress',
  Zlib.RawInflate.prototype.decompress
);
Zlib.exportObject('Zlib.RawInflate.BufferType', {
  'ADAPTIVE': Zlib.RawInflate.BufferType.ADAPTIVE,
  'BLOCK': Zlib.RawInflate.BufferType.BLOCK
});
