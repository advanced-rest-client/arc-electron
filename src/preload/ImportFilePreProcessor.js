import path from 'path';
import fs from 'fs-extra';
import { RestApiEvents, ImportEvents } from '@advanced-rest-client/arc-events';

export const notifyApiParser = Symbol('notifyApiParser');
export const isApiFile = Symbol('isApiFile');
export const discoverFile = Symbol('discoverFile');

export class ImportFilePreProcessor {
  /**
   * Recognizes file type and sends to appropriate parser.
   * @param {String} filePath Location of the file.
   * @returns {Promise<void>}
   */
  async processFile(filePath) {
    if (!filePath) {
      throw new Error('Argument not set');
    }
    const buffer = await fs.readFile(filePath);
    const ext = path.extname(filePath);
    if (this[isApiFile](ext)) {
      await this[notifyApiParser](buffer);
      return;
    }
    // Only JSON files left. It can be either ARC, Postman or OAS
    await this[discoverFile](buffer);
  }

  /**
   * Dispatches `api-process-file` to parse API data with a separate module.
   * In ARC electron it is `@advanced-rest-client/electron-amf-service`
   * node module. In other it might be other component.
   * @param {Buffer} file User file.
   * @return {Promise<void>}
   */
  async [notifyApiParser](file) {
    // @ts-ignore
    const result = await RestApiEvents.processFile(document.body, file);
    if (!result) {
      throw new Error('API processor not available');
    }
    RestApiEvents.dataReady(document.body, result.model, result.type);
  }

  /**
   * @param {string} ext
   * @returns {boolean}
   */
  [isApiFile](ext) {
    const apiTypes = ['.zip', '.yaml', '.raml'];
    return apiTypes.includes(ext);
  }

  /**
   * @param {Buffer} buffer
   * @returns {Promise<void>}
   */
  async [discoverFile](buffer) {
    const content = buffer.toString().trim();
    if (content[0] !== '{') {
      throw new Error('Unsupported file.');
    }
    let data;
    try {
      data = JSON.parse(content);
    } catch (_) {
      throw new Error('Unknown file format.');
    }
    if (data.swagger) {
      await this[notifyApiParser](buffer);
      return;
    }

    await ImportEvents.processData(document.body, data);
  }
}
