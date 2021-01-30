/* eslint-disable global-require */
if (process.env.NODE_ENV !== 'test') {
  try {
    require('electron-reloader')(module);
  } catch (_) {
    // ...
  }
}

const _require = require("esm")(module);

_require('./main.esm.js');
