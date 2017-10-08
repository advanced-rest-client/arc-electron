buster.testCase(
  "zip",
  {
    //-------------------------------------------------------------------------
    setUp:
    //-------------------------------------------------------------------------
      function() {
        var size = 76543;
        var testData = new (USE_TYPEDARRAY ? Uint8Array : Array)(size);

        console.log("use typedarray:", USE_TYPEDARRAY);

        this.testData = testData;
      },
    //-------------------------------------------------------------------------
    'compress (store)':
    //-------------------------------------------------------------------------
      function() {
        makeRandomSequentialData(this.testData);

        var testData = {
          'hogehoge': this.testData,
          'fugafuga': this.testData,
          'piyopiyo': this.testData
        };
        var keys = [];
        var key;
        var i = 0;
        var il;

        for (key in testData) {
          keys[i++] = key;
        }

        var zip = new Zlib.Zip();
        for (i = 0, il = keys.length; i < il; ++i) {
          key = keys[i];
          zip.addFile(testData[key], {
            filename: stringToByteArray(key),
            compressionMethod: Zlib.Zip.CompressionMethod.STORE
          });
        }
        var zipped = zip.compress();

        var unzip = new Zlib.Unzip(zipped, {
          'verify': true
        });
        var files = {};
        var filenames = unzip.getFilenames();

        for (i = 0, il = filenames.length; i < il; ++i) {
          files[filenames[i]] = unzip.decompress(filenames[i]);
        }

        buster.assert(
          arrayEquals(
            files['hogehoge'],
            this.testData
          ),
          "hogehoge"
        );
        buster.assert(
          arrayEquals(
            files['fugafuga'],
            this.testData
          ),
          "fugafuga"
        );
        buster.assert(
          arrayEquals(
            files['piyopiyo'],
            this.testData
          ),
          "piyopiyo"
        );
      },
    //-------------------------------------------------------------------------
    'compress (deflate)':
    //-------------------------------------------------------------------------
      function() {
        makeRandomSequentialData(this.testData);

        var testData = {
          'hogehoge': this.testData,
          'fugafuga': this.testData,
          'piyopiyo': this.testData
        };
        var keys = [];
        var key;
        var i = 0;
        var il;

        for (key in testData) {
          keys[i++] = key;
        }

        var zip = new Zlib.Zip();
        for (i = 0, il = keys.length; i < il; ++i) {
          key = keys[i];
          zip.addFile(testData[key], {
            filename: stringToByteArray(key),
            compressionMethod: Zlib.Zip.CompressionMethod.DEFLATE
          });
        }
        var zipped = zip.compress();

        var unzip = new Zlib.Unzip(zipped, {
          'verify': true
        });
        var files = {};
        var filenames = unzip.getFilenames();

        for (i = 0, il = filenames.length; i < il; ++i) {
          files[filenames[i]] = unzip.decompress(filenames[i]);
        }

        buster.assert(
          arrayEquals(
            files['hogehoge'],
            this.testData
          ),
          "hogehoge"
        );
        buster.assert(
          arrayEquals(
            files['fugafuga'],
            this.testData
          ),
          "fugafuga"
        );
        buster.assert(
          arrayEquals(
            files['piyopiyo'],
            this.testData
          ),
          "piyopiyo"
        );
      },
    //-------------------------------------------------------------------------
    'compress with password (deflate)':
    //-------------------------------------------------------------------------
      function() {
        makeRandomSequentialData(this.testData);

        var testData = {
          'hogehoge': this.testData,
          'fugafuga': this.testData,
          'piyopiyo': this.testData
        };
        var keys = [];
        var key;
        var i = 0;
        var il;

        for (key in testData) {
          keys[i++] = key;
        }

        var zip = new Zlib.Zip();
        zip.setPassword([0,1,2,3,4,5,6,7,8,9]);
        for (i = 0, il = keys.length; i < il; ++i) {
          key = keys[i];
          zip.addFile(testData[key], {
            filename: stringToByteArray(key),
            compressionMethod: Zlib.Zip.CompressionMethod.DEFLATE
          });
        }
        var zipped = zip.compress();

        var unzip = new Zlib.Unzip(zipped, {
          'password': [0,1,2,3,4,5,6,7,8,9],
          'verify': true
        });
        var files = {};
        var filenames = unzip.getFilenames();

        for (i = 0, il = filenames.length; i < il; ++i) {
          files[filenames[i]] = unzip.decompress(filenames[i]);
        }

        buster.assert(
          arrayEquals(
            files['hogehoge'],
            this.testData
          ),
          "hogehoge"
        );
        buster.assert(
          arrayEquals(
            files['fugafuga'],
            this.testData
          ),
          "fugafuga"
        );
        buster.assert(
          arrayEquals(
            files['piyopiyo'],
            this.testData
          ),
          "piyopiyo"
        );
      },
    //-------------------------------------------------------------------------
    'compress with password (each file)':
    //-------------------------------------------------------------------------
      function() {
        makeRandomSequentialData(this.testData);

        var testData = {
          'hogehoge': [this.testData, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]],
          'fugafuga': [this.testData, [0, 2, 4, 6, 8,10,12,14,16,18]],
          'piyopiyo': [this.testData, [1, 3, 5, 7, 9,11,13,15,17,19]]
        };
        var keys = [];
        var key;
        var i = 0;
        var il;

        for (key in testData) {
          keys[i++] = key;
        }

        var zip = new Zlib.Zip();
        for (i = 0, il = keys.length; i < il; ++i) {
          key = keys[i];
          zip.addFile(testData[key][0], {
            filename: stringToByteArray(key),
            compressionMethod: Zlib.Zip.CompressionMethod.DEFLATE,
            password: testData[key][1]
          });
        }
        var zipped = zip.compress();

        var unzip = new Zlib.Unzip(zipped, {
          'verify': true
        });
        var files = {};
        var filenames = unzip.getFilenames();

        for (i = 0, il = filenames.length; i < il; ++i) {
          files[filenames[i]] = unzip.decompress(
            filenames[i],
            {
              'password': testData[filenames[i]][1]
            }
          );
        }

        buster.assert(
          arrayEquals(
            files['hogehoge'],
            this.testData
          ),
          "hogehoge"
        );
        buster.assert(
          arrayEquals(
            files['fugafuga'],
            this.testData
          ),
          "fugafuga"
        );
        buster.assert(
          arrayEquals(
            files['piyopiyo'],
            this.testData
          ),
          "piyopiyo"
        );
      }
  }
);





