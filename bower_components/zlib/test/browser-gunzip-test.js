buster.testCase(
  'gunzip',
  {
    //-------------------------------------------------------------------------
    "pre-compressed data":
    //-------------------------------------------------------------------------
      function() {
        var testData =
          "H4sIAAAAAAAAA0tMTEwEAEXlmK0EAAAA";
        var plain = new Uint8Array("aaaa".split('').map(function(c) { return c.charCodeAt(0); }));

        var decodedData = decodeB64(testData);

        var inflator = new Zlib.Gunzip(decodedData);
        var inflated = inflator.decompress();

        buster.assert.equals(inflated.length, plain.length, "inflated data size");
        buster.assert.equals(inflated, plain);
      },
    //-------------------------------------------------------------------------
    "decompress pre-compressed data with filename":
    //-------------------------------------------------------------------------
      function() {
        var testData =
          "H4sICOzl1k8AA2hvZ2UudHh0AMtIzcnJVyjPL8pJ4QIALTsIrwwAAAA=";
        var plain = new Uint8Array(
          "hello world".split('').map(function(c) { return c.charCodeAt(0); }).concat(0x0a)
        );

        var decodedData = decodeB64(testData);
        console.log(decodedData);

        var inflator = new Zlib.Gunzip(decodedData);
        var inflated = inflator.decompress();

        buster.assert.equals(inflated.length, plain.length, "inflated data size");
        buster.assert.equals(inflated, plain);
        buster.assert.equals((inflator.getMembers())[0].getName(), 'hoge.txt');
      }
  }
);

