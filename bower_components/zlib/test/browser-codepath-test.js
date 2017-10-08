(function() {

buster.testCase(
  "code path",
  {
    setUp: function() {
      var size = 76543;
      var testData = new (USE_TYPEDARRAY ? Uint8Array : Array)(size);

      console.log("use typedarray:", USE_TYPEDARRAY);

      this.testData = testData;
      this.none = sinon.spy(Zlib.RawDeflate.prototype, "makeNocompressBlock");
      this.fixed = sinon.spy(Zlib.RawDeflate.prototype, "makeFixedHuffmanBlock");
      this.dynamic = sinon.spy(Zlib.RawDeflate.prototype, "makeDynamicHuffmanBlock");
    },
    tearDown: function() {
      this.none.restore();
      this.fixed.restore();
      this.dynamic.restore();
    },
    "undercomitted": function() {
      var data = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23];
      var compressed = new Zlib.Deflate(data).compress();
      var decompressed = new Zlib.Inflate(compressed).decompress();
      buster.assert(arrayEquals(data, Array.prototype.slice.call(decompressed)));
    },
    "uncompressed random data": function() {
      makeRandomData(this.testData);
      inflateTest('random', this.testData, Zlib.Deflate.CompressionType.NONE);

      buster.assert(this.none.called);
      buster.refute(this.fixed.called);
      buster.refute(this.dynamic.called);
    },
    "fixed random data": function() {
      makeRandomData(this.testData);
      inflateTest('random', this.testData, Zlib.Deflate.CompressionType.FIXED);

      buster.refute(this.none.called);
      buster.assert(this.fixed.called);
      buster.refute(this.dynamic.called);
    },
    "dynamic random data": function() {
      makeRandomData(this.testData);
      inflateTest('random', this.testData, Zlib.Deflate.CompressionType.DYNAMIC);

      buster.refute(this.none.called);
      buster.refute(this.fixed.called);
      buster.assert(this.dynamic.called);
    },
    "uncompressed sequential data": function() {
      makeSequentialData(this.testData);
      inflateTest('sequential', this.testData, Zlib.Deflate.CompressionType.NONE);

      buster.assert(this.none.called);
      buster.refute(this.fixed.called);
      buster.refute(this.dynamic.called);
    },
    "fixed sequential data": function() {
      makeSequentialData(this.testData);
      inflateTest('sequential', this.testData, Zlib.Deflate.CompressionType.FIXED);

      buster.refute(this.none.called);
      buster.assert(this.fixed.called);
      buster.refute(this.dynamic.called);
    },
    "dynamic sequential data": function() {
      makeSequentialData(this.testData);
      inflateTest('sequential', this.testData, Zlib.Deflate.CompressionType.DYNAMIC);

      buster.refute(this.none.called);
      buster.refute(this.fixed.called);
      buster.assert(this.dynamic.called);
    },
    "uncompressed random sequential data": function() {
      makeRandomSequentialData(this.testData);
      inflateTest('sequential', this.testData, Zlib.Deflate.CompressionType.NONE);

      buster.assert(this.none.called);
      buster.refute(this.fixed.called);
      buster.refute(this.dynamic.called);
    },
    "fixed random sequential data": function() {
      makeRandomSequentialData(this.testData);
      inflateTest('sequential', this.testData, Zlib.Deflate.CompressionType.FIXED);

      buster.refute(this.none.called);
      buster.assert(this.fixed.called);
      buster.refute(this.dynamic.called);
    },
    "dynamic random sequential data": function() {
      makeRandomSequentialData(this.testData);
      inflateTest('sequential', this.testData, Zlib.Deflate.CompressionType.DYNAMIC);

      buster.refute(this.none.called);
      buster.refute(this.fixed.called);
      buster.assert(this.dynamic.called);
    },
    //-------------------------------------------------------------------------
    // stream
    //-------------------------------------------------------------------------
    "uncompressed random sequential data (stream)": function() {
      makeRandomSequentialData(this.testData);
      inflateStreamTest('sequential', this.testData, Zlib.Deflate.CompressionType.NONE);

      buster.assert(this.none.called);
      buster.refute(this.fixed.called);
      buster.refute(this.dynamic.called);
    },
    "fixed random sequential data (stream)": function() {
      makeRandomSequentialData(this.testData);
      inflateStreamTest('sequential', this.testData, Zlib.Deflate.CompressionType.FIXED);

      buster.refute(this.none.called);
      buster.assert(this.fixed.called);
      buster.refute(this.dynamic.called);
    },
    "dynamic random sequential data (stream)": function() {
      makeRandomSequentialData(this.testData);
      inflateStreamTest('sequential', this.testData, Zlib.Deflate.CompressionType.DYNAMIC);

      buster.refute(this.none.called);
      buster.refute(this.fixed.called);
      buster.assert(this.dynamic.called);
    }
  }
);

// inflate test
function inflateTest(mode, testData, compressionType) {
  var deflate;
  var inflate;

  console.log("mode:", mode);
  console.log("type:", compressionType);

  // deflate
  deflate = new Zlib.Deflate(testData, {
    compressionType: compressionType
  }).compress();
  console.log("deflated data size:", deflate.length);

  // inflate
  inflate = (new Zlib.Inflate(deflate, {
    verify: true
  })).decompress();
  console.log("inflated data size:", inflate.length)

  // assertion
  buster.assert(inflate.length, testData.length);
  buster.assert(arrayEquals(inflate, testData));
}

// inflate test
function inflateStreamTest(mode, testData, compressionType) {
  var deflate;
  var inflate;
  var inflator;
  var buf;
  var tmp;
  var i;
  var il;

  console.log("mode:", mode);
  console.log("type:", compressionType);

  // deflate
  deflate = Zlib.Deflate.compress(testData, {
    compressionType: compressionType
  });
  console.log("deflated data size:", deflate.length);

  // inflate
  inflator = new Zlib.InflateStream();
  inflate = new (USE_TYPEDARRAY ? Uint8Array : Array)();
  for (i = 0, il = deflate.length; i < il; ++i) {
    buf = inflator.decompress(deflate.subarray(i, i + 1));
    tmp = new (USE_TYPEDARRAY ? Uint8Array : Array)(buf.length + inflate.length);
    tmp.set(inflate, 0);
    tmp.set(buf, inflate.length);
    inflate = tmp;
  }
  console.log("inflated data size:", inflate.length)

  // assertion
  buster.assert(inflate.length, testData.length);
  buster.assert(arrayEquals(inflate, testData));
}

})();
