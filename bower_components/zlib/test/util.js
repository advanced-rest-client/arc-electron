//-----------------------------------------------------------------------------
// base64 decoder
// see http://sourceforge.net/projects/libb64/
//-----------------------------------------------------------------------------
function decodeB64(str) {
  var c, decoded, fragment, i, op, n, table_length, v, il;
  var table = [
    62, -1, -1, -1, 63, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1,
    -1, -1, -2, -1, -1, -1,  0,  1,  2,  3,  4,  5,  6,  7,  8,  9,
    10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
    -1, -1, -1, -1, -1, -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35,
    36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51
  ];
  table_length = table.length;
  decoded = new Array((((table_length + 2) / 3) | 0) * 4);
  c = n = op = 0;

  for (i = 0, il = str.length; i < il; ++i) {
    v = (str.charCodeAt(i) & 0xff) - 43;
    if (v < 0 || v >= table_length) {
      continue;
    }
    fragment = table[v];
    if (fragment < 0) {
      continue;
    }
    switch (n) {
      case 0:
        c = (fragment & 0x03f) << 2;
        ++n;
        break;
      case 1:
        c |= (fragment & 0x030) >> 4;
        decoded[op++] = c;
        c = (fragment & 0x00f) << 4;
        ++n;
        break;
      case 2:
        c |= (fragment & 0x03c) >> 2;
        decoded[op++] = c;
        c = (fragment & 0x003) << 6;
        ++n;
        break;
      case 3:
        c |= fragment & 0x03f;
        decoded[op++] = c;
        n = 0;
    }
  }
  decoded.length = op;

  return decoded;
}

//-----------------------------------------------------------------------------
// array assertion
//-----------------------------------------------------------------------------
function arrayEquals(expected, actuals) {
  var i, il;

  if (expected.length !== actuals.length) {
    return false;
  }

  for (i = 0, il = expected.length; i < il; ++i) {
    if (expected[i] !== actuals[i]) {
      return false;
    }
  }

  return true;
}

//-----------------------------------------------------------------------------
// string to bytearray
//-----------------------------------------------------------------------------
function stringToByteArray(str) {
  var array = new Array(str.length);
  var i;
  var il;

  for (i = 0, il = str.length; i < il; ++i) {
    array[i] = str.charCodeAt(i) & 0xff;
  }

  return array;
}

//-----------------------------------------------------------------------------
// make random data
//-----------------------------------------------------------------------------
function makeRandomData(data) {
  var seed = +new Date();
  var mt = new MersenneTwister(seed);
  var i, il;

  console.log("seed:", seed);

  // make random data
  for (i = 0, il = data.length; i < il; ++i) {
    data[i] = mt.nextInt(256);
  }
}

//-----------------------------------------------------------------------------
// make sequential data
//-----------------------------------------------------------------------------
function makeSequentialData(data) {
  var i, il;

  // make sequential data
  for (i = 0, il = data.length; i < il; ++i) {
    data[i] = i & 0xff;
  }
}

//-----------------------------------------------------------------------------
// make random sequential data
//-----------------------------------------------------------------------------
function makeRandomSequentialData(data) {
  var seed = +new Date();
  var mt = new MersenneTwister(seed);
  var i, il;
  var random1, random2;

  console.log("seed:", seed);

  // make random data
  for (i = 0, il = data.length; i < il;) {
    random1 = mt.nextInt(256);
    random2 = mt.nextInt(256);
    while (random2--) {
      if (i === il) {
        break;
      }
      data[i++] = random1++ & 0xff;
    }
  }
}