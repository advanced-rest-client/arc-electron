(function() {

buster.testCase(
  'raw',
  {
    setUp: function() {
      var size = 76543;
      var testData = new (USE_TYPEDARRAY ? Uint8Array : Array)(size);

      console.log("use typedarray:", USE_TYPEDARRAY);

      this.testData = testData;
    },

    "uncompressed random data":
      function() {
        makeRandomData(this.testData);
        rawInflateTest('random', this.testData, Zlib.RawDeflate.CompressionType.NONE);
      },
    "fixed random data":
      function() {
        makeRandomData(this.testData);
        rawInflateTest('random', this.testData, Zlib.RawDeflate.CompressionType.FIXED);
      },
    "dynamic random data":
      function() {
        makeRandomData(this.testData);
        rawInflateTest('random', this.testData, Zlib.RawDeflate.CompressionType.DYNAMIC);
      },
    "uncompressed sequential data":
      function() {
        makeSequentialData(this.testData);
        rawInflateTest('sequential', this.testData, Zlib.RawDeflate.CompressionType.NONE);
      },
    "fixed sequential data":
      function() {
        makeSequentialData(this.testData);
        rawInflateTest('sequential', this.testData, Zlib.RawDeflate.CompressionType.FIXED);
      },
    "dynamic sequential data":
      function() {
        makeSequentialData(this.testData);
        rawInflateTest('sequential', this.testData, Zlib.RawDeflate.CompressionType.DYNAMIC);
      },
    "uncompressed random sequential data":
      function() {
        makeRandomSequentialData(this.testData);
        rawInflateTest('sequential', this.testData, Zlib.RawDeflate.CompressionType.NONE);
      },
    "fixed random sequential data":
      function() {
        makeRandomSequentialData(this.testData);
        rawInflateTest('sequential', this.testData, Zlib.RawDeflate.CompressionType.FIXED);
      },
    "dynamic random sequential data":
      function() {
        makeRandomSequentialData(this.testData);
        rawInflateTest('sequential', this.testData, Zlib.RawDeflate.CompressionType.DYNAMIC);
      },
    "undercomitted":
      function() {
        var data = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23];
        var compressed = new Zlib.RawDeflate(data).compress();
        var decompressed = new Zlib.RawInflate(compressed).decompress();
        buster.assert(arrayEquals(data, Array.prototype.slice.call(decompressed)));
      }
  }
);


// inflate test
function rawInflateTest(mode, testData, compressionType, inflateOption) {
  var deflate;
  var inflate;

  console.log("type:", compressionType);

  // deflate
  deflate = new Zlib.RawDeflate(testData, {
    compressionType: compressionType
  }).compress();
  console.log("deflated data size:", deflate.length);

  // inflate
  if (inflateOption) {
    inflateOption.verify = true;
  } else {
    inflateOption = {verify: true};
  }
  inflate = (new Zlib.RawInflate(deflate, inflateOption)).decompress();
  console.log("inflated data size:", inflate.length)

  // assertion
  buster.assert(inflate.length, testData.length);
  buster.assert(arrayEquals(inflate, testData));
}

})();
