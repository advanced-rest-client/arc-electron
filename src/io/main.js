/* eslint-disable global-require */
try {
	require('electron-reloader')(module);
} catch (_) {
  // ...
}

const _require = require("esm")(module);

_require('./main.esm.js');