import { ApiParserBindings, IdbKeyVal, Route } from '../../../web_modules/index.js';

/** @typedef {import('@advanced-rest-client/events').Amf.ApiParseResult} ApiParseResult */
/** @typedef {import('@advanced-rest-client/events').Amf.AmfServiceProcessingOptions} AmfServiceProcessingOptions */

/**
 * This is bindings class for API parsing for the demo page.
 * This process is so complex and nuanced that we can't build a single class for all.
 * 
 * ARC has its implementation in the `arc-electron` code. The other tools and apps must build own 
 * implementation.
 * 
 * Suggestion: Take a look into the https://github.com/api-components/amf-web-api project.
 * It has a library that spins off a server that parses an API project with AMF parser.
 */
export class ElectronApiParserBindings extends ApiParserBindings {
  /**
   * Reads AMF service port number.
   * Starts the www server when needed.
   * @returns {Promise<number>} 
   */
  getWwwPort() {
    return ArcEnvironment.ipc.invoke('amf-parser', 'get-port');
  }

  /**
   * @param {number} port
   * @param {string=} path
   * @returns {string} The base URI of the API service.
   */
  getApiServiceUrl(port, path='/') {
    const url = new URL(path, `http://localhost:${port}`);
    return url.toString();
  }

  /**
   * Downloads the file and processes it as a zipped API project.
   *
   * @param {string} url API remote location.
   * @param {string=} mainFile API main file. If not set the program will try to find the best match.
   * @param {string=} hash When set it will test data integrity with the MD5 hash
   * @returns {Promise<ApiParseResult>} Promise resolved to the AMF json-ld model.
   */
  // @ts-ignore
  async processApiLink(url, mainFile, hash) {
    try {
      const buffer = Buffer.from(await this.downloadApiProject(url));
      this.checkIntegrity(buffer, hash);
      const result = await this.processBuffer(buffer, { mainFile });
      this.loading = false;
      return result;
    } catch (cause) {
      this.loading = false;
      throw cause;
    }
  }

  /**
   * Parses API data to AMF model.
   * 
   * @param {Buffer} buffer Buffer created from API file.
   * @param {AmfServiceProcessingOptions=} opts Processing options
   * @returns {Promise<ApiParseResult>} Promise resolved to the AMF json-ld model
   */
  // @ts-ignore
  async processBuffer(buffer, opts) {
    const port = await this.getWwwPort();
    const { mainFile='' } = opts;
    const url = this.getApiServiceUrl(port, '/file');
    const response = await fetch(url, {
      body: buffer,
      method: 'POST',
      headers: {
        'Content-Type': 'application/zip',
        'x-entrypoint': mainFile,
      },
    });
    const body = await response.json();
    if (response.status !== 201) {
      throw new Error(body.message || 'Unable to communicate with the API parser service.');
    }
    const { location } = body;
    if (!location) {
      throw new Error(`The API parsing service returned unexpected value.`);
    }
    return this.readAndProcessParsingResult(location, port);
  }

  /**
   * Processes file data.
   * If the blob is a type of `application/zip` it processes the file as a
   * zip file. Otherwise it processes it as a file.
   *
   * @param {File|Blob} file File to process.
   * @returns {Promise<ApiParseResult>} Promise resolved to the AMF json-ld model
   */
  // @ts-ignore
  async processApiFile(file) {
    const port = await this.getWwwPort();
    const url = this.getApiServiceUrl(port, '/file');
    const response = await fetch(url, {
      body: file,
      method: 'POST',
      headers: {
        'Content-Type': file.type || 'application/zip',
      },
    });
    const body = await response.json();
    if (response.status !== 201) {
      throw new Error(body.message || 'Unable to communicate with the API parser service.');
    }
    const { location } = body;
    if (!location) {
      throw new Error(`The API parsing service returned unexpected value.`);
    }
    return this.readAndProcessParsingResult(location, port);
  }

  /**
   * Handles the file change event and processes the file as an API.
   * This is a legacy flow as this should not trigger an arbitrary process that changes the state of the application
   * (like this one). This should have more intentional flow.
   *
   * @param {File|Blob} file File to process.
   * @returns {Promise<any>}
   */
  async legacyProcessApiFile(file) {
    const result = await this.processApiFile(file);
    const key = ArcEnvironment.uuid();
    await IdbKeyVal.set(key, result);
    Route.navigatePage('api-console.html', 'open', 'file', key);
  }

  /**
   * @param {string[]} candidates
   * @returns {Promise<string|undefined>}
   */
  // @ts-ignore
  async selectApiMainFile(candidates) {
    const dialog = document.createElement('api-entrypoint-selector');
    dialog.files = candidates;
    document.body.appendChild(dialog);
    dialog.opened = true;
    dialog.modal = true;
    return new Promise((resolve) => {
      dialog.addEventListener('closed', 
        /** @param {CustomEvent} e */
        (e) => {
          if (e.detail.canceled || !e.detail.confirmed) {
            resolve(undefined);
          } else {
            resolve(dialog.selected);
          }
      });
    });
  }

  /**
   * Checks for Exchange file integrity, using passed md5 hash.
   * @param {Buffer} buffer File's buffer
   * @param {string} hash File's hash
   * @returns {Buffer}
   * @throws {Error} When computed md5 sum is not valid.
   */
  checkIntegrity(buffer, hash) {
    if (!hash) {
      return buffer;
    }
    // @ts-ignore
    const checksum = ArcEnvironment.crypto.createHash('md5').update(buffer, 'utf8').digest('hex');
    if (hash === checksum) {
      return buffer;
    }
    throw new Error('API file integrity test failed. Checksum mismatch.');
  }

  /**
   * Makes a query to the AMF service for the parsing result. When ready it either returns 
   * the value or pics the API main file.
   * 
   * This function is made to be called recursively until one of the expected status codes are returned.
   * 
   * @param {string} headerLocation The current URL to query.
   * @param {number} knownPort
   * @returns {Promise<ApiParseResult|undefined>}
   */
  async readAndProcessParsingResult(headerLocation, knownPort) {
    const url = this.getApiServiceUrl(knownPort, headerLocation);
    const response = await fetch(url);
    if (response.status === 200) {
      const model = await response.json();
      const result = /** @type ApiParseResult */ ({
        model,
        type: {
          type: response.headers.get('x-api-vendor'),
          contentType: '',
        },
      });
      return result;
    }
    if (response.status === 204) {
      const location = response.headers.get('location');
      await this.aTimeout(250);
      return this.readAndProcessParsingResult(location || headerLocation, knownPort);
    }
    if (response.status === 300) {
      const location = response.headers.get('location');
      const body = await response.json();
      const mainFile = await this.selectApiMainFile(body.files);
      if (!mainFile) {
        return undefined;
      }
      const newUrl = this.getApiServiceUrl(knownPort, location || headerLocation);
      const updateResponse = await fetch(newUrl, {
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ entrypoint: mainFile }),
      });
      if (updateResponse.status === 200) {
        return this.readAndProcessParsingResult(updateResponse.headers.get('location') || headerLocation, knownPort);
      }
      throw new Error(`The API parsing service returned unexpected response ${updateResponse.status}`);
    }
    const body = await response.json();
    throw new Error(body.message || 'Unable to communicate with the API parser service.');
  }

  /**
   * @param {number=} timeout
   * @returns {Promise<void>} 
   */
  aTimeout(timeout=0) {
    return new Promise((resolve) => {
      setTimeout(() => resolve(), timeout);
    });
  }
}
