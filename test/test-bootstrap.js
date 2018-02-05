const path = require('path');
const Application = require('spectron').Application;

let electronPath = path.join(__dirname, '..', 'node_modules', '.bin',
  'electron');
if (process.platform === 'win32') {
  electronPath += '.cmd';
}
const appPath = path.join(__dirname, '..', 'main.js');

function getApp(opts) {
  opts = opts || {};
  let options = {
    path: electronPath,
    startTimeout: 50000,
    waitTimeout: 50000,
    args: [appPath]
  };
  if (opts.args) {
    options.args = options.args.concat(opts.args);
  }
  return new Application(options);
}

function deffer(timeout) {
  return new Promise(function(resolve) {
    setTimeout(function() {
      resolve();
    }, timeout);
  });
}

function runAppDeffered(timeout, opts) {
  const app = getApp(opts);
  timeout = timeout || 5000;
  return app.start()
  .then(() => app.client.waitUntilWindowLoaded(10000))
  .then(() => deffer(timeout))
  .then(() => app);
}

module.exports.getApp = getApp;
module.exports.runAppDeffered = runAppDeffered;
