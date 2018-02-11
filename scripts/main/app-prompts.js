const {dialog, ipcMain} = require('electron');

class AppPrompts {
  listen() {
    ipcMain.on('save-dialog', this._saveDialogHandler.bind(this));
  }

  _saveDialogHandler(event, args) {
    args = args || {};
    const options = {
      title: 'Save to file'
    };
    if (args.file) {
      options.defaultPath = args.file;
    }
    dialog.showSaveDialog(options, function(filename) {
      event.sender.send('saved-file', filename);
    });
  }
}
exports.AppPrompts = AppPrompts;
