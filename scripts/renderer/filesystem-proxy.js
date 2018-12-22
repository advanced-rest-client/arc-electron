const {ipcRenderer: ipc} = require('electron');
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
    this._fileSavedHandler = this._fileSavedHandler.bind(this);
  }

  listen() {
    window.addEventListener('file-data-save', this._exportHandler);
    ipc.on('saved-file', this._fileSavedHandler);
  }

  unlisten() {
    window.removeEventListener('file-data-save', this._exportHandler);
    ipc.removeListener('saved-file', this._fileSavedHandler);
  }

  _clear() {
    this.lastType = undefined;
    this.lastContent = undefined;
    this.lastResolve = undefined;
    this.lastReject = undefined;
  }

  _exportHandler(e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    ipc.send('save-dialog', {
      file: e.detail.file
    });
    this.lastContent = e.detail.content;
    this.lastType = e.detail.contentType;
    e.detail.result = new Promise((resolve, reject) => {
      this.lastResolve = resolve;
      this.lastReject = reject;
    });
  }

  _fileSavedHandler(e, selectedPath) {
    if (!selectedPath) {
      this.lastResolve();
      this._clear();
      return;
    }
    return this._writeContent(selectedPath)
    .then(() => this.lastResolve())
    .catch((cause) => this.lastReject(cause))
    .then(() => this._clear());
  }

  _writeContent(path) {
    let data = this.lastContent;
    if (typeof data !== 'string') {
      data = this._prepareData(data);
    }
    return fs.writeFile(path, data, 'utf8');
  }

  _prepareData(data) {
    switch (this.lastType) {
      case 'application/json': return JSON.stringify(data);
    }
    return data;
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
