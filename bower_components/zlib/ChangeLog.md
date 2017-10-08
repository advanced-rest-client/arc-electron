
# Change Log


## 0.1.9, 0.2.0: 2014/02/21

https://github.com/imaya/zlib.js/compare/0.1.8...0.2.0


## decompression

- fix RLE bug HDIST between HLIT


## etc

- support buster.js 0.7.4
- code cleanup


-------------------------------------------------------------------------------


## 0.1.8: 2014/02/16

https://github.com/imaya/zlib.js/compare/0.1.7...0.1.8


not changed. (for npm republish)


-------------------------------------------------------------------------------


## 0.1.7: 2013/07/12

https://github.com/imaya/zlib.js/compare/0.1.6...0.1.7


### compression

- support different password each file in PKZIP

### decompression

- fix PKZIP signedness
- support different password each file in PKZIP
- workaround iOS 6.x safari bug in stream version (thanks to Kazuho Oku)


-------------------------------------------------------------------------------


## 0.1.6: 2013/05/10

https://github.com/imaya/zlib.js/compare/0.1.5...0.1.6


### compression

- export raw deflate


### decompression

- export raw inflate
- fix inflate stream exporting


### etc

- export crc-32
- add pretty print build
- optimize compile settings
- add english document
- support source maps
- support Travis CI
- refactor unit test
- update closure compiler (custom version)


-------------------------------------------------------------------------------


## 0.1.5: 2013/02/10

https://github.com/imaya/zlib.js/compare/0.1.4...0.1.5


### compression

- fix PKZIP CRC-32 bug


### etc

- update PKZIP unit test


-------------------------------------------------------------------------------


## 0.1.4: 2013/02/10

https://github.com/imaya/zlib.js/compare/0.1.3...0.1.4


### compression

- add PKZIP compression (basic support)


### decompression

- add PKZIP decompression (basic support)


### etc

- refactor build environment (use export js file)
- remove license comment in source code


-------------------------------------------------------------------------------


## 0.1.3: 2012/12/21

https://github.com/imaya/zlib.js/compare/0.1.2...0.1.3


### compression

- fix rare case bug


-------------------------------------------------------------------------------


## 0.1.2: 2012/12/17

https://github.com/imaya/zlib.js/compare/0.1.1...0.1.2


### compression

- fix adler-32 bug (byte order)
- refactor raw deflate code

### decompression

- refactor inflate stream code

### etc

- update closure compiler (custom version)
- update inflate unit test (enable adler-32 verification)


-------------------------------------------------------------------------------


## 0.1.1: 2012/11/15

https://github.com/imaya/zlib.js/compare/0.1.0...0.1.1


### compression

- fix huffman coding (add reverse package merge algorithm)

### etc

- fix gunzip unit test


-------------------------------------------------------------------------------


## 0.1.0: 2012/09/24

- first release