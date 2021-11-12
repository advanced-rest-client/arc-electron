const { app } = require('electron');
// @ts-ignore
const _require = require('esm')(module);
const testPaths = require('./setup-paths.js');

const { setLevel } = _require('../src/io/Logger');

setLevel('error');

app.on('ready', () => {
  testPaths.getBasePath();
  testPaths.setupEnvironment();
});
