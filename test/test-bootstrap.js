const path = require('path');
const { Application } = require('spectron');
const electronPath = require('electron');
const fs = require('fs-extra');

const appPath = path.join(__dirname, '..', 'main.js');
const basePath = path.join('test', 'playground');
// console.log('App path ', appPath);

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
  return new Promise(function(resolve) {
    setTimeout(function() {
      resolve();
    }, timeout);
  });
}

async function runAppDeffered(timeout, opts) {
  const app = getApp(opts);
  timeout = timeout || 5000;
  try {
    await app.start();
    await app.client.waitUntilWindowLoaded(10000);
    await deffer(timeout);
    return app;
  } catch (e) {
    if (app && app.isRunning()) {
      await app.stop();
    }
    throw e;
  }
}

async function stopAndClean(app, clearPath) {
  clearPath = clearPath || basePath;
  if (app && app.isRunning()) {
    await app.stop();
  }
  await fs.remove(clearPath);
}

module.exports.getApp = getApp;
module.exports.runAppDeffered = runAppDeffered;
module.exports.stopAndClean = stopAndClean;
