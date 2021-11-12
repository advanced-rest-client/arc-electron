import { DataExportBindings } from '../../../web_modules/index.js';

/** @typedef {import('@advanced-rest-client/events').DataExport.ProviderOptions} ProviderOptions */
/** @typedef {import('@advanced-rest-client/events').DataExport.ArcExportResult} ArcExportResult */

export class DataExportBindingsElectron extends DataExportBindings {
  /**
   * Requests a save file dialog and saves the data to selected path if not cancelled.
   * This does nothing when dialog is canceled.
   *
   * @param {string|Buffer} contents Data to write
   * @param {ProviderOptions} options Export provider options
   * @return {Promise<ArcExportResult>}
   */
  // @ts-ignore
  async exportFileData(contents, options) {
    const opts = {
      file: options.file,
    };
    let dialogResult;
    try {
      dialogResult = await ArcEnvironment.ipc.invoke('save-dialog', opts);
    } catch (e) {
      ArcEnvironment.logger.error(e);
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
    result.fileId = ArcEnvironment.path.basename(filePath);
    result.parentId = ArcEnvironment.path.dirname(filePath);
    try {
      await this.writeContent(filePath, contents, options.contentType);
    } catch (e) {
      result.success = false;
      ArcEnvironment.logger.error(e);
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
  writeContent(filePath, content, mime) {
    let data = content;
    if (typeof content !== 'string' && mime === 'application/json') {
      data = this.prepareData(content, mime);
    }
    if (typeof data === 'string') {
      return ArcEnvironment.fs.writeFile(filePath, data, 'utf8');
    }
    return ArcEnvironment.fs.writeFile(filePath, data);
  }
}
