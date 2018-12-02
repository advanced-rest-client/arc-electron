const tmp = require('tmp');
const Duplex = require('stream').Duplex;
const unzipper = require('unzipper');
const path = require('path');
const {fork} = require('child_process');
const fs = require('fs-extra');
const {ApiSearch} = require('./api-search');
/**
 * A class that handles parsing a file to AMF format.
 *
 * It unpacks zip files, searches for main entry point to the API and parses
 * the data to AMF json-ld format.
 *
 * The process can be split into 3 parts:
 *
 * - prepare - unzips file to temporaty location, sets paths
 * - resolve - in case when deterministic method of finding API main file
 * fails, the application should aks a user to choose the main file.
 * - parse - parsing API data and returning AMF model.
 *
 * Example use:
 *
 * ```javascript
 * const service = new AmfService(filePathOrBuffer);
 * service.prepare()
 * .then(() => service.resolve())
 * .then((candidates) => {
 *  // If "candidates" is set then the application
 *  // should ask the user to select main file
 *  if (candidates) {
 *    return askUser(candidates);
 *  } else {
 *    return service.parse();
 *  }
 * })
 * .then((mainFile) => service.parse(mainFile))
 * .then((model) => console.log(model))
 * .catch((cause) => console.error(cause));
 * ```
 */
class AmfService {
  /**
   * Both parameters can be ignored when creating the class but then
   * `setSource()` must be called before processing the data.
   *
   * @param {Buffer|String} source Location of the API file on the disk or
   * buffer of a file. If the source is a file and it's not a zip file then
   * it must be the API file.
   * @param {?Object} opts Process options:
   * - zip {Boolean} - if true it treats the source as a zip data. Files are
   * unzzipped to a temporary location before processing.
   * - validate {Boolean} - if true it validates the API when parsing.
   * Validation is made in the `parse` phase and results (as string) are stored
   * in `validationResult` property of the service.
   */
  constructor(source, opts) {
    this.setSource(source, opts);
  }
  /**
   * The same as with constructror but resets the sate.
   * @param {Buffer|String} source Location of the API file on the disk or
   * buffer of a file. If the source is a file and it's not a zip file then
   * it must be the API file.
   * @param {?Object} opts Process options:
   * - zip {Boolean} - if true it treats the source as a zip data. Files are
   * unzzipped to a temporary location before processing.
   * - validate {Boolean} - if true it validates the API when parsing.
   * Validation is made in the `parse` phase and results (as string) are stored
   * in `validationResult` property of the service.
   */
  setSource(source, opts) {
    if (!opts) {
      opts = {};
    }
    this.source = source;
    this.isZip = opts.zip;
    this.validate = opts.validate;
    // created at run time.
    /**
     * Temp folder data object.
     * @type {Object}
     */
    this.tmpobj = undefined;
    /**
     * A directory path where files are stored.
     * @type {String}
     */
    this._workingDir = undefined;
    /**
     * API main file (entry point) in the working directory.
     * If this is set it means the files has been resolved.
     * @type {String}
     */
    this._mainFile = undefined;
    /**
     * True when tmp object represents a file and not a directory
     * @type {Boolean}
     */
    this._tmpIsFile = false;
  }
  /**
   * Cleans up if the operation is canceled.
   * This must be called if `prepare()` was called or otherwise some temporary
   * files will be kept on the disk.
   * @return {Promise}
   */
  cancel() {
    return this._cleanTempFiles()
    .then(() => {
      this.tmpobj = undefined;
      this._workingDir = undefined;
      this._mainFile = undefined;
    });
  }

  cleanup() {
    this._cancelMonitorParser();
    this._cancelParseProcTimeout();
    const proc = this._parserProc;
    if (!proc) {
      return this.cancel();
    }
    return new Promise((resolve) => {
      this._killParser();
      proc.on('exit', () => {
        this.cancel().then(() => resolve());
      });
    });
  }
  /**
   * Prepares the file to be processed.
   * @return {Promise}
   */
  prepare() {
    if (this.isZip) {
      return this._unzipSource()
      .catch((cause) => {
        return this._cleanTempFiles()
        .then(() => {
          throw cause;
        });
      });
    }
    if (this.source instanceof Buffer) {
      return this._tmpBuffer(this.source)
      .then((location) => {
        this._workingDir = path.dirname(location);
        this._mainFile = path.basename(location);
      });
    }
    return fs.stat(this.source)
    .then((stat) => {
      if (stat.isDirectory()) {
        this._workingDir = this.source;
      } else {
        this._workingDir = path.dirname(this.source);
        this._mainFile = path.basename(this.source);
      }
    });
  }
  /**
   * Resolves the API structure and tries to find main API file.
   *
   * @param {?String} mainFile API main file if known.
   * @return {Promise<Array<String>>} If promise resolves to an array it means
   * that API type could not be determined automatically.
   */
  resolve(mainFile) {
    if (this._tmpIsFile) {
      return Promise.resolve();
    }
    if (!this._workingDir) {
      return this._cleanTempFiles()
      .then(() => Promise.reject(new Error(`prepare() function not called`)));
    }
    if (this._mainFile) {
      return Promise.resolve();
    }
    if (mainFile) {
      const file = path.join(this._workingDir, mainFile);
      return fs.pathExists(file)
      .then((exists) => {
        if (exists) {
          this._mainFile = mainFile;
          return;
        }
        throw new Error('API main file does not exist.');
      });
    }
    const search = new ApiSearch(this._workingDir);
    return search.findApiFile()
    .then((result) => {
      if (!result) {
        throw new Error('Unable to find API files in the source location');
      }
      if (result instanceof Array) {
        return result;
      }
      this._mainFile = result;
    })
    .catch((cause) => {
      return this._cleanTempFiles()
      .then(() => {
        throw cause;
      });
    });
  }
  /**
   * Parses API data using AMF parser.
   * @param {?String} mainFile Main API file to use.
   * @return {Promise<Object>} A promise resolved to AMF model.
   */
  parse(mainFile) {
    if (!this._workingDir) {
      return this._cleanTempFiles()
      .then(() => Promise.reject(new Error(`prepare() function not called`)));
    }
    if (mainFile && typeof mainFile === 'string') {
      this._mainFile = mainFile;
    }
    if (!this._mainFile) {
      return this._cleanTempFiles()
      .then(() => Promise.reject(new Error(`resolve() function not called`)));
    }
    const search = new ApiSearch(this._workingDir);
    const apiLocation = path.join(this._workingDir, this._mainFile);
    let apiType;
    return search._readApiType(apiLocation)
    .then((type) => {
      apiType = type;
      return this._runParser(apiLocation, type);
    })
    .then((model) => {
      return this._cleanTempFiles()
      .catch(() => {})
      .then(() => {
        return {
          model,
          type: apiType
        };
      });
    })
    .catch((cause) => {
      return this._cleanTempFiles()
      .then(() => {
        throw cause;
      });
    });
  }
  /**
   * Unzpis the source to a tem folder.
   * @return {Promise}
   */
  _unzipSource() {
    let p;
    if (this.source instanceof Buffer) {
      p = Promise.resolve(this.source);
    } else {
      p = fs.readFile(this.source);
    }
    return p.then((buffer) => this._unzip(buffer))
    .then((location) => {
      this._workingDir = location;
      return this._removeZipMainFolder(location);
    });
  }

  _tmpBuffer(buffer) {
    try {
      this.tmpobj = tmp.fileSync();
    } catch (e) {
      return Promise.reject(e);
    }
    this._tmpIsFile = true;
    const fd = this.tmpobj.fd;
    return fs.write(fd, buffer)
    .then(() => fs.close(fd))
    .then(() => this.tmpobj.name);
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
      stream.push(buffer);
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
   * Removes created temporary directory.
   * @return {Promise}
   */
  _cleanTempFiles() {
    if (this.tmpobj) {
      if (this._tmpIsFile) {
        this.tmpobj.removeCallback();
        this.tmpobj = undefined;
        return Promise.resolve();
      }
      return fs.emptyDir(this.tmpobj.name)
      .then(() => {
        this.tmpobj.removeCallback();
        this.tmpobj = undefined;
      });
    }
    return Promise.resolve();
  }

  _createParserProcess() {
    if (this._parserProc) {
      if (this._parserProc.connected) {
        return this._parserProc;
      } else {
        this._killParser();
      }
    }
    const options = {
      execArgv: []
    };
    this._parserProc = fork(`${__dirname}/amf-parser.js`, options);
    this._parserProc.on('exit', () => {
      this._cancelParseProcTimeout();
      this._cancelMonitorParser();
      this._parserProc = undefined;
    });
    return this._parserProc;
  }

  _setParserProcTimeout(cb, time = 180000) {
    this._parserProcCb = cb;
    this._parserProceTimeout = setTimeout(() => {
      this._parserProceTimeout = undefined;
      this._killParser();
      const fn = this._parserProcCb;
      this._parserProcCb = undefined;
      fn();
    }, time);
  }

  _cancelParseProcTimeout() {
    if (this._parserProceTimeout) {
      clearTimeout(this._parserProceTimeout);
      this._parserProceTimeout = undefined;
      this._parserProcCb = undefined;
    }
  }

  _killParser() {
    this._cancelParseProcTimeout();
    this._cancelMonitorParser();
    if (this._parserProc) {
      this._parserProc.disconnect();
      this._parserProc.removeAllListeners('message');
      this._parserProc.removeAllListeners('error');
      this._parserProc.removeAllListeners('exit');
      this._parserProc.kill();
      this._parserProc = undefined;
    }
  }

  _monitorParserProc() {
    this._parserMinitorTimeout = setTimeout(() => {
      this._parserMinitorTimeout = undefined;
      this._killParser();
    }, 60000);
  }

  _cancelMonitorParser() {
    if (this._parserMinitorTimeout) {
      clearTimeout(this._parserMinitorTimeout);
    }
  }
  /**
   * Runs the parser.
   *
   * @param {String} apiLocation API file location
   * @param {Object} type API type info object.
   * @return {Promise}
   */
  _runParser(apiLocation, type) {
    this._cancelMonitorParser();
    return new Promise((resolve, reject) => {
      const callbacks = {
        onmessage: (result) => {
          if (result.validation) {
            console.log(result.validation);
            return;
          }
          this._cancelParseProcTimeout();
          this._parserProc.removeAllListeners('message', callbacks.onmessage);
          this._parserProc.removeAllListeners('error', callbacks.onerror);
          this._parserProcCb = undefined;
          this._monitorParserProc();
          this._killParser();
          if (result.error) {
            reject(new Error(result.error));
          } else {
            resolve(result.api);
          }
        },
        onerror: (err) => {
          this._cancelParseProcTimeout();
          this._parserProc.removeAllListeners('message', callbacks.onmessage);
          this._parserProc.removeAllListeners('error', callbacks.onerror);
          this._parserProcCb = undefined;
          this._monitorParserProc();
          reject(new Error(err.message || 'Unknown error'));
        }
      };

      const proc = this._createParserProcess();
      this._setParserProcTimeout(() => {
        reject(new Error('API parsing timeout'));
        this._parserProc.removeAllListeners('message', callbacks.onmessage);
        this._parserProc.removeAllListeners('error', callbacks.onerror);
        this._monitorParserProc();
      });
      proc.on('message', callbacks.onmessage);
      proc.on('error', callbacks.onerror);
      proc.send({
        source: apiLocation,
        from: type,
        validate: this.validate
      });
    });
  }
}
module.exports.AmfService = AmfService;
