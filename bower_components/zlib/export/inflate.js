goog.require('Zlib.Inflate');
goog.require('Zlib.exportObject');

goog.exportSymbol('Zlib.Inflate', Zlib.Inflate);
goog.exportSymbol(
  'Zlib.Inflate.prototype.decompress',
  Zlib.Inflate.prototype.decompress
);
Zlib.exportObject('Zlib.Inflate.BufferType', {
  'ADAPTIVE': Zlib.Inflate.BufferType.ADAPTIVE,
  'BLOCK': Zlib.Inflate.BufferType.BLOCK
});
