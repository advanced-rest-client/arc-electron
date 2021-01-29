/* eslint-disable no-param-reassign */
import fs from 'fs-extra';
import path from 'path';
import { ipcMain, app, shell } from 'electron';

/** @typedef {import('./WindowsManager').WindowsManager} WindowsManager */

/**
 * Users privacy is a great concern for this project. Therefore this class
 * runs before the any ARC window is created to ask whether the user consent to 
 * send limited and anonymous data to Google Analytics.
 * 
 * This checks whether the lock file is created in the application folder. If so the 
 * consent flow is canceled. 
 * It renders the UI to ask the user about the analytics data. The user choice is
 * reflected in the application configuration.
 */
export class TelemetryConsent {
  /**
   * @param {WindowsManager} wm
   */
  constructor(wm) {
    this.wm = wm;
    this.lockFile = path.join(process.env.ARC_HOME, '.telemetry-consent.lock');
  }

  /**
   * Runs the analytics data consent flow.
   * @returns {Promise<void>} 
   */
  async run() {
    const lockExists = await fs.pathExists(this.lockFile);
    if (lockExists) {
      return undefined;
    }
    await this.renderDialog();
    ipcMain.on('telemetry-set', this.pageHandler.bind(this));
    return new Promise((resolve) => {
      this.resolve = resolve;
    });
  }

  async renderDialog() {
    const win = await this.wm.open({
      ignoreWindowSessionSettings: true,
      noMenu: true,
      page: 'analytics-consent.html',
      preload: 'arc-preload.js',
      sizing: {
        width: 1024,
        height: 800,
      }
    });
    this.loader = win;
    win.setMenu(null);
    win.webContents.on('new-window', (event, url) => {
      event.preventDefault();
      shell.openExternal(url);
    });
  }

  async pageHandler() {
    await fs.ensureFile(this.lockFile);
    app.relaunch();
    app.quit();
  }
}
