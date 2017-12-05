const path = require('path');
const Application = require('spectron').Application;

var electronPath = path.join(__dirname, '..', 'node_modules', '.bin', 'electron');
if (process.platform === 'win32') {
  electronPath += '.cmd';
}
const appPath = path.join(__dirname, '..', 'main.js');

module.exports.getApp = (opts) => {
  opts = opts || {};
  var options = {
    path: electronPath,
    startTimeout: 50000,
    waitTimeout: 50000,
    args: [appPath]
  };
  if (opts.args) {
    options.args = options.args.concat(opts.args);
  }
  return new Application(options);
};
