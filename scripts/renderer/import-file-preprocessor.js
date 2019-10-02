const fs = require('fs-extra');
const path = require('path');
class ImportFilePrePprocessor {
  /**
   * Recognizes file type and sends to appropriate parser.
   * @param {String} filePath Location of the file.
   * @return {Promise}
   */
  async processFile(filePath) {
    if (!filePath) {
      throw new Error('Argument not set');
    }
    const buffer = await fs.readFile(filePath);
    const ext = path.extname(filePath);
    if (this._isApiFile(ext)) {
      return await this._notifyApiParser(buffer);
    }
    // Only JSON files left. It can be either ARC, Postam or OAS
    return await this._discoverFile(buffer);
  }

  _isApiFile(ext) {
    const apiTypes = [
      '.zip', '.yaml', '.raml'
    ];
    return apiTypes.indexOf(ext) !== -1;
  }

  _dispatch(type, detail) {
    const e = new CustomEvent(type, {
      bubbles: true,
      cancelable: true,
      detail
    });
    document.body.dispatchEvent(e);
    return e;
  }

  /**
   * Dispatches `api-process-file` to parse API data usingseparate module.
   * In ARC electron it is `@advanced-rest-client/electron-amf-service`
   * node module. In other it might be other component.
   * @param {File} file User file.
   * @return {Promise}
   */
  async _notifyApiParser(file) {
    const e = this._dispatch('api-process-file', {
      file
    });
    if (!e.defaultPrevented) {
      throw new Error('API processor not available');
    }
    const api = await e.detail.result;
    this._dispatch('api-data-ready', {
      model: api.model,
      type: api.type
    });
  }

  async _discoverFile(buffer) {
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
      return await this._notifyApiParser(buffer);
    }

    const e = this._dispatch('import-process-data', {
      data
    });
    return await e.detail.result;
  }
}
module.exports.ImportFilePrePprocessor = ImportFilePrePprocessor;
