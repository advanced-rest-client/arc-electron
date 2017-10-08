goog.require('Zlib.Zip');
goog.require('Zlib.exportObject');

goog.exportSymbol(
  'Zlib.Zip',
  Zlib.Zip
);
goog.exportSymbol(
  'Zlib.Zip.prototype.addFile',
  Zlib.Zip.prototype.addFile
);
goog.exportSymbol(
  'Zlib.Zip.prototype.compress',
  Zlib.Zip.prototype.compress
);
goog.exportSymbol(
  'Zlib.Zip.prototype.setPassword',
  Zlib.Zip.prototype.setPassword
);
Zlib.exportObject(
 'Zlib.Zip.CompressionMethod', {
    'STORE': Zlib.Zip.CompressionMethod.STORE,
    'DEFLATE': Zlib.Zip.CompressionMethod.DEFLATE
  }
);
Zlib.exportObject(
  'Zlib.Zip.OperatingSystem', {
    'MSDOS': Zlib.Zip.OperatingSystem.MSDOS,
    'UNIX': Zlib.Zip.OperatingSystem.UNIX,
    'MACINTOSH': Zlib.Zip.OperatingSystem.MACINTOSH
  }
);
// TODO: Deflate Option