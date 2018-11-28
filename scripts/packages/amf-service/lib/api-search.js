const fs = require('fs-extra');
const path = require('path');
/**
 * Searches for API main file in given location
 */
class ApiSearch {
  /**
   * @param {String} dir API directory location
   */
  constructor(dir) {
    this._workingDir = dir;
  }
  /**
   * Finds main API name.
   *
   * If one of the files is one of the popular names for the API spec files
   * then it always returns this file.
   *
   * If it finds single candidate it returns it as a main file.
   *
   * If it finds more than a single file it means that the user has to decide
   * which one is the main file.
   *
   * If it returns undefined than the process failed and API main file cannot
   * be determined.
   *
   * @return {Promise<Array<String>|String|undefined>}
   */
  findApiFile() {
    return fs.readdir(this._workingDir)
    .then((items) => {
      const popularNames = ['api.raml', 'api.yaml', 'api.json'];
      const exts = ['.raml', '.yaml', '.json'];
      const ignore = ['__macosx', 'exchange.json', '.ds_store'];
      const files = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const lower = items[i].toLowerCase();
        if (ignore.indexOf(lower) !== -1) {
          continue;
        }
        if (popularNames.indexOf(lower) !== -1) {
          return item;
        }
        const ext = path.extname(lower);
        if (exts.indexOf(ext) !== -1) {
          files.push(item);
        }
      }
      if (files.length === 1) {
        return files[0];
      }
      if (files.length) {
        return this._decideMainFile(files);
      }
      return;
    });
  }

  /**
   * Decides which file to use as API main file.
   * @param {Array<String>} files A file or list of files.
   * @return {Promise<String>}
   */
  _decideMainFile(files) {
    const root = this._workingDir;
    const fullPathFiles = files.map((item) => {
      return {
        absolute: path.join(root, item),
        relative: item
      };
    });
    return this._findWebApiFile(fullPathFiles)
    .then((list) => {
      if (!list) {
        return files;
      }
      return list;
    });
  }
  /**
   * Reads all files and looks for 'RAML 0.8' or 'RAML 1.0' header which
   * is a WebApi.
   * @param {Array<String>} files List of candidates
   * @param {?Array<Object>} results List od results
   * @return {Promise<String>}
   */
  _findWebApiFile(files, results) {
    if (!results) {
      results = [];
    }
    const f = files.shift();
    if (!f) {
      if (!results.length) {
        results = undefined;
      }
      if (results && results.length === 1) {
        results = results[0];
      }
      return Promise.resolve(results);
    }
    return this._readApiType(f.absolute)
    .catch((e) => {
      console.warn('Unable to find file type', e);
    })
    .then((type) => {
      if (type && type.type) {
        results[results.length] = f.relative;
      }
      return this._findWebApiFile(files, results);
    });
  }
  /**
   * Reads API type from the API main file.
   * @param {String} file File location
   * @return {Promise}
   */
  _readApiType(file) {
    const size = 100;
    return fs.open(file, 'r')
    .then((fd) => {
      return fs.read(fd, Buffer.alloc(size), 0, size, 0)
      .then((r) => {
        return fs.close(fd).then(() => r);
      });
    })
    .then((result) => {
      const data = result.buffer.toString().trim();
      if (data[0] === '{') {
        // OAS 1/2
        const match = data.match(/"swagger"(?:\s*)?:(?:\s*)"(.*)"/im);
        if (!match) {
          throw new Error('Expected OAS but could not find version header.');
        }
        const v = match[1].trim();
        return {
          type: `OAS ${v}`,
          contentType: 'application/json'
        };
      }
      const oasMatch = data.match(/openapi(?:\s*)?:(?:\s*)"?(\d\.\d*)"?/im);
      if (oasMatch) {
        const v = oasMatch[1].trim();
        return {
          type: `OAS ${v}`,
          contentType: 'application/yaml'
        };
      }
      const header = data.split('\n')[0].substr(2).trim();
      if (!header || header.indexOf('RAML ') !== 0) {
        throw new Error('The API file header is unknown');
      }
      if (header === 'RAML 1.0' || header === 'RAML 0.8') {
        return {
          type: header,
          contentType: 'application/raml'
        };
      }
      if (header.indexOf('RAML 1.0 Overlay') === 0 ||
        header.indexOf('RAML 1.0 Extension') === 0) {
        return {
          type: 'RAML 1.0',
          contentType: 'application/raml'
        };
      }
      throw new Error('Unsupported API file');
    });
  }
}

module.exports.ApiSearch = ApiSearch;
