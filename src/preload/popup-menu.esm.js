import { ipcRenderer } from 'electron';
import logger from 'electron-log';
import { PreferencesProxy } from './PreferencesProxy.js';
import { ThemeManager } from './ThemeManager.js';

process.once('loaded', () => {
  // @ts-ignore
  global.PreferencesProxy = PreferencesProxy;
  global.logger = logger;
  // @ts-ignore
  global.ThemeManager = ThemeManager;
  global.ipc = ipcRenderer;
});
