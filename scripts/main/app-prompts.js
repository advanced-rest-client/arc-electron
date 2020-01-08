const { dialog, ipcMain } = require('electron');
const log = require('./logger');
/**
 * Class responsible for displaying system dialogs and
 * to sends back resutls to the sender.
 */
class AppPrompts {
  /**
   * Listens for the application events.
   */
  listen() {
    ipcMain.handle('save-dialog', this._saveDialogHandler.bind(this));
  }
  /**
   * Hasnles save action dialog. Opens "save as..." dialog and returns
   * the result to the app.
   *
   * @param {Event} e Event emitted by the BrowserWindow
   * @param {Object} args Prompt dialog options:
   * - file {String} - File name to suggest to the user.
   * @return {Promise}
   */
  _saveDialogHandler(e, args={}) {
    log.debug('Save dialog requested', args);
    const options = {
      title: 'Save to file'
    };
    if (args.file) {
      options.defaultPath = args.file;
    }
    return dialog.showSaveDialog(options);
  }
  /**
   * A dialog that renders error message about missing workspace file.
   * @param {String} file Requested workspace file location.
   * @return {Promise}
   */
  static async workspaceMissing(file) {
    let message = 'Workspace file cannot be located. Probably it was deleted or';
    message += ' renamed.\n\n';
    message += 'Requested file: ' + file;
    return await dialog.showMessageBox({
      type: 'error',
      message
    });
  }
}
exports.AppPrompts = AppPrompts;
