const { ipcRenderer: ipc } = require('electron');
const fs = require('fs-extra');
const path = require('path');
/**
 * This class is a proxy to access user filesystem from the renderer process.
 *
 * Node integration is disabled inside the application and scripts do not have
 * acces to `fs` module. This class is loaded in the preload script and
 * uses events API to store data in file.
 *
 * Also, data are not send to the IO thread as saving file is a blocking
 * operation which could froze all application windows. If anything happens
 * during IO operation it us better to crash single window.
 */
class FilesystemProxy {
  constructor() {
    this._exportHandler = this._exportHandler.bind(this);
  }

  listen() {
    window.addEventListener('file-data-save', this._exportHandler);
  }

  unlisten() {
    window.removeEventListener('file-data-save', this._exportHandler);
  }

  _exportHandler(e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    const { content, file, options={} } = e.detail;
    e.detail.result = this.exportFileData(content, options.contentType, file);
  }
  /**
   * Requests a save file dialog and saves the data to selected path if not cancelled.
   * This does nothing when dialog is canceled.
   *
   * @param {String|Object|Buffer} content Data to write
   * @param {String=} mime Content media type. Currently only `application/json` is
   * supported when the `content` is an object or an array.
   * @param {String=} file Suggested file name
   * @return {Promise}
   */
  async exportFileData(content, mime, file) {
    const opts = {
      file
    };
    const result = await ipc.invoke('save-dialog', opts)
    const { filePath, canceled } = result;
    if (canceled) {
      return;
    }
    await this._writeContent(filePath, content, mime);
  }
  /**
   * Writes content to a file
   * @param {String} path Absolute path to a file
   * @param {String|Object|Buffer} content Data to be written
   * @param {String=} mime Content media type.
   * @return {Promise}
   */
  _writeContent(path, content, mime) {
    if (typeof content !== 'string') {
      content = this._prepareData(content, mime);
    }
    return fs.writeFile(path, content, 'utf8');
  }

  _prepareData(data, mime) {
    switch (mime) {
      case 'application/json': return JSON.stringify(data);
      default: return String(data);
    }
  }
  /**
   * Allows to read file from user filesystem.
   * @param {String} path File path to ready
   * @return {Promise<Buffer>}
   */
  readFile(path) {
    return fs.readFile(path);
  }

  extname(filePath) {
    return path.extname(filePath);
  }
}

module.exports.FilesystemProxy = FilesystemProxy;
