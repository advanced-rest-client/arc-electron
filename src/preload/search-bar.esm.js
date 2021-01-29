import { ipcRenderer } from 'electron';
import { ThemeManager } from './ThemeManager.js';

process.once('loaded', () => {
  global.ipc = ipcRenderer;
  // @ts-ignore
  global.ThemeManager = ThemeManager;
});
