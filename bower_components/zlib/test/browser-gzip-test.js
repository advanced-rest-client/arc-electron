buster.testCase(
  "gzip",
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
    "random sequential data":
    //-------------------------------------------------------------------------
      function() {
        makeRandomSequentialData(this.testData);

        var deflator = new Zlib.Gzip(this.testData);
        var deflated = deflator.compress();

        var inflator = new Zlib.Gunzip(deflated);
        var inflated = inflator.decompress();

        buster.assert.equals(inflated.length, this.testData.length, "inflated data size");
        buster.assert.equals(inflated, this.testData);
      },
    //-------------------------------------------------------------------------
    "compress with filename":
    //-------------------------------------------------------------------------
      function() {
        makeRandomSequentialData(this.testData);

        var deflator =
          new Zlib.Gzip(
            this.testData,
            {
              flags: {
                fname: true,
                fcommenct: false,
                fhcrc: false
              },
              filename: 'foobar.filename'
            }
          );
        var deflated = deflator.compress();

        var inflator = new Zlib.Gunzip(deflated);
        var inflated = inflator.decompress();

        buster.assert.equals(inflated.length, this.testData.length, "inflated data size");
        buster.assert.equals(inflated, this.testData);
        buster.assert.equals((inflator.getMembers())[0].getName(), 'foobar.filename');
      },
    //-------------------------------------------------------------------------
    "compress with filename (seed: 1346432776267)":
    //-------------------------------------------------------------------------
      function() {
        makeRandomSequentialData(this.testData, 1346432776267);

        var deflator =
          new Zlib.Gzip(
            this.testData,
            {
              flags: {
                fname: true,
                fcommenct: false,
                fhcrc: false
              },
              filename: 'foobar.filename'
            }
          );
        var deflated = deflator.compress();

        var inflator = new Zlib.Gunzip(deflated);
        var inflated = inflator.decompress();

        buster.assert.equals(inflated.length, this.testData.length, "inflated data size");
        buster.assert.equals(inflated, this.testData);
        buster.assert.equals((inflator.getMembers())[0].getName(), 'foobar.filename');
      }
  }
);