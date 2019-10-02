const { dialog } = require('electron');
const log = require('./logger');

class AssetImport {
  /**
   * Opens a dialog to open a file and notifies the window about new content.
   *
   * @param {BrowserWindow} bWindow
   */
  static openAssetDialog(bWindow) {
    log.debug('Opening file import dialog.');
    dialog.showOpenDialog(bWindow, {
      title: 'Select file to import',
      buttonLabel: 'Import',
      properties: ['openFile'],
      filters: [
        { name: 'All supported files', extensions: ['arc', 'json', 'raml', 'yaml', 'zip'] }
      ]
    }, (filePaths) => {
      if (!filePaths || !filePaths[0]) {
        log.debug('Import dialog was canceled.');
        return;
      }
      log.debug('Sending file path to open in UI thread: ' + filePaths[0]);
      bWindow.webContents.send('command', 'process-external-file', filePaths[0]);
    });
  }

  static openWorkspaceFile(bWindow) {
    log.debug('Opening workspace import dialog.');
    return new Promise((resolve) => {
      dialog.showOpenDialog(bWindow, {
        title: 'Select workspace file to open',
        buttonLabel: 'Open',
        properties: ['openFile'],
        filters: [
          { name: 'All supported files', extensions: ['arc', 'json'] }
        ]
      }, (filePaths) => {
        const loc = filePaths && filePaths[0];
        resolve(loc);
      });
    });
  }
}
module.exports.AssetImport = AssetImport;
