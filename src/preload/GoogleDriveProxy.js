import { ipcRenderer } from 'electron';
import { GoogleDriveEventTypes } from '@advanced-rest-client/arc-events';

/** @typedef {import('@advanced-rest-client/arc-types').Authorization.OAuth2Authorization} OAuth2Authorization */
/** @typedef {import('@advanced-rest-client/arc-events').GoogleDriveListFolderEvent} GoogleDriveListFolderEvent */
/** @typedef {import('@advanced-rest-client/arc-events').GoogleDriveReadEvent} GoogleDriveReadEvent */
/** @typedef {import('@advanced-rest-client/arc-events').GoogleDriveSaveEvent} GoogleDriveSaveEvent */
/** @typedef {import('../types').SaveDriveFileOptions} SaveDriveFileOptions */

const saveFileHandler = Symbol('saveFileHandler');
const listAppFoldersHandler = Symbol('listAppFoldersHandler');
const getFileHandler = Symbol('getFileHandler');

/**
 * A class to be used in the renderer process that listens for drive
 * events and communicates with drive instance in the main process.
 */
export class GoogleDriveProxy {
  /**
   * @returns {OAuth2Authorization}
   */
  get oauthConfig() {
    return {
      clientId: '1076318174169-u4a5d3j2v0tbie1jnjgsluqk1ti7ged3.apps.googleusercontent.com',
      authorizationUri: 'https://accounts.google.com/o/oauth2/v2/auth',
      redirectUri: 'https://auth.advancedrestclient.com/oauth2',
      scopes: [
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive.install',
      ],
    }
  }

  constructor() {
    this[saveFileHandler] = this[saveFileHandler].bind(this);
    this[listAppFoldersHandler] = this[listAppFoldersHandler].bind(this);
    this[getFileHandler] = this[getFileHandler].bind(this);
  }

  /**
   * Listens for both ipc and web events and makes the magic happen.
   */
  listen() {
    window.addEventListener(GoogleDriveEventTypes.save, this[saveFileHandler]);
    window.addEventListener(GoogleDriveEventTypes.listAppFolders, this[listAppFoldersHandler]);
    window.addEventListener(GoogleDriveEventTypes.read, this[getFileHandler]);
  }

  /**
   * Stops listening to the web and ipc events.
   */
  unlisten() {
    window.removeEventListener(GoogleDriveEventTypes.save, this[saveFileHandler]);
    window.removeEventListener(GoogleDriveEventTypes.listAppFolders, this[listAppFoldersHandler]);
    window.removeEventListener(GoogleDriveEventTypes.read, this[getFileHandler]);
  }

  /**
   * @param {GoogleDriveSaveEvent} e
   */
  [saveFileHandler](e) {
    e.preventDefault();
    const { data, providerOptions } = e;
    const { file, contentType, parent } = providerOptions;
    const meta = {
      name: file,
      mimeType: contentType,
    };
    const options = /** @type SaveDriveFileOptions */ ({
      meta,
      parent,
      auth: this.oauthConfig,
    });
    e.detail.result = ipcRenderer.invoke('google-drive-process', 'create-file', options, data);
  }

  /**
   * Handler for `google-drive-list-app-folders` event.
   * Requests to get Drive folders list created by this application.
   * @param {GoogleDriveListFolderEvent} e
   */
  [listAppFoldersHandler](e) {
    e.detail.result = this.listFolders();
  }

  listFolders() {
    const auth = this.oauthConfig;
    auth.interactive = false;
    return ipcRenderer.invoke('google-drive-process', 'list-folders', auth);
  }

  /**
   * Downloads file from Google Drive by its ID.
   * @param {String} fileId File ID
   * @return {Promise} Promise resolved to file content.
   */
  getFile(fileId) {
    const auth = this.oauthConfig;
    auth.interactive = true;
    return ipcRenderer.invoke('google-drive-process', 'get-file', fileId, auth);
  }

  /**
   * @param {GoogleDriveReadEvent} e
   */
  [getFileHandler](e) {
    e.preventDefault();
    if (!e.id) {
      e.detail.result = Promise.reject(new Error('The "id" detail property is missing.'));
    } else {
      e.detail.result = this.getFile(e.id);
    }
  }
}
