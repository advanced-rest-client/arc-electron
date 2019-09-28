const { app, protocol } = require('electron');
const arcPaths = require('./arc-paths');
const { AppOptions } = require('./app-options');
const log = require('./logger');
const { ArcEnvironment } = require('./arc-environment');
const { PreferencesManager } = require('../packages/arc-preferences/main');
const { AppDefaults } = require('./app-defaults');
// const temp = require('temp').track();

function getConfig(settingsFile) {
  const config = new PreferencesManager({
    file: settingsFile
  });
  return config.loadSync();
}

module.exports = function(startTime) {
  global.shellStartTime = startTime;

  process.on('uncaughtException', function(error = {}) {
    if (error.message) {
      console.log(error.message);
    }
    if (error.stack) {
      console.log(error.stack);
    }
  });

  process.on('unhandledRejection', function(error = {}) {
    if (error.message) {
      console.log(error.message);
    }

    if (error.stack) {
      console.log(error.stack);
    }
  });

  app.commandLine.appendSwitch('enable-experimental-web-platform-features');

  const startupOptions = new AppOptions();
  startupOptions.parse();
  if (startupOptions.debug) {
    log.level = startupOptions.debugLevel || 'warn';
  }
  const initOptions = startupOptions.getOptions();
  if (!initOptions.open) {
    initOptions.open = [];
  }

  if (initOptions.userDataDir) {
    app.setPath('userData', initOptions.userDataDir);
  }
  // } else if (initOptions.test) {
  //   app.setPath('userData', temp.mkdirSync('arc-test-data'));
  // }

  // Standard scheme must be registered before the app is ready
  protocol.registerSchemesAsPrivileged([
    { scheme: 'web-module', privileges: { standard: true, secure: true } },
    { scheme: 'themes', privileges: { standard: true, secure: true } }
  ]);

  log.debug('Setting up the environment');
  arcPaths.setHome();
  arcPaths.setSettingsFile(initOptions.settingsFile);
  arcPaths.setWorkspacePath(initOptions.workspacePath);
  arcPaths.setThemesPath(initOptions.themesPath);
  arcPaths.setComponentsPath(initOptions.componentsPath);

  // Overrides initial user path to processed by arcPaths
  initOptions.workspacePath = arcPaths.workspacePath;
  initOptions.settingsFile = arcPaths.settingsFile;
  initOptions.themesPath = arcPaths.themesBasePath;
  initOptions.componentsPath = arcPaths.componentsPath;

  const currentConfig = getConfig(arcPaths.settingsFile);
  const colorProfile = currentConfig.colorProfile;
  if (colorProfile && colorProfile !== 'default') {
    app.commandLine.appendSwitch('force-color-profile', colorProfile);
  }

  // This prevents Win10 from showing dupe items in the taskbar
  app.setAppUserModelId('com.squirrel.arc.' + process.arch);

  function addUrlToOpen(event, url) {
    event.preventDefault();
    log.debug('Received URL to open: ' + url);
    const fileData = url.substr(11);
    const parts = fileData.split('/');
    switch (parts[0]) {
      case 'drive':
        // arc-file://drive/open/file-id
        // arc-file://drive/create/file-id
        initOptions.open.push('/request/drive/' + parts[1] + '/' + parts[2]);
      break;
    }
  }
  const protocolResult = app.setAsDefaultProtocolClient('arc-file');
  if (protocolResult) {
    log.debug('Registered arc-file protocol');
  } else {
    log.warn('Unable to register arc-file protocol');
  }
  app.on('open-url', addUrlToOpen);
  app.once('ready', function() {
    global.appReadyTime = Date.now();
    log.debug('Electron ready time: ' + (global.appReadyTime - global.shellStartTime) + 'ms');
    app.removeListener('open-url', addUrlToOpen);
    const defaults = new AppDefaults();
    defaults.prepareEnvironment()
    .then(() => {
      global.arc = new ArcEnvironment(initOptions, initOptions.open);
      global.arc.registerHandlers();
      return global.arc.loadEnvironment();
    })
    .then(() => {
      global.appLoadingTime = Date.now();
      log.debug('App init time: ' + (global.appLoadingTime - global.appReadyTime));
      global.arc.open(initOptions.openProtocolFile);
    });
  });

  app.on('window-all-closed', () => {
    if (!global.arc) {
      return;
    }
    global.arc.allClosedHandler();
  });

  app.on('activate', () => {
    if (!global.arc) {
      return;
    }
    global.arc.activateHandler();
  });

  // Unit testing
  if (process.env.NODE_ENV === 'test' || initOptions.test) {
    app.testsInterface = function(action, ...args) {
      switch (action) {
        case 'get-application-settings-file-location':
          return global.arc.wm.startupOptions.settingsFile;
        case 'get-application-workspace-state-file-location':
          return global.arc.wm.startupOptions.workspacePath;
        case 'get-preferences-settings-location':
          return global.arc.prefs.settingsFile;
        case 'get-global-app':
          return global.arc;
      }
    };
  }
};
