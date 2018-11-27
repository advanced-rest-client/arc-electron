const {AmfService} = require('../lib/amf-service');
const {AmfConsoleResolver} = require('../lib/amf-console-resolver');
/**
 * A class to be used in the renderer process to download and extract RAML
 * data from Exchange asset.
 */
class ElectronAmfService {
  constructor() {
    this._assetHandler = this._assetHandler.bind(this);
    this._fileHandler = this._fileHandler.bind(this);
    this._resolveHandler = this._resolveHandler.bind(this);
  }
  /**
   * Sets `loading` flag.
   * When `true` then it dispatches `process-loading-start` custom event.
   * When `false` then it dispatches `process-loading-stop` custom event.
   * @param {Boolean} value
   */
  set loading(value) {
    if (this.__loading === value) {
      return;
    }
    this.__loading = value;
    let type = 'process-loading-' + (value ? 'start' : 'stop');
    let detail;
    if (value) {
      this.__loadingId = Date.now();
      detail = {
        message: 'Processing API data',
        indeterminate: true
      };
    } else {
      detail = {};
    }
    detail.id = this.__loadingId;
    this.fire(type, detail);
  }

  get loading() {
    return this.__loading;
  }

  /**
   * Observes for ARC's DOM events
   */
  listen() {
    window.addEventListener('process-exchange-asset-data', this._assetHandler);
    window.addEventListener('api-process-file', this._fileHandler);
    window.addEventListener('api-resolve-model', this._resolveHandler);
  }
  /**
   * Removes observers for ARC's DOM events
   *
   * @return {Promise}
   */
  unlisten() {
    window.removeEventListener('process-exchange-asset-data', this._assetHandler);
    window.removeEventListener('api-process-file', this._fileHandler);
    window.removeEventListener('api-resolve-model', this._resolveHandler);
    return this.cleanup();
  }

  cleanup() {
    if (this.amfService) {
      return this.amfService.cleanup()
      .then(() => {
        this.amfService = undefined;
      });
    }
    return Promise.resolve();
  }
  /**
   * Handler for the `process-exchange-asset-data` custom event from Exchange
   * asset search panel.
   *
   * @param {CustomEvent} e
   */
  _assetHandler(e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    const asset = e.detail;
    let file = asset.files.find((i) => i.classifier === 'fat-raml');
    if (!file) {
      file = asset.files.find((i) => i.classifier === 'raml');
    }
    if (!file || !file.externalLink) {
      this.notifyError('RAML data not found in the asset.');
      return;
    }
    this.processApiLink(file.externalLink)
    .then((result) => {
      setTimeout(() => {
        this.notifyApi(result);
      });
    })
    .catch((cause) => {
      this.notifyError(cause.message);
    });
  }
  /**
   * Handles `api-process-file` custom event.
   * The event is cancelled and the `result` property is set on
   * the detail object with resut of calling `processApiFile()`
   * @param {CustomEvent} e
   */
  _fileHandler(e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    if (!e.detail.file) {
      e.detail.result = Promise.reject(new Error('File not set.'));
      return;
    }
    e.detail.result = this.processApiFile(e.detail.file);
  }
  /**
   * Handler for the `api-resolve-model` event.
   * Resolves unresolved model using the "editing" pipeline of AMF.
   * @param {CustomEvent} e
   */
  _resolveHandler(e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    const {model, type} = e.detail;
    if (!model) {
      e.detail.result = Promise.reject(new Error('The "model" property is not set.'));
      return;
    }
    if (typeof model !== 'string') {
      e.detail.result = Promise.reject(new Error('The "model" property is not a string.'));
      return;
    }
    if (!type) {
      e.detail.result = Promise.reject(new Error('The API "type" property is not set.'));
      return;
    }
    e.detail.result = this.resolveAPiConsole(model, type);
  }
  /**
   * It downloads the file and processes it as a zipped API project.
   * @param {String} url API remote location.
   * @return {Promise<String>} Promise resolved to the AMF json-ld model.
   */
  processApiLink(url) {
    this.loading = true;
    return this.downloadRamlData(url)
    .then((buffer) => this.processBuffer(buffer))
    .then((result) => {
      this.loading = false;
      return result;
    })
    .catch((cause) => {
      this.loading = false;
      throw cause;
    });
  }
  /**
   * Procesases file data.
   * If the blob is a type of `application/zip` it processes the file as a
   * zip file. Otherwise it processes it as a file.
   *
   * @param {File|Blob} file File to process.
   * @return {Promise<String>} Promise resolved to the AMF json-ld model
   */
  processApiFile(file) {
    // const t = file.type;
    // const zip = (t && t.indexOf('/zip') !== -1) ? true : false;
    this.loading = true;
    return this._fileToBuffer(file)
    .then((buffer) => this.processBuffer(buffer))
    .then((result) => {
      this.loading = false;
      return result;
    })
    .catch((cause) => {
      this.loading = false;
      throw cause;
    });
  }
  /**
   * Parses API data to AMF model.
   * @param {Buffer} buffer Buffer created from API file.
   * @param {Object} opts Processing options:
   * - zip {Boolean} If true the buffer represents zipped file.
   * @return {Promise<String>} Promise resolved to the AMF json-ld model
   */
  processBuffer(buffer, opts) {
    if (!this.loading) {
      this.loading = true;
    }
    if (this._bufferIsZip(buffer)) {
      if (!opts) {
        opts = {};
      }
      opts.zip = opts;
    }
    if (!this.amfService) {
      this.amfService = new AmfService(buffer, opts);
    } else {
      this.amfService.setSource(buffer, opts);
    }
    return this.amfService.prepare()
    .then(() => this.amfService.resolve())
    .then((candidates) => {
      if (candidates) {
        return this.notifyApiCandidates(candidates)
        .catch((cause) => {
          return this.amfService.cancel()
          .then(() => {
            throw cause;
          });
        })
        .then((file) => {
          if (file) {
            return this.amfService.parse(file);
          }
          return this.amfService.cancel();
        });
        // .then((result) => {
        //   if (result) {
        //     setTimeout(() => {
        //       this.notifyApi(result);
        //     });
        //     return result;
        //   }
        // });
      } else {
        return this.amfService.parse();
      }
    })
    .then((result) => {
      this.loading = false;
      return result;
    })
    .catch((cause) => {
      this.loading = false;
      throw cause;
    });
  }
  /**
   * Tests if the buffer has ZIP file header.
   * @param {Buffer} buffer File buffer
   * @return {Boolean} true if the buffer is compressed zip.
   */
  _bufferIsZip(buffer) {
    return buffer[0] === 0x50 && buffer[1] === 0x4b;
  }

  _fileToBuffer(blob) {
    if (blob instanceof Buffer) {
      return Promise.resolve(blob);
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener('loadend', (e) => {
        resolve(Buffer.from(e.target.result));
      });
      reader.addEventListener('error', () => {
        reject(new Error('Unable to translate the file to buffer'));
      });
      reader.readAsArrayBuffer(blob);
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
    })
    .then((aBuffer) => Buffer.from(aBuffer));
  }

  resolveAPiConsole(model, type) {
    return AmfConsoleResolver.resolveApiConsole(model, type);
  }

  fire(type, detail) {
    const e = new CustomEvent(type, {
      bubbles: true,
      cancelable: true,
      detail
    });
    document.body.dispatchEvent(e);
    return e;
  }
  /**
   * Dispatches `process-error` custom event.
   * This only happens when `process-exchange-asset-data` event was handled
   *
   * @param {String} message Message to render.
   */
  notifyError(message) {
    console.error(message);
    this.fire('process-error', {
      message,
      source: 'amf-service'
    });
  }
  /**
   * Dispatches `api-data-ready` custom event.
   * This only happens when `process-exchange-asset-data` event was handled
   *
   * @param {Object} result Parsing results with API `model` and `type`.
   */
  notifyApi(result) {
    this.fire('api-data-ready', result);
  }
  /**
   * Dispatches `api-select-entrypoint` custom event.
   * The app should handle this event in order to proceed with the parsing flow.
   * @param {Array<String>} candidates
   * @return {Promise<String|undefined>}
   */
  notifyApiCandidates(candidates) {
    const e = this.fire('api-select-entrypoint', {
      candidates
    });
    if (e.defaultPrevented) {
      return e.detail.result;
    }
    return Promise.reject(new Error('No UI for selecting API main file :('));
  }
}
module.exports.ElectronAmfService = ElectronAmfService;
