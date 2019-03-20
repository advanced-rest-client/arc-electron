const fs = require('fs-extra');
const path = require('path');
class ImportFilePrePprocessor {
  /**
   * Recognizes file type and sends to appropriate parser.
   * @param {String} filePath Location of the file.
   * @return {Promise}
   */
  processFile(filePath) {
    if (!filePath) {
      throw new Error('Argument not set');
    }
    return fs.readFile(filePath)
    .then((buffer) => {
      const ext = path.extname(filePath);
      if (this._isApiFile(ext)) {
        return this._notifyApiParser(buffer);
      }
      // Only JSON files left. It can be either ARC, Postam or OAS
      return this._discoverFile(buffer);
    });
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
  _notifyApiParser(file) {
    const e = this._dispatch('api-process-file', {
      file
    });
    if (!e.defaultPrevented) {
      return Promise.reject(new Error('API processor not available'));
    }
    return e.detail.result
    .then((api) => {
      this._dispatch('api-data-ready', {
        model: api.model,
        type: api.type
      });
    });
  }

  _discoverFile(buffer) {
    const content = buffer.toString().trim();
    if (content[0] !== '{') {
      return Promise.reject(new Error('Unsupported file.'));
    }
    let data;
    try {
      data = JSON.parse(content);
    } catch (_) {
      return Promise.reject(new Error('Unknown file format.'));
    }
    if (data.swagger) {
      return this._notifyApiParser(buffer);
    }

    const e = this._dispatch('import-process-data', {
      data
    });
    return e.detail.result;
  }
}
module.exports.ImportFilePrePprocessor = ImportFilePrePprocessor;
