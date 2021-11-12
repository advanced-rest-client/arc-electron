/* eslint-disable no-param-reassign */
import { Oauth2Identity } from '@advanced-rest-client/electron';
import { ipcMain, net } from 'electron';

/** @typedef {import('@advanced-rest-client/events').Authorization.OAuth2Authorization} OAuth2Authorization */
/** @typedef {import('../types').DriveExportInit} DriveExportInit */
/** @typedef {import('../types').SaveDriveFileOptions} SaveDriveFileOptions */
/** @typedef {import('../types').FileMedia} FileMedia */
/** @typedef {import('../types').FileResource} FileResource */
/** @typedef {import('../types').AppFolderListResponse} AppFolderListResponse */
/** @typedef {import('../types').FolderListItem} FolderListItem */
/** @typedef {import('../types').FileCreateItem} FileCreateItem */

export const actionHandler = Symbol('actionHandler');
export const saveHandler = Symbol('saveHandler');
export const listFoldersHandler = Symbol('listFoldersHandler');
export const createFolderHandler = Symbol('createFolderHandler');

/**
 * A class that is responsible for exporting data to Google Drive.
 * The class is to be used with the main process.
 */
export class GoogleDrive {
  /**
   * @type {Object} Default configuration for Advanced REST Client.
   */
  static get arcDefaults() {
    return {
      mime: 'application/restclient+data',
      fileDescription: 'Advanced REST client data export file.',
      fileType: 'application/json',
    };
  }

  /**
   * @param {DriveExportInit=} opts Instance defaults
   */
  constructor(opts={}) {
    /**
     * Drive's registered content type.
     * It will be used to search for app's files in the Drive.
     * Drive's handlers will recognize the app and will run it from Drive UI.
     */
    this.mime = opts.mime;
    /**
     * A default file description
     */
    this.fileDescription = opts.fileDescription;
    /**
     * A default file media type
     */
    this.fileType = opts.fileType;
    /**
     * List of cached folders created by the app.
     * @type {FolderListItem[]}
     */
    this.cachedFolders = undefined;

    this[actionHandler] = this[actionHandler].bind(this);
  }

  /**
   * Listens for renderer events.
   */
  listen() {
    ipcMain.handle('google-drive-process', this[actionHandler]);
  }

  /**
   * Remove event listeners from the main IPC
   */
  unlisten() {
    ipcMain.removeHandler('google-drive-process');
  }

  /**
   * Handles the action from the renderer process.
   * @param {any} e
   * @param {string} action The name of the action
   * @param  {...any} args Operation arguments
   * @return {Promise<any>}
   */
  [actionHandler](e, action, ...args) {
    switch (action) {
      case 'create-file': return this[saveHandler](args[0], args[1]);
      case 'list-folders': return this[listFoldersHandler](args[0]);
      case 'create-app-folder': return this[createFolderHandler](args[0], args[1]);
      case 'get-file': return this.getFile(args[0], args[1]);
      default: throw new Error('Unknown action.');
    }
  }

  /**
   * @param {SaveDriveFileOptions} config The file meta data
   * @param {any} data The data to store
   */
  async [saveHandler](config, data) {
    const { auth, id, meta } = config;
    const resource = this._createResource(meta);
    const media = this._createMedia(meta.mimeType, data);
    if (id) {
      return this.update(id, resource, media, config.parent, auth);
    }
    return this.create(resource, media, config.parent, auth);
  }

  /**
   * @param {any} opts
   */
  async [listFoldersHandler](opts={}) {
    if (this.cachedFolders) {
      return this.cachedFolders;
    }
    const { auth } = opts;
    const result = await this.listAppFolders(auth);
    const folders = [];
    if (result.files) {
      result.files.forEach((item) => {
        folders[folders.length] = {
          id: item.id,
          name: item.name,
        };
      });
    }
    this.cachedFolders = folders;
    return folders;
  }

  /**
   * @param {string} name
   * @param {OAuth2Authorization=} auth
   * @return {Promise<FolderListItem>}
   */
  async [createFolderHandler](name, auth={}) {
    return this.ensureParent(name, auth);
  }

  /**
   * Creates media data used by this library
   * @param {string} contentType The content type of the file.
   * @param {any} data The data to upload.
   * @return {FileMedia} Resource object
   */
  _createMedia(contentType, data) {
    let body = data;
    if (typeof body !== 'string') {
      body = JSON.stringify(body);
    }
    const media = {
      mimeType: contentType || this.fileType,
      body,
    };
    return media;
  }

  /**
   * Creates resource data for Drive file.
   * @param {FileResource} meta Passed user configuration
   * @return {FileResource} Resource object
   */
  _createResource(meta) {
    const result = { ...meta };
    if (!result.description && this.fileDescription) {
      result.description = this.fileDescription;
    }
    if (!result.mimeType && this.fileType) {
      result.mimeType = this.fileType;
    }
    return result;
  }

  /**
   * Authorize the user with Google Drive.
   * @param {OAuth2Authorization=} auth Passed `auth` object to create / update functions.
   * @return {Promise<OAuth2Authorization>} Promise resolved to token info object.
   */
  async auth(auth) {
    if (auth) {
      if (auth.accessToken) {
        return auth;
      }
      return Oauth2Identity.launchWebAuthFlow(auth);
    }
    return Oauth2Identity.getAuthToken({ interactive: true });
  }

  /**
   * Lists folders in Google Drive.
   * With regular set of authorization scopes this function lists folders
   * created by this application.
   * With additional scopes it will list all folders.
   * ARC uses default set of scopes meaning it will only list folders
   * previously created by it (as ling as OAuth client id is the same).
   * @param {OAuth2Authorization=} auth The auth configuration.
   * @return {Promise<AppFolderListResponse|undefined>} Promise resolved to Drive response.
   */
  async listAppFolders(auth) {
    const info = await this.auth(auth);
    if (info) {
      return this._listAppFolders(info);
    }
    return undefined;
  }

  /**
   * Implementation for folders listing
   * @param {OAuth2Authorization} auth
   * @return {Promise<AppFolderListResponse|undefined>}
   */
  _listAppFolders(auth) {
    const params = {
      q: 'trashed = false and mimeType="application/vnd.google-apps.folder"',
      orderBy: 'modifiedTime desc',
    };
    let url = 'https://www.googleapis.com/drive/v3/files?';
    Object.keys(params).forEach((key) => {
      url += `${key}=${encodeURIComponent(params[key])}&`;
    });
    return new Promise((resolve, reject) => {
      const request = net.request({
        method: 'GET',
        url,
      });
      request.setHeader('authorization', `Bearer ${auth.accessToken}`);
      request.setHeader('accept', 'application/json');
      request.on('response', (response) => {
        const body = /** @type Buffer[] */ ([]);
        response.on('data', (chunk) => {
          body.push(chunk);
        });
        response.on('end', () => {
          const data = Buffer.concat(body).toString();
          let parsed;
          try {
            parsed = JSON.parse(data);
          } catch (e) {
            reject(e);
            return;
          }
          if (parsed.error) {
            reject(new Error(parsed.message));
          } else {
            resolve(parsed);
          }
        });
      });
      request.on('error', (error) => {
        reject(error);
      });
      request.end();
    });
  }

  /**
   * Creates a Google Drive File.
   *
   * If `config.resource.mimeType` is not set and `drive.file.mime` is set then
   * `this.mime` is used instead.
   *
   * This script will automatically set file thumbnail if not set
   * (`config.resource.contentHints.thumbnail` object value).
   *
   * @param {FileResource} resource File metadata.
   * @param {FileMedia} media A data to send with content type.
   * @param {string=} parent The parent of the file. It may be the id of existing folder or a name of a folder to create
   * @param {OAuth2Authorization=} auth The optional authorization
   * @return {Promise<FileCreateItem>} Promise resolved to Drive response object.
   */
  async create(resource, media, parent, auth) {
    if (!resource.mimeType && this.mime) {
      resource.mimeType = this.mime;
    }
    const info = await this.auth(auth);
    let parentInfo;
    if (parent) {
      parentInfo = await this.ensureParent(parent, info);
      resource.parents = [parentInfo.id];
    }
    const token = info.accessToken;
    const url = await this._initializeSession(token, resource);
    const result = await this._upload(token, url, media.body, media.mimeType);
    if (parentInfo) {
      result.parents = [parentInfo];
    }
    return result;
  }

  /**
   * Update a file on Google Drive.
   *
   * @param {String} fileId A Google Drive file ID.
   * @param {FileResource} resource The same as for `create` function.
   * @param {FileMedia} media The same as for `create` function.
   * @param {string=} parent The parent of the file. It may be the id of existing folder or a name of a folder to create
   * @param {OAuth2Authorization=} auth The optional authorization
   * @return {Promise} Fulfilled promise with file properties (the response).
   */
  async update(fileId, resource, media, parent, auth) {
    if (!resource.mimeType && this.mime) {
      resource.mimeType = this.mime;
    }
    const info = await this.auth(auth);
    const token = info.accessToken;
    const url = await this._initializeSession(token, resource, fileId);
    return this._upload(token, url, media.body, media.mimeType);
  }

  /**
   * Initializes resumable session to upload a file to Google Drive.
   * @param {string} token Authorization token
   * @param {FileResource=} meta Optional file meta data to send with the request
   * @param {string=} fileId If it is the update request, this is file id to update
   * @return {Promise<string>} The upload URL.
   */
  _initializeSession(token, meta, fileId) {
    let url = 'https://www.googleapis.com/upload/drive/v3/files';
    let method;
    if (fileId) {
      url += `/${fileId}?uploadType=resumable`;
      method = 'PATCH';
    } else {
      url += '?uploadType=resumable';
      method = 'POST';
    }
    return new Promise((resolve, reject) => {
      const request = net.request({
        method,
        url,
      });
      request.setHeader('authorization', `Bearer ${token}`);
      request.setHeader('Content-Type', 'application/json; charset=UTF-8');
      request.on('response', (response) => {
        if (response.statusCode >= 400) {
          const body = [];
          response.on('data', (chunk) => {
            body.push(chunk);
          });
          response.on('end', () => {
            const msg = `Could not initialize Drive upload session. Reason: ${Buffer.concat(body).toString()}`;
            reject(new Error(msg));
          });
          return;
        }
        const result = response.headers.location;
        if (result) {
          resolve(Array.isArray(result) ? result[0] : result);
          // response.destroy();
        } else {
          reject(new Error('Could not initialize Drive upload session.'));
        }
      });
      request.on('error', (error) => {
        reject(error);
      });
      const message = meta ? JSON.stringify(meta) : undefined;
      request.write(message);
      request.end();
    });
  }

  /**
   * Uploads the file to the upload endpoint.
   * The `url` is received from the Drive upload location of the upload for
   * the resource.
   * @param {String} token
   * @param {String} url
   * @param {String} message
   * @param {String} mimeType
   * @return {Promise}
   */
  _upload(token, url, message, mimeType) {
    return new Promise((resolve, reject) => {
      const request = net.request({
        method: 'PUT',
        url,
      });
      request.setHeader('authorization', `Bearer ${  token}`);
      request.setHeader('content-type', mimeType);
      request.on('response', (response) => {
        const body = [];
        response.on('data', (chunk) => {
          body.push(chunk);
        });
        response.on('end', () => {
          const data = Buffer.concat(body).toString();
          let parsed;
          try {
            parsed = JSON.parse(data);
          } catch (e) {
            reject(e);
            return;
          }
          resolve(parsed);
        });
      });
      request.on('error', (error) => {
        reject(error);
      });
      request.write(message);
      request.end();
    });
  }

  /**
   * @param {string} parent The parent id or name.
   * @param {OAuth2Authorization=} auth The auth configuration.
   * @return {Promise<FolderListItem>} The id of the parent to use with the resource,
   */
  async ensureParent(parent, auth) {
    const result = await this.listAppFolders(auth);
    if (result.files) {
      const existing = result.files.find((item) => item.id === parent || item.name === parent);
      if (existing) {
        return existing;
      }
    }
    return this.createFolder(parent, auth);
  }

  /**
   * Creates a Google Drive folder.
   *
   * @param {string} parent The folder name
   * @param {OAuth2Authorization=} auth Authorization data to use
   * @return {Promise<FolderListItem>}
   */
  async createFolder(parent, auth) {
    const info = await this.auth(auth);
    const token = info.accessToken;
    const item = await this._createFolder(parent, token);
    if (!this.cachedFolders) {
      this.cachedFolders = [];
    }
    this.cachedFolders.push(item);
    return item;
  }

  /**
   * Makes a request to Drive API to create a folder.
   * @param {String} name Folder name
   * @param {String} token Authorization token.
   * @return {Promise<FolderListItem>} A promise resolved to created folder ID.
   */
  _createFolder(name, token) {
    const url = 'https://content.googleapis.com/drive/v3/files?alt=json';
    const mimeType = 'application/vnd.google-apps.folder';
    const message = JSON.stringify({
      name,
      mimeType,
    });
    return new Promise((resolve, reject) => {
      const request = net.request({
        method: 'POST',
        url,
      });
      request.setHeader('authorization', `Bearer ${token}`);
      request.setHeader('content-type', 'application/json');
      request.on('response', (response) => {
        const body = /** @type Buffer[] */ ([]);
        response.on('data', (chunk) => {
          body.push(chunk);
        });
        response.on('end', () => {
          const data = Buffer.concat(body).toString();
          let parsed;
          try {
            parsed = JSON.parse(data);
          } catch (e) {
            reject(e);
            return;
          }
          if (parsed.error) {
            reject(new Error(parsed.message));
          } else {
            resolve(parsed);
          }
        });
      });
      request.on('error', (error) => {
        reject(error);
      });
      request.write(message);
      request.end();
    });
  }

  /**
   * Downloads the file data by given ID.
   * @param {string} id File ID
   * @param {OAuth2Authorization=} auth Authorization data to use
   * @return {Promise} Promise resolved to file's string data.
   */
  async getFile(id, auth) {
    const info = await this.auth(auth);
    return this._downloadFile(info, id);
  }

  /**
   * Makes a request to Drive API to download file content.
   * @param {OAuth2Authorization} auth Authorization object.
   * @param {string} id File id
   * @return {Promise}
   */
  _downloadFile(auth, id) {
    const url = `https://www.googleapis.com/drive/v3/files/${id}?alt=media`;
    return new Promise((resolve, reject) => {
      const request = net.request({
        method: 'GET',
        url,
      });
      request.setHeader('authorization', `Bearer ${auth.accessToken}`);
      request.on('response', (response) => {
        let isError = false;
        if (response.statusCode >= 400) {
          isError = true;
        }
        const body = [];
        response.on('data', (chunk) => {
          body.push(chunk);
        });
        response.on('end', () => {
          let data = Buffer.concat(body).toString();
          if (isError) {
            try {
              let tmp = JSON.parse(data);
              if (tmp.error) {
                tmp = tmp.error;
              }
              if (tmp.message) {
                data = (tmp.code ? (`${String(tmp.code)}: `) : '') + tmp.message;
              }
            } catch (_) {
              // ...
            }
            reject(new Error(data));
          } else {
            resolve(data);
          }
        });
      });
      request.on('error', (error) => {
        reject(error);
      });
      request.end();
    });
  }
}
