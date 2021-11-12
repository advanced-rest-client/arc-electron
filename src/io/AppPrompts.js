import { dialog, ipcMain, BrowserWindow } from 'electron';
import { logger } from './Logger.js';

const saveDialogHandler = Symbol('saveDialogHandler');
const openDialogHandler = Symbol('openDialogHandler');

/**
 * Class responsible for displaying system dialogs and
 * to sends back results to the sender.
 */
export class AppPrompts {
  /**
   * Listens for the application events.
   */
  listen() {
    ipcMain.handle('save-dialog', this[saveDialogHandler].bind(this));
    ipcMain.handle('open-dialog', this[openDialogHandler].bind(this));
  }

  /**
   * Handles save action dialog. Opens "save as..." dialog and returns the result to the app.
   *
   * @param {Event} e Event emitted by the BrowserWindow
   * @param {Object} args Prompt dialog options:
   * - file {String} - File name to suggest to the user.
   * @return {Promise}
   */
  [saveDialogHandler](e, args={}) {
    logger.debug('Save dialog requested', args);
    const options = {
      title: 'Save to file'
    };
    if (args.file) {
      options.defaultPath = args.file;
    }
    return dialog.showSaveDialog(options);
  }

  /**
   * Handles open file action. Opens file picker dialog and returns the result to the app.
   *
   * @param {Electron.IpcMainInvokeEvent} e
   * @param {'arc'|'postman'|'api'} type The type of the import dialog to open.
   * @returns {Promise<Electron.OpenDialogReturnValue>}
   */
  async [openDialogHandler](e, type) {
    logger.debug(`Opening ${type} open dialog.`);
    switch (type) {
      case 'arc': return this.openArcFileDialog(e);
      case 'postman': return this.openPostmanFileDialog(e);
      case 'api': return this.openApiFileDialog(e);
      default: throw new Error(`Unknown dialog type ${type}`);
    }
  }

  /**
   * Handles open file action. Opens file picker dialog and returns the result to the app.
   *
   * @param {Electron.IpcMainInvokeEvent} e
   * @returns {Promise<Electron.OpenDialogReturnValue>}
   */
  async openArcFileDialog(e) {
    const win = BrowserWindow.fromWebContents(e.sender);
    logger.debug('Opening ARC file open dialog.');
    return dialog.showOpenDialog(win, {
      title: 'Select an ARC file',
      buttonLabel: 'Open',
      properties: ['openFile'],
      filters: [
        { name: 'ARC files', extensions: ['arc', 'json'] }
      ]
    });
  }

  /**
   * Handles open file action. Opens file picker dialog and returns the result to the app.
   *
   * @param {Electron.IpcMainInvokeEvent} e
   * @returns {Promise<Electron.OpenDialogReturnValue>}
   */
  async openPostmanFileDialog(e) {
    const win = BrowserWindow.fromWebContents(e.sender);
    logger.debug('Opening Postman file open dialog.');
    return dialog.showOpenDialog(win, {
      title: 'Select a Postman file',
      buttonLabel: 'Open',
      properties: ['openFile'],
      filters: [
        { name: 'Postman files', extensions: ['json', 'postman', 'postman_dump'] }
      ]
    });
  }

  /**
   * Handles open file action. Opens file picker dialog and returns the result to the app.
   *
   * @param {Electron.IpcMainInvokeEvent} e
   * @returns {Promise<Electron.OpenDialogReturnValue>}
   */
  async openApiFileDialog(e) {
    const win = BrowserWindow.fromWebContents(e.sender);
    logger.debug('Opening Postman file open dialog.');
    return dialog.showOpenDialog(win, {
      title: 'Select an API project files (zip)',
      message: 'The project has to be contained in a zip file.',
      buttonLabel: 'Open',
      properties: ['openFile'],
      filters: [
        { name: 'API project files', extensions: ['zip'] }
      ]
    });
  }

  /**
   * A dialog that renders error message about missing workspace file.
   * @param {String} file Requested workspace file location.
   * @return {Promise}
   */
  static async workspaceMissing(file) {
    let message = 'Workspace file cannot be located. Probably it was deleted or';
    message += ' renamed.\n\n';
    message += `Requested file: ${file}`;
    return dialog.showMessageBox({
      type: 'error',
      message
    });
  }

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
