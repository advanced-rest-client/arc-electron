import { ipcRenderer } from 'electron';
import http from 'http';
import https from 'https';
import { URL } from 'url'
import logger from 'electron-log';
import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import { v4 } from 'uuid';
import { ArcHeaders } from '../../web_modules/preload.js';

/** @typedef {import('electron-log').ElectronLog} ElectronLog */
/** @typedef {import('@advanced-rest-client/events').ArcRequest.ArcBaseRequest} ArcBaseRequest */
/** @typedef {import('@advanced-rest-client/events').ArcResponse.HTTPResponse} HTTPResponse */

export class ArcEnvironment {
  /**
   * @returns {Electron.IpcRenderer}
   */
  static get ipc() {
    return ipcRenderer;
  }

  /**
   * @returns {ElectronLog}
   */
  static get logger() {
    return logger;
  }

  /**
   * @returns {import('fs-extra')}
   */
  static get fs() {
    return fs;
  }

  /**
   * @returns {import('path').PlatformPath}
   */
  static get path() {
    return path;
  }

  /**
   * @returns {import('crypto')}
   */
  static get crypto() {
    return crypto;
  }

  /**
   * @returns {string}
   */
  static uuid() {
    return v4();
  }

  /**
   * Makes an HTTP request without CORS restrictions.
   * 
   * @param {ArcBaseRequest} request
   * @returns {Promise<HTTPResponse>}
   */
  static async fetch(request) {
    const { method, url, headers, payload } = request;
    const lib = url.startsWith('https:') ? https : http;
    const params = new URL(url);

    const options = /** @type https.RequestOptions */ ({
      hostname: params.hostname,
      port: params.port,
      path: params.pathname,
      method,
    });

    if (headers) {
      const info = new ArcHeaders(headers);
      const list = /** @type http.OutgoingHttpHeaders */ ({});
      info.forEach(([value, name]) => {
        list[name] = value;
      });
      options.headers = list;
    }
    return new Promise((resolve, reject) => {
      const req = lib.request(options, (res) => {
        let value = '';
        res.on('data', (d) => {
          value += d;
        });
        res.on('end', () => {
          resolve(JSON.parse(value));
        });
      });
      req.on('error', (error) => {
        reject(error);
      });
      if (payload) {
        req.end(payload);
      } else {
        req.end();
      }
    });
  }

  /**
   * Opens one of the pre-configured "open file" dialogs.
   *
   * @param {'arc'|'postman'|'api'} type The type of the import dialog to open.
   * @returns {Promise<Electron.OpenDialogReturnValue>}
   */
  static async openDialog(type) {
    return ipcRenderer.invoke('open-dialog', type);
  }
}
