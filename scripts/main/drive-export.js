/**
 * @copyright Copyright 2017 Pawel Psztyc
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 ******************************************************************************/

const {ArcIdentity} = require('./oauth2');
const fs = require('fs-extra');
const path = require('path');
const fetch = require('node-fetch');
// const URLSafeBase64 = require('urlsafe-base64');

class DriveExport {

  constructor() {
    /**
     * File meta boundary for POST calls.
     */
    this.boundary = 'ARCFormBoundary49nr1hyovoq1tt9';
    this.delimiter = '\r\n--' + this.boundary + '\r\n';
    this.closeDelimiter = '\r\n--' + this.boundary + '--';
    /**
     * Drive's registered content type.
     * It will be used to search for app's files in the Drive.
     * Drive's handlers will recognize the app and will run it from Drive UI.
     */
    this.mime = 'application/restclient+data';
    /**
     * Extension name for files stored in Google Drive.
     */
    this.extension = 'arc';
    /**
     * A list of allowed resources (file metadata) in the file create request.
     * See https://developers.google.com/drive/v3/reference/files/create for full list.
     */
    this.allowedResource = [
      'appProperties', 'contentHints', 'createdTime', 'description', 'folderColorRgb', 'id',
      'mimeType', 'modifiedTime', 'name', 'parents', 'properties', 'starred', 'viewedByMeTime',
      'viewersCanCopyContent', 'writersCanShare'
    ];
  }

  auth() {
    return ArcIdentity.getAuthToken({interactive: true});
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
   * @param {Object} config A file creation configuration consisted with:
   *  - {Object} `resource` - A file metadata. See `this.allowedResource` for
   *  more information.
   *  - {Object} `media` - A file contents definition to save on drive.
   *  It must have defined following keys:
   *    - {String} `mimeType` - A media mime type
   *    - {String|Object} `body` - A content to save.
   */
  create(config) {
    try {
      config = this.ensureDriveFileConfig(config);
    } catch (e) {
      return Promise.reject(e);
    }

    var promise = Promise.resolve();
    // var res = config.resource;
    // if (!res.contentHints || !res.contentHints.thumbnail || !res.contentHints.image) {
    //   promise = this._appSafeIcon()
    //   .then(icon => {
    //     if (!config.resource.contentHints) {
    //       config.resource.contentHints = {};
    //     }
    //     config.resource.contentHints.thumbnail = {
    //       image: icon,
    //       mimeType: 'image/png'
    //     };
    //   });
    // } else {
    //   promise = Promise.resolve();
    // }
    return promise
    .then(() => this.auth())
    .then(at => this._uploadFile(at, config));
  }
  /**
   * Update a file on Google Drive.
   *
   * @param {String} fileId A Google Drive file ID.
   * @param {Object} config The same as for `create` function.
   * @return {Promise} Fulfilled promise with file properties (the response).
   */
  update(fileId, config) {
    try {
      config = this.ensureDriveFileConfig(config);
    } catch (e) {
      return Promise.reject(e);
    }
    return this.auth()
    .then(at => this._uploadUpdate(fileId, at, config));
  }
  /**
   * Ensure that the file has correct configuration and throw an error if not.
   * Also it will add a mime type of the file if not present.
   */
  ensureDriveFileConfig(config) {
    if (!config) {
      throw new Error('Config argument is not specified.');
    }
    if (!config.resource || !config.media) {
      throw new Error('Invalid arguments.');
    }
    var invalidArguments = Object.keys(config.resource).filter(key => {
      return this.allowedResource.indexOf(key) === -1;
    });
    if (invalidArguments.length) {
      throw new Error('Unknown argument for resource: ' + invalidArguments.join(', '));
    }
    if (!config.resource.mimeType && this.mime) {
      config.resource.mimeType = this.mime;
    }
    return config;
  }
  /**
   * Creates an app icon string acceptable by Drive API
   */
  _appSafeIcon() {
    const file = path.join(__dirname, '..', '..', 'assets', 'icon.iconset', 'icon_128x128.png');
    return fs.readFile(file)
    .then(buffer => {
      let prefix = 'data:image/png;base64,';

      let image = prefix + buffer.toString('base64');
      image = image.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      return image;
    });
  }
  /**
   * Uploads the file.
   * @param {String} accessToken Google Access token
   * @param {Object} options Resource to upload
   */
  _uploadFile(accessToken, options) {
    var init = {
      method: 'POST',
      body: this._getPayload(options),
      headers: this._getUploadHeaders(accessToken),
    };
    return fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', init)
    .then((response) => {
      if (!response.ok) {
        return Promise.reject(response.json());
      }
      return response.json();
    });
  }

  _uploadUpdate(fileId, accessToken, options) {
    var init = {
      method: 'PATCH',
      body: this._getPayload(options),
      headers: this._getUploadHeaders(accessToken),
    };
    var url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`;
    return fetch(url, init)
    .then(response => {
      if (!response.ok) {
        return Promise.reject(response.json());
      }
      return response.json();
    });
  }

  _getUploadHeaders(accessToken) {
    var headers = {
      'Authorization': 'Bearer ' + accessToken,
      'Content-Type': 'multipart/related; boundary="' + this.boundary + '"'
    };
    return headers;
  }

  _getPayload(config) {
    var content;
    if (typeof config.media.body !== 'string') {
      content = JSON.stringify(config.media.body);
    } else {
      content = config.media.body;
    }
    var d = this.delimiter;
    var cd = this.closeDelimiter;
    let meta = JSON.stringify(config.resource);

    let body = `${d}Content-Type: application/json; charset=UTF-8\r\n\r\n${meta}`;
    body += `${d}Content-Type: ${config.media.mimeType}\r\n\r\n`;
    body += `${content}${cd}`;
    return body;
  }
}
exports.DriveExport = DriveExport;
