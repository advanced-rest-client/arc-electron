const tmp = require('tmp');
const fs = require('fs-extra');
const Duplex = require('stream').Duplex;
const unzipper = require('unzipper');
const path = require('path');
const {fork} = require('child_process');
/**
 * A class to be used in the renderer process to download and extract RAML
 * data from Exchange asset.
 */
class ExchangeDataProcessor {
  constructor() {
    this._assetHandler = this._assetHandler.bind(this);
  }

  listen() {
    window.addEventListener('process-exchange-asset-data', this._assetHandler);
  }

  unlisten() {
    window.removeEventListener('process-exchange-asset-data', this._assetHandler);
  }
  /**
   * Handler for the `process-exchange-asset-data` custom event from Exchange
   * asset search panel.
   *
   * @param {CustomEvent} e
   */
  _assetHandler(e) {
    const asset = e.detail;
    let file = asset.files.find((i) => i.classifier === 'fat-raml');
    if (!file) {
      file = asset.files.find((i) => i.classifier === 'raml');
    }
    if (!file || !file.externalLink) {
      this.notifyError('RAML data not found in asset.');
      return;
    }
    this.processApiLink(file.externalLink);
  }

  processApiLink(url) {
    let apiPath;
    return this.downloadRamlData(url)
    .then((buffer) => this._unzip(buffer))
    .then((location) => {
      apiPath = location;
      return this._removeZipMainFolder(location);
    })
    .then(() => this._findApiFile(apiPath))
    .then((files) => this._decideMainFile(apiPath, files))
    .then((file) => {
      if (!file) {
        throw new Error('Api main file not found in the asset');
      }
      this._apiFile = file;
      return this._readApiType(file);
    })
    .then((type) => {
      this._apiType = type;
      return this._parseAmfParser();
    })
    .then((api) => {
      this._cleanTempFiles();
      this.notifyApi(api);
      return api;
    })
    .catch((cause) => {
      this._cleanTempFiles();
      this.notifyError(cause.message);
    });
  }
  _cleanTempFiles() {
    if (this.tmpobj) {
      fs.emptyDir(this.tmpobj.name)
      .then(() => this.tmpobj.removeCallback());
    }
  }
  /**
   * @return {Promise}
   */
  _parseAmfParser() {
    return new Promise((resolve, reject) => {
      const options = {
        execArgv: []
      };
      const proc = fork(`${__dirname}/amf-parser.js`, options);
      let resolved = false;
      let timeout = setTimeout(() => {
        if (resolved) {
          return;
        }
        resolved = true;
        proc.kill();
        reject(new Error('API parsing timeout'));
      }, 180000); // 3 minutes
      proc.on('message', (result) => {
        if (result.validation) {
          // @TODO: The app should render some fancy info dialog (?).
          console.log(result.validation);
          return;
        }
        if (timeout) {
          clearTimeout(timeout);
          timeout = undefined;
        }
        if (resolved) {
          return;
        }
        proc.kill();
        if (result.error) {
          resolved = true;
          reject(new Error(result.error));
        } else {
          resolved = true;
          resolve(result.api);
        }
      });
      proc.on('error', (error) => {
        if (timeout) {
          clearTimeout(timeout);
          timeout = undefined;
        }
        if (resolved) {
          return;
        }
        proc.kill();
        resolved = true;
        reject(new Error(error.message || 'Unknown error'));
      });
      proc.send({
        source: this._apiFile,
        from: this._apiType
      });
    });
  }
  /**
   * Downloads and processes RAML data.
   *
   * @TODO: Handle authorization.
   *
   * @param {String} url URL to RAML zip asset.
   * @return {Promise} Resolved when components are loaded and process
   * started.
   */
  downloadRamlData(url) {
    return fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Unable to download the asset. Status: ${response.status}`);
      }
      return response.arrayBuffer();
    });
  }
  /**
   * Unzips API folder and returns path to the folder in tmp location.
   * @param {ArrayBuffer} buffer Zip data
   * @return {Promise}
   */
  _unzip(buffer) {
    this.tmpobj = tmp.dirSync();
    return new Promise((resolve, reject) => {
      const stream = new Duplex();
      stream.push(Buffer.from(buffer));
      stream.push(null);
      const extractor = unzipper.Extract({
        path: this.tmpobj.name
      });
      extractor.on('close', () => {
        resolve(this.tmpobj.name);
      });
      extractor.on('error', (err) => {
        reject(err);
      });
      stream.pipe(extractor);
    });
  }
  /**
   * The zip may have source files enclosed in a folder.
   * This will look for a folder in the root path and will copy sources from it.
   *
   * @param {String} destination A place where the zip sources has been
   * extracted.
   * @return {Promise}
   */
  _removeZipMainFolder(destination) {
    return fs.readdir(destination)
    .then((files) => {
      // Clears macos files
      files = files.filter((item) => item !== '__MACOSX');
      if (files.length > 1) {
        return Promise.resolve();
      }
      const dirPath = path.join(destination, files[0]);
      return fs.stat(dirPath)
      .then((stats) => {
        if (stats.isDirectory()) {
          return fs.copy(dirPath, destination);
        }
      });
    });
  }
  /**
   * Finds main API name.
   * If the `api.raml` is present then it always points to the file.
   * If not then, if any RAML file exists it points to first raml file.
   * If not then,it returns `api.raml`
   * @param {String} destination Path where to look for the files.
   * @return {Promise<String>}
   */
  _findApiFile(destination) {
    return fs.readdir(destination)
    .then((items) => {
      const def = 'api.raml';
      const _files = [];
      for (let i = 0; i < items.length; i++) {
        let lower = items[i].toLowerCase();
        if (lower === def) {
          return def;
        }
        if (path.extname(lower) === '.raml') {
          _files.push(items[i]);
        }
      }
      if (_files.length === 1) {
        return _files[0];
      }
      if (_files.length) {
        return _files;
      }
      return;
    });
  }
  /**
   * Decides which file to use as API main file.
   * @param {String} root A root path to add to the file name
   * @param {Array<String>|String} files A file or list of files.
   * @return {Promise<String>}
   */
  _decideMainFile(root, files) {
    if (typeof files === 'string') {
      return Promise.resolve(path.join(root, files));
    }
    if (!files || !files.length) {
      throw new Error('Couldn\'t find any RMAL files.');
    }
    const fullPathFiles = files.map((item) => path.join(root, item));
    return this._findWebApiFile(fullPathFiles)
    .then((file) => {
      if (!file) {
        return this._askApiFile(files)
        .then((f) => {
          if (f) {
            return path.join(root, f);
          }
        });
      }
      return file;
    });
  }
  /**
   * Reads all files and looks for 'RAML 0.8' or 'RAML 1.0' header which
   * is a WebApi.
   * @param {Array<String>} files List of candidates
   * @return {Promise<String>}
   */
  _findWebApiFile(files) {
    const f = files.shift();
    if (!f) {
      return Promise.resolve();
    }
    return this._readApiType(f)
    .catch((e) => {
      console.log('Unable to find file type', e);
    })
    .then((type) => {
      if (type && type.type) {
        return f;
      }
      return this._findWebApiFile(files);
    });
  }

  /**
   * Asks the user to answer which API main file to choose.
   * @param {Array<String>} files List of possible file
   * @return {Promise<String>} User selection.
   */
  _askApiFile(files) {
    throw new Error('Implement me.');
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
        const match = data.match(/"swagger"(?:\s*)?:(?:\s*)"(.*)"/gim);
        if (!match) {
          throw new Error('Expected OAS but could not find version header.');
        }
        const v = match[1].trim();
        return {
          type: `OAS ${v}`,
          contentType: 'application/json'
        };
      }
      const oasMatch = data.match(/swagger(?:\s*)?:(?:\s*)"?(.*)"?/im);
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
  /**
   * Notifies user about error.
   *
   * @param {String} message Message to render.
   */
  notifyError(message) {
    console.error(message);
    const ev = new CustomEvent('process-error', {
      bubbles: true,
      detail: {
        message: message
      }
    });
    document.body.dispatchEvent(ev);
  }

  notifyApi(api) {
    const ev = new CustomEvent('api-data-ready', {
      bubbles: true,
      detail: {
        api
      }
    });
    document.body.dispatchEvent(ev);
  }
}
module.exports.ExchangeDataProcessor = ExchangeDataProcessor;
