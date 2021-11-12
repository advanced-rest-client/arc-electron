import { app, protocol } from 'electron';
import { logger, setLevel } from './Logger.js';
import { ApplicationPaths } from './ApplicationPaths.js';
import { ApplicationOptions } from './ApplicationOptions.js';
import { ArcEnvironment } from './ArcEnvironment.js';
import { PreferencesManager } from './PreferencesManager.js';
import { ApplicationDefaults } from './ApplicationDefaults.js';
import { TelemetryConsent } from './TelemetryConsent.js';

// app.allowRendererProcessReuse = true;
let initOptions;

/** @typedef {import('../types').ApplicationOptionsConfig} ApplicationOptionsConfig */

function addUrlToOpen(event, url) {
  event.preventDefault();
  logger.debug(`Received URL to open: ${url}`);
  const fileData = url.substr(11);
  const parts = fileData.split('/');
  switch (parts[0]) {
    case 'drive':
      // arc-file://drive/open/file-id
      // arc-file://drive/create/file-id
      initOptions.open.push(`/request/drive/${parts[1]}/${parts[2]}`);
    break;
    default:
  }
}

/**
 * Runs the environment
 * @param {PreferencesManager} prefManager
 * @param {ApplicationOptionsConfig} init
 */
async function readyHandler(prefManager, init) {
  // @ts-ignore
  global.appReadyTime = Date.now();
  // @ts-ignore
  logger.debug(`Electron ready time: ${global.appReadyTime - global.shellStartTime}ms`);
  app.removeListener('open-url', addUrlToOpen);
  
  const defaults = new ApplicationDefaults();
  await defaults.prepareEnvironment();
  const env = new ArcEnvironment(prefManager, init);
  /**  
   * @type {ArcEnvironment}
   */
  // @ts-ignore
  global.Arc = env;
  env.registerHandlers();

  if (!init.skipDatabaseUpgrade) {
    // this has to be done after the protocols are registered.
    await defaults.prepareDatabaseUpgrade(env.wm);
  }

  if (!init.skipCookieConsent) {
    // telemetry consent screen
    const telemetry = new TelemetryConsent(env.wm);
    await telemetry.run();
  }

  await env.loadEnvironment();
  // @ts-ignore
  global.appLoadingTime = Date.now();
  // @ts-ignore
  logger.debug(`App init time: ${global.appLoadingTime - global.appReadyTime}ms`);
  env.open(init.openProtocolFile || init.open);
}

/**
 * Runs the IO thread of the application.
 * @param {number} startTime The timestamp when the application first started
 */
export default async function start(startTime) {
  // @ts-ignore
  global.shellStartTime = startTime;
  app.commandLine.appendSwitch('enable-experimental-web-platform-features');
  app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');

  // Sets the application version in a global variable so the renderer process 
  // has this information without querying for it.
  process.env.ARC_VERSION = app.getVersion();

  process.on('uncaughtException', (error) => {
    if (error.message) {
      logger.error(error.message);
    }
    if (error.stack) {
      logger.error(error.stack);
    }
  });

  process.on('unhandledRejection', 
  /** 
   * @param {Error} error
   */
  (error) => {
    if (error.message) {
      logger.error(error.message);
    }

    if (error.stack) {
      logger.error(error.stack);
    }
  });

  const startupOptions = new ApplicationOptions();
  startupOptions.parse();
  initOptions = startupOptions.getOptions();
  if (initOptions.dev) {
    setLevel(initOptions.debugLevel || 'silly');
    // logger.level = initOptions.debugLevel || 'warn';
  } else if (initOptions.debugLevel) {
    // logger.level = initOptions.debugLevel;
    setLevel(initOptions.debugLevel);
  } else {
    // logger.level = 'error';
    setLevel('error');
  }
  
  if (initOptions.userDataDir) {
    app.setPath('userData', initOptions.userDataDir);
  }

  // Standard scheme must be registered before the app is ready
  protocol.registerSchemesAsPrivileged([
    { scheme: 'web-module', privileges: { standard: true, secure: true } },
    { scheme: 'themes', privileges: { standard: true, secure: true } }
  ]);

  logger.debug('Setting up the environment');
  const appPaths = new ApplicationPaths();
  appPaths.setHome();
  appPaths.setSettingsFile(initOptions.settingsFile);
  appPaths.setThemesPath(initOptions.themesPath);
  appPaths.setWorkspacePath(initOptions.workspacePath);
  appPaths.setStateFile(initOptions.stateFile);

  // Overrides initial user path to processed by ApplicationPaths
  initOptions.settingsFile = appPaths.settingsFile;
  initOptions.themesPath = appPaths.themesBasePath;
  
  // This prevents Win10 from showing dupe items in the taskbar
  app.setAppUserModelId(`com.squirrel.mulesoft.arc.${process.arch}`);

  const protocolResult = app.setAsDefaultProtocolClient('arc-file');
  if (protocolResult) {
    logger.debug('Registered "arc-file" protocol');
  } else {
    logger.warn('Unable to register "arc-file" protocol');
  }

  app.on('open-url', addUrlToOpen);
  await app.whenReady();

  const prefManager = new PreferencesManager(appPaths.settingsFile);
  readyHandler(prefManager, initOptions);
}
