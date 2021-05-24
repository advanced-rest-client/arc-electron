/* eslint-disable no-multi-assign */
const path = require('path');
const { Application } = require('spectron');
const electronPath = require('electron');
const fs = require('fs-extra');

const appPath = path.join(__dirname, '..', 'src', 'io', 'main.js');
const basePath = path.join('test', 'playground');

/** @typedef {import('spectron').AppConstructorOptions} AppConstructorOptions */

const settingsFilePath = module.exports.settingsFilePath = path.join(basePath, 'settings.json');
const workspaceFilePath = module.exports.workspaceFilePath = path.join(basePath, 'workspace');
const themesFilePath = module.exports.themesFilePath = path.join(basePath, 'themes');

function getApp(opts={}) {
  const options = /** @type AppConstructorOptions */ ({
    path: /** @type any */ (electronPath),
    // startTimeout: 5000,
    // waitTimeout: 5000,
    args: [
      appPath, '--test'
    ],
    requireName: 'electronRequire',
    // chromeDriverLogPath: path.join(__dirname, 'log.log'),
  });
  if (opts.args) {
    options.args = options.args.concat(opts.args);
  } else {
    options.args = options.args.concat([
      '--workspace-path', workspaceFilePath,
      '--settings-file', settingsFilePath,
      '--themes-path', themesFilePath,
    ]);
  }
  // console.log(options);
  return new Application(options);
}

function deffer(timeout) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, timeout);
  });
}

async function runAppDeferred(timeout=5000, opts) {
  const app = getApp(opts);
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

async function stopAndClean(app, clearPath=basePath) {
  if (app && app.isRunning()) {
    await app.stop();
  }
  await fs.remove(clearPath);
}

module.exports.getApp = getApp;
module.exports.runAppDeferred = runAppDeferred;
module.exports.stopAndClean = stopAndClean;
module.exports.deffer = deffer;
