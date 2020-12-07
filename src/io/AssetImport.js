import { dialog } from 'electron';
import { logger } from './Logger.js';

export class AssetImport {
  /**
   * Opens a dialog to open a file and notifies the window about new content.
   *
   * @param {Electron.BrowserWindow} bWindow
   * @returns {Promise<void>}
   */
  static async openAssetDialog(bWindow) {
    logger.debug('Opening file import dialog.');
    const result = await dialog.showOpenDialog(bWindow, {
      title: 'Select file to import',
      buttonLabel: 'Import',
      properties: ['openFile'],
      filters: [
        { name: 'All supported files', extensions: ['arc', 'json', 'raml', 'yaml', 'zip'] }
      ]
    });
    const { filePaths, canceled } = result;
    if (canceled) {
      logger.debug('Import dialog was canceled.');
      return;
    }
    logger.debug(`Sending file path to open in UI thread: ${filePaths[0]}`);
    bWindow.webContents.send('command', 'process-external-file', filePaths[0]);
  }

  /**
   * @param {Electron.BrowserWindow} bWindow
   * @returns {Promise<string|undefined>}
   */
  static async openWorkspaceFile(bWindow) {
    logger.debug('Opening workspace import dialog.');
    const result = await dialog.showOpenDialog(bWindow, {
      title: 'Select workspace file to open',
      buttonLabel: 'Open',
      properties: ['openFile'],
      filters: [
        { name: 'All supported files', extensions: ['arc', 'json'] }
      ]
    });
    const { filePaths, canceled } = result;
    if (canceled) {
      logger.debug('Import dialog was canceled.');
      return undefined;
    }
    return filePaths[0];
  }
}
