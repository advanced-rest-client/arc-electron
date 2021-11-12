import { GoogleDriveBindings } from '../../../web_modules/index.js';

/** @typedef {import('@advanced-rest-client/events').GoogleDrive.AppFolder} AppFolder */
/** @typedef {import('@advanced-rest-client/events').DataExport.ArcExportResult} ArcExportResult */
/** @typedef {import('@advanced-rest-client/app/src/types').SaveDriveFileOptions} SaveDriveFileOptions */

export class GoogleDriveBindingsElectron extends GoogleDriveBindings {
  /**
   * Downloads file from Google Drive by its ID.
   * @param {string} fileId The Google Drive file ID
   * @returns {Promise<string>} The contents of the file.
   */
  // @ts-ignore
  async read(fileId) {
    const auth = this.oauthConfig;
    auth.interactive = true;
    return ArcEnvironment.ipc.invoke('google-drive-process', 'get-file', fileId, auth);
  }

  /**
   * @param {any} data
   * @param {SaveDriveFileOptions} options
   * @returns {Promise<ArcExportResult>}
   */
  // @ts-ignore
  async write(data, options) {
    return ArcEnvironment.ipc.invoke('google-drive-process', 'create-file', options, data);
  }

  /**
   * @returns {Promise<AppFolder[]>}
   */
  // @ts-ignore
  async listFolders() {
    const auth = this.oauthConfig;
    auth.interactive = false;
    return ArcEnvironment.ipc.invoke('google-drive-process', 'list-folders', auth);
  }

  /**
   * This is a placeholder for an action when the user picks up a Google Drive item
   * @param {string} id The Google Drive file id.
   * @returns {Promise<void>}
   */
  async notifyFilePicked(id) {
    // this does not need a confirmation so simple send will do.
    ArcEnvironment.ipc.send('google-drive-proxy-file-pick', id);
  }
}
