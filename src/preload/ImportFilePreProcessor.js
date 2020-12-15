import path from 'path';
import fs from 'fs-extra';

export const isApiFile = Symbol('isApiFile');

/**
 * Simple class to read file picked by the user and that helps to decide whether the file
 * is an API file to process with the AMF factory or is it ARC import file.
 * 
 * @todo This has no sense to handle all imports through a single import file.
 * THese should be specialized paths to import API data and to import ARC data.
 */
export class ImportFilePreProcessor {
  /**
   * @param {string} filePath The path to the imported file
   */
  constructor(filePath) {
    this.filePath = filePath;

    /** 
     * @type {Buffer}
     */
    this.buffer = undefined;
  }

  async prepare() {
    const { filePath } = this;
    if (!filePath) {
      throw new Error('The file path is not set');
    }
    const exists = await fs.pathExists(filePath);
    if (!exists) {
      throw new Error('The file path does not exists');
    }
    try {
      await fs.access(filePath, fs.constants.R_OK);
    } catch (e) {
      throw new Error('Unable to read import file. The current user has no permissions to the file.');
    }
    this.buffer = await fs.readFile(filePath);
  }

  /**
   * Tests whether the buffer should be sent to the API processor instead of import processor.
   * 
   * Note, the contents may be still an API as OAS (swagger) support JSON format. This is not here tested
   * because the file content can be encrypted with password.
   * 
   * @returns {Promise<boolean>}
   */
  async isApiFile() {
    const { filePath } = this;
    if (!filePath) {
      throw new Error('The file path is not set');
    }
    const ext = path.extname(filePath);
    if (this[isApiFile](ext)) {
      return true;
    }
    return false;
  }

  /**
   * Call `isApiFile()` first to test whether the file is the zip file.
   * 
   * @return {string} The contents as string.
   */
  readContents() {
    const { buffer } = this;
    if (!buffer) {
      throw new Error('Call the prepare function first.');
    }
    const content = buffer.toString().trim();
    return content;
  }

  /**
   * @param {string} ext
   * @returns {boolean}
   */
  [isApiFile](ext) {
    const apiTypes = ['.zip', '.yaml', '.raml'];
    return apiTypes.includes(ext);
  }
}
