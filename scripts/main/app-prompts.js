const {dialog, ipcMain} = require('electron');
/**
 * Class responsible for displaying system dialogs and
 * to sends back resutls to the sender.
 */
class AppPrompts {
  /**
   * Listens for the application events.
   */
  listen() {
    ipcMain.on('save-dialog', this._saveDialogHandler.bind(this));
  }
  /**
   * Hasnles save action dialog. Opens "save as..." dialog and returns
   * the result to the app.
   *
   * This method emmits `saved-file` event to the sender window with
   * file location as it's only argument. The argument is `undefined`
   * when the user cancels the action.
   *
   * @param {Event} e Event emitted by the BrowserWindow
   * @param {Object} args Prompt dialog options:
   * - file {String} - File name to suggest to the user.
   */
  _saveDialogHandler(e, args) {
    args = args || {};
    const options = {
      title: 'Save to file'
    };
    if (args.file) {
      options.defaultPath = args.file;
    }
    dialog.showSaveDialog(options, function(filename) {
      e.sender.send('saved-file', filename);
    });
  }
}
exports.AppPrompts = AppPrompts;
