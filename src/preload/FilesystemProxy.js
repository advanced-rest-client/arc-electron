import path from 'path';
import fs from 'fs-extra';
import log from 'electron-log';
import { ipcRenderer } from 'electron';
import { DataExportEventTypes } from '@advanced-rest-client/arc-events';

/** @typedef {import('@advanced-rest-client/arc-events').ArcExportFilesystemEvent} ArcExportFilesystemEvent */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ProviderOptions} ProviderOptions */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ArcExportResult} ArcExportResult */

export const exportHandler = Symbol('exportHandler');
export const writeContent = Symbol('writeContent');
export const prepareData = Symbol('prepareData');

/**
 * This class is a proxy to access user filesystem from the renderer process.
 *
 * Node integration is disabled inside the application and scripts do not have
 * access to the `fs` module. This class is loaded in the preload script and
 * uses events API to store data in file.
 *
 * Also, data are not send to the IO thread as saving file is a blocking
 * operation which could froze all application windows. If anything happens
 * during IO operation it us better to crash single window.
 */
export class FilesystemProxy {
  constructor() {
    this[exportHandler] = this[exportHandler].bind(this);
  }

  listen() {
    window.addEventListener(DataExportEventTypes.fileSave, this[exportHandler]);
  }

  unlisten() {
    window.removeEventListener(DataExportEventTypes.fileSave, this[exportHandler]);
  }

  /**
   * @param {ArcExportFilesystemEvent} e
   */
  [exportHandler](e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    const { data, providerOptions } = e;
    e.detail.result = this.exportFileData(data, providerOptions);
  }

  /**
   * Requests a save file dialog and saves the data to selected path if not cancelled.
   * This does nothing when dialog is canceled.
   *
   * @param {string|Buffer} content Data to write
   * @param {ProviderOptions} options Export provider options
   * @return {Promise<ArcExportResult>}
   */
  async exportFileData(content, options) {
    const opts = {
      file: options.file,
    };
    let dialogResult;
    try {
      dialogResult = await ipcRenderer.invoke('save-dialog', opts);
    } catch (e) {
      log.error(e);
      return /** @type ArcExportResult */ ({
        interrupted: false,
        success: false,
      });
    }
    const { filePath, canceled } = dialogResult;
    const result = /** @type ArcExportResult */ ({
      interrupted: !!canceled,
      success: !canceled,
    });
    if (canceled) {
      return result;
    }
    result.fileId = path.basename(filePath);
    result.parentId = path.dirname(filePath);
    try {
      await this[writeContent](filePath, content, options.contentType);
    } catch (e) {
      result.success = false;
      log.error(e);
    }
    return result;
  }

  /**
   * Writes content to a file
   * @param {string} filePath Absolute path to a file
   * @param {string|Buffer|any} content Data to be written
   * @param {string=} mime Content media type.
   * @return {Promise<void>}
   */
  [writeContent](filePath, content, mime) {
    let data = content;
    if (typeof content !== 'string') {
      data = this[prepareData](content, mime);
    }
    return fs.writeFile(filePath, data, 'utf8');
  }

  /**
   * @param {any} data
   * @param {string} mime
   * @return {string} 
   */
  [prepareData](data, mime) {
    switch (mime) {
      case 'application/json': return JSON.stringify(data);
      default: return String(data);
    }
  }

  /**
   * Triggers the open file dialog pre-configured to pick supported by ARC files.
   * 
   * @returns {Promise<Electron.OpenDialogReturnValue>}
   */
  async pickFile() {
    return ipcRenderer.invoke('open-dialog');
  }

  // /**
  //  * Allows to read file from user filesystem.
  //  * @param {string} filePath File path to ready
  //  * @return {Promise<Buffer>}
  //  */
  // readFile(filePath) {
  //   return fs.readFile(filePath);
  // }

  // extname(filePath) {
  //   return path.extname(filePath);
  // }
}
