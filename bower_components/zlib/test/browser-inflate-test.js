(function() {

var fixedData =
  'eJztzydhGAAAALDd/v////////////////////////////////9no6BxkF+///z99x8A' +
    'EAgYBBQMHAISChoGFg4eAREJGQUVDR0DEwsbBxcPn4CQiJiElIycgpKKmoaWjp6BkYmZ' +
    'hZWNnYOTi5uHl49fQFBIWERUTFxCUkpaRlZOXkFRSVlFVU1dQ1NLW0dXT9/A0MjYxNTM' +
    '3MLSytrG1s7ewdHJ2cXVzd3D08vbx9fPPyAwKDgkNCw8IjIqOiY2Lj4hMSk5JTUtPSMz' +
    'KzsnNy+/oLCouKS0rLyisqq6prauvqGxqbmlta29o7Oru6e3r39gcGh4ZHRsfGJyanpm' +
    'dm5+YXFpeWV1bX1jc2t7Z3dv/+Dw6Pjk9Oz84vLq+ub27v7h8en55fXt/ePz5//z//n/' +
    '/H/+P/+f/8//5//z//n//H/+P/+f/8//5//z//n//H/+P/+f/8//5//z//n//H/+P/+f' +
    '/8//5//z//n//H/+P/+f/8//5//z//n//H/+P/+f/8//5//z//n//H/+P/+f/8//5//z' +
    '//n//H/+P/+f/8//5//z//n//H/+P/+f/8//5//z//n//H/+P/+f/8//5//z//n//H/+' +
    'P/+f/8//5//z//n//H/+P/+f/8//5//z//n//H/+P/+f/8//5//z//n//H/+P/+f/8//' +
    '5//z//n//H/+P/+f/8//5//z//n//H/+P/+f/8//5//z//n//H/+P/+f/8//5//z//n/' +
    '/H/+P/+f/8//5//z//n//H/+P/+f/8//5//z//n//H/+P/+f/8//5//z//n//H/+P/+f' +
    '/8//5//z//n//H/+P/+f/8//5//z//n//H/+P/+f/8//5//z//n//H/+P/+f/8//5//z' +
    '//n//H/+P/+f/8//5//z//n//H/+P/+f/8//5//z//n//H/+P/+f/8//5//z//n//H/+' +
    'P/+f/8//5//z//n//H/+P/+f/8//5//z//n//H/+P/+f/8//5//z//n//H/+P/+f/8//' +
    '5//z//n//H/+P/+f/8//5//z//n//H/+P/+f/8//5//z//n//H/+P/+f/8//5//z//n/' +
    '/H/+P/+f/8//5//z//n//H/+P/+f/8//5//z//n//H/+P/+f/8//5//z//n//H/+P/+f' +
    '/8//5//z//n//H/+P/+f/8//5//z//n//H/+P/+f/8//5//z//n//H/+P/+f/8//5//z' +
    '//n//H/+P/+f/8//5//z//n//H/+P/+f/8//5//z//n//H/+P/+f/8//5//z//n//H/+' +
    'P/+f/8//5//z//n//H/+P/+f/8//5//z//n//H/+P/+f/8//5//z//n//H/+P/+f/8//' +
    '5//z//n//H/+P/+f/8//5//z//n//H/+P/+f/8//5//z//n//H/+P/+f/8//5//z//n/' +
    '/H/+P/+f/8//5//z//n//H/+P/+f/8//5//z//n//H/+P/+f/8//5//z//n//H/+P/+f' +
    '/8//5//z//n//H/+P/+f/8//5//z//n//H/+P/+f/8//5//z//n//H/+P/+f/8//5//z' +
    '//n//H/+P/+f/8//5//z//n//H/+3+P/Ba1OJPE=';

buster.testCase(
  "inflate only",
  {
    //-------------------------------------------------------------------------
    "pre-deflated data":
    //-------------------------------------------------------------------------
      function() {
        var size = 123456;
        var plain = new (USE_TYPEDARRAY ? Uint8Array : Array)(size);
        var i, il;
        var testData = fixedData;

        // make plain data
        for (i = 0, il = size; i < il; ++i) {
          plain[i] = i & 0xff;
        }

        var decodedData = decodeB64(testData);

        // testdata size
        buster.assert.equals(testData.length, 1604, "source data size");
        buster.assert.equals(decodedData.length, 1202, "base64 decoded data size");

        var inflator = new Zlib.Inflate(decodedData);
        var inflated = inflator.decompress();

        buster.assert.equals(inflated.length, size, "inflated data size");
        buster.assert(arrayEquals(inflated, plain));
      },
    //-------------------------------------------------------------------------
    "pre-deflated data with inflate bufferSize option":
    //-------------------------------------------------------------------------
      function() {
        var size = 123456;
        var plain = new (USE_TYPEDARRAY ? Uint8Array : Array)(size);
        var i, il;
        var testData = fixedData;

        // make plain data
        for (i = 0, il = size; i < il; ++i) {
          plain[i] = i & 0xff;
        }

        var decodedData = decodeB64(testData);

        // testdata size
        buster.assert.equals(testData.length, 1604, "source data size");
        buster.assert.equals(decodedData.length, 1202, "base64 decoded data size");

        var inflator = new Zlib.Inflate(decodedData, {bufferSize: 123456});
        var inflated = inflator.decompress();

        console.log("buffer size:", inflated.buffer.byteLength);
        buster.assert.equals(inflated.length, size, "inflated data size");
        buster.assert.equals(inflated.buffer.byteLength, 123456, "inflated data buffer size");
        buster.assert(arrayEquals(inflated, plain));
      },
    //-------------------------------------------------------------------------
    "pre-deflated data with inflate bufferType option":
    //-------------------------------------------------------------------------
      function() {
        var size = 123456;
        var plain = new (USE_TYPEDARRAY ? Uint8Array : Array)(size);
        var i, il;
        var testData = fixedData;

        // make plain data
        for (i = 0, il = size; i < il; ++i) {
          plain[i] = i & 0xff;
        }

        var decodedData = decodeB64(testData);

        // testdata size
        buster.assert.equals(testData.length, 1604, "source data size");
        buster.assert.equals(decodedData.length, 1202, "base64 decoded data size");

        var inflator = new Zlib.Inflate(decodedData, {
          bufferType: Zlib.Inflate.BufferType.BLOCK,
          bufferSize: 41152,
          verify: true
        });
        var inflated = inflator.decompress();

        console.log("buffer size:", inflated.buffer.byteLength);
        buster.assert.equals(inflated.length, size, "inflated data size");
        buster.assert.equals(inflated.buffer.byteLength, 123456, "inflated data buffer size");
        buster.assert(arrayEquals(inflated, plain));
      },
    //-------------------------------------------------------------------------
    "pre-deflated data with inflate resize option":
    //-------------------------------------------------------------------------
      function() {
        var size = 123456;
        var plain = new (USE_TYPEDARRAY ? Uint8Array : Array)(size);
        var i, il;
        var testData = fixedData;

        // make plain data
        for (i = 0, il = size; i < il; ++i) {
          plain[i] = i & 0xff;
        }

        var decodedData = decodeB64(testData);

        // testdata size
        buster.assert.equals(testData.length, 1604, "source data size");
        buster.assert.equals(decodedData.length, 1202, "base64 decoded data size");

        var inflator = new Zlib.Inflate(decodedData, {
          bufferType: Zlib.Inflate.BufferType.BLOCK,
          bufferSize: 41153,
          resize: true
        });
        var inflated = inflator.decompress();

        console.log("buffer size:", inflated.buffer.byteLength);
        buster.assert.equals(inflated.length, size, "inflated data size");
        buster.assert.equals(inflated.buffer.byteLength, 123456, "inflated data buffer size");
        buster.assert(arrayEquals(inflated, plain));
      }
  }
);

})();