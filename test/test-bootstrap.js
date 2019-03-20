const path = require('path');
const {Application} = require('spectron');
const electronPath = require('electron');
const fs = require('fs-extra');

const appPath = path.join(__dirname, '..', 'main.js');
const basePath = path.join('test', 'playground');
console.log('App path ', appPath);

const settingsFilePath = module.exports.settingsFilePath = path.join(basePath, 'settings.json');
const workspaceFilePath = module.exports.workspaceFilePath = path.join(basePath, 'workspace');
const themesFilePath = module.exports.themesFilePath = path.join(basePath, 'themes');

function getApp(opts) {
  opts = opts || {};
  const options = {
    path: electronPath,
    startTimeout: 50000,
    waitTimeout: 50000,
    args: [
      appPath, '--test'
    ],
    requireName: 'electronRequire'
  };
  if (opts.args) {
    options.args = options.args.concat(opts.args);
  } else {
    options.args = options.args.concat([
      '--workspace-path', workspaceFilePath,
      '--settings-file', settingsFilePath,
      '--themes-path', themesFilePath
    ]);
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
  .then(() => app)
  .catch((cause) => {
    if (app && app.isRunning()) {
      return app.stop()
      .then(() => {
        throw cause;
      });
    }
    throw cause;
  });
}

function stopAndClean(app, clearPath) {
  clearPath = clearPath || basePath;
  let p;
  if (app && app.isRunning()) {
    p = app.stop();
  } else {
    p = Promise.resolve();
  }
  return p.then(() => fs.remove(clearPath));
}

module.exports.getApp = getApp;
module.exports.runAppDeffered = runAppDeffered;
module.exports.stopAndClean = stopAndClean;
