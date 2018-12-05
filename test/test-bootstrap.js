const path = require('path');
const {Application} = require('spectron');
const electronPath = require('electron');

const appPath = path.join(__dirname, '..', 'main.js');
console.log('App path ', appPath);

function getApp(opts) {
  opts = opts || {};
  const options = {
    path: electronPath,
    startTimeout: 50000,
    waitTimeout: 50000,
    args: [appPath, '--test'],
    requireName: 'electronRequire'
  };
  if (opts.args) {
    options.args = options.args.concat(opts.args);
  }
  return new Application(options);
}

function deffer(timeout) {
  console.log('Deffering init script for ', timeout, ' ms');
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
