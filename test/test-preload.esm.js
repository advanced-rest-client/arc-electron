import { ArcEnvironment } from '../src/preload/ArcEnvironment.js';

process.once('loaded', () => {
  global.ArcEnvironment = ArcEnvironment;
});
