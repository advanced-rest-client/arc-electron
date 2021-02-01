/* eslint-disable no-bitwise */
import { session, protocol } from 'electron';
import path from 'path';
import fs from 'fs-extra';
import mime from 'mime-types';
import { logger } from './Logger.js';
import { MainWindowPersist, TaskManagerWindowPersist } from '../common/Constants.js';

export const requestHandler = Symbol('requestHandler');

// const re = /import\s*(?:["']?([\w*{}\n, ]+)from\s*)?\s*["']?([@\w/\._-]+)["'].*/gm;
const locationPrefixes = ['web_modules', 'node_modules', 'src'];

/**
 * A class responsible for handling `web-module:` protocol.
 *
 * Components protocol is used to load ES modules with correct mime types.
 *
 * Example usage in the renderer process:
 *
 * ```
 * <script type="module" href="web-module://polymer/polymer.js"></script>
 * ```
 *
 * This checks for existing component in following order:
 * - ./bower_components/{url} (application main components)
 * - {applicationUserDataDir}/{url} (application modules installation root)
 * - {url} (filesystem)
 *
 * If the component does not exists then it throws an error.
 */
export class EsmProtocol {
  constructor() {
    this[requestHandler] = this[requestHandler].bind(this);
    /**
     * Base path to the application folder.
     * @type {String}
     */
    this.basePath = path.join(__dirname, '..', '..');
  }

  /**
   * Registers the protocol handler.
   * This must be called after the `ready` event.
   */
  register() {
    logger.debug('Registering ESM protocol');
    session.fromPartition(MainWindowPersist)
    .protocol
    .registerBufferProtocol('web-module', this[requestHandler]);
    protocol
    .registerBufferProtocol('web-module', this[requestHandler]);
    session.fromPartition(TaskManagerWindowPersist)
    .protocol
    .registerBufferProtocol('web-module', this[requestHandler]);
  }

  /**
   * @param {Electron.ProtocolRequest} request
   * @param {(response: string | Electron.ProtocolResponse) => void} callback
   * @returns
   */
  [requestHandler](request, callback) {
    const url = new URL(request.url);
    let fileLocation = this.findFile(url.pathname);
    fileLocation = decodeURI(fileLocation);
    // logger.silly(`EsmProtocolHandler::[requestHandler]: ${fileLocation}`);
    fs.readFile(fileLocation, async (error, data) => {
      if (error) {
        logger.error(error);
        // The file or directory cannot be found.
        // NET_ERROR(FILE_NOT_FOUND, -6)
        // @ts-ignore
        callback(-6);
      } else {
        // let content = data;
        const mimeType = mime.lookup(fileLocation) || 'application/octet-stream';
        // if (fileLocation.includes('node_modules/@api-modeling/')) {
        //   let str = data.toString();
        //   const matches = [...str.matchAll(re)];
        //   if (matches.length) {
        //     str = await this.makeRelativePaths(str, fileLocation, matches);
        //   }
        //   content = Buffer.from(str);
        // }
        callback({
          mimeType,
          data,
        });
      }
    });
  }

  /**
   * Finds a file location in one of the predefined paths.
   * @param {string} filepath Request path
   * @param {string[]} prefixes Location prefixes
   * @returns {string} Location of the file.
   */
  findFile(filepath, prefixes = locationPrefixes) {
    for (let i = 0, len = prefixes.length; i <len; i++) {
      const prefix = prefixes[i];
      const loc = path.join(__dirname, '..', '..', prefix, filepath);
      if (fs.existsSync(loc)) {
        return loc;
      }
    }
    return path.join(__dirname, '..', '..', filepath);
  }

  /**
   * @param {string} content
   * @param {string} fileLocation
   * @param {RegExpMatchArray[]} matches
   */
  async makeRelativePaths(content, fileLocation, matches) {
    let result = content;
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const importPath = match[2];
      if (!importPath) {
        continue;
      }
      const relativeImport = importPath.startsWith('.') || importPath.startsWith('/');
      if (relativeImport) {
        continue;
      }
      // eslint-disable-next-line no-await-in-loop
      const resolved = await this.resolveImportFile(fileLocation, importPath);
      if (!resolved) {
        continue;
      }
      result = result.replace(importPath, resolved);
    }
    return result;
  }

  /**
   * Resolves a 
   * @param {string} srcFile
   * @param {string} importPath
   */
  async resolveImportFile(srcFile, importPath) {
    const ext = path.extname(importPath);
    const absolutePath = this.findFile(importPath, ['node_modules']);
    if (!absolutePath) {
      return null;
    }
    const appRoot = path.join(__dirname, '..', '..');
    if (ext) {
      if (!absolutePath.startsWith(appRoot)) {
        // only internal paths are allowed
        return null;
      }
      return absolutePath.replace(appRoot, '');
      // return path.join(path.relative(absolutePath, appRoot), path.relative(appRoot, absolutePath));
      // return path.relative(srcFile, absolutePath);
    }
    const resolvedPath = await this.resolveModule(absolutePath);
    if (typeof resolvedPath !== 'string') {
      return null;
    }
    if (!resolvedPath.startsWith(appRoot)) {
      // only internal paths are allowed
      return null;
    }
    return resolvedPath.replace(appRoot, '');
    // return path.join(path.relative(resolvedPath, appRoot), path.relative(appRoot, resolvedPath));
    // return path.relative(srcFile, resolvedPath);
  }

  async resolveModule(absolutePath) {
    const pkgFile = path.join(absolutePath, 'package.json');
    const pkgExists = await fs.pathExists(pkgFile);
    if (pkgExists) {
      const manifestContents = await fs.readJSON(pkgFile, { throws: false });
      if (!manifestContents) {
        return null;
      }
      const { main, module } = manifestContents;
      if (module) {
        return path.join(absolutePath, module);
      }
      if (main) {
        return path.join(absolutePath, main);
      }
    }
    const indexFile = path.join(absolutePath, 'index.js');
    const indexExists = await fs.pathExists(indexFile);
    if (indexExists) {
      return indexFile;
    }
    return null;
  }
}
