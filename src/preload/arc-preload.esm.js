import { SocketRequest, ElectronRequest } from '@advanced-rest-client/electron/renderer.js';
import { ArcEnvironment } from './ArcEnvironment.js';

const env = {};
const APP_VERSION = process.env.ARC_VERSION;
const PLATFORM = process.platform;
Object.keys(process.env).forEach((key) => {
  if (key.indexOf('npm_') === 0 || key.indexOf('ARC_') === 0) {
    return;
  }
  env[key] = process.env[key];
});

const { versions } = process;
const nodeBuffer = Buffer;

const origRequire = require;

process.once('loaded', () => {
  global.ArcEnvironment = ArcEnvironment;
  global.SocketRequest = SocketRequest;
  global.ElectronRequest = ElectronRequest;

  global.process = {
    // @ts-ignore
    env,
    platform: PLATFORM,
  };

  // @ts-ignore
  global.versionInfo = {
    // @ts-ignore
    chrome: versions.chrome,
    appVersion: APP_VERSION,
  };

  // this is important for the response view which uses Buffer class when the response has been recorded by Electron app.
  global.Buffer = nodeBuffer;

  if (process.env.NODE_ENV === 'test') {
    // @ts-ignore
    window.electronRequire = origRequire
  }
});
