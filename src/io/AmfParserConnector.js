import { app, ipcMain } from 'electron';
import path from 'path';
import { v4 } from 'uuid';
import { fork } from 'child_process';
import { logger } from './Logger.js';

/** @typedef {import('child_process').ChildProcess} ChildProcess */
/** 
 * @typedef ProcessMessage
 * @property {(error: Error) => void} rejector
 * @property {(data: any) => void} resolver
 */

/**
 * AMF parsing server connector.
 * It controls the server instance.
 */
export class AmfParserConnector {
  constructor() {
    /** @type ChildProcess */
    this.process = undefined;
    /** @type Map<string, ProcessMessage> */
    this.queue = new Map();
  }

  listen() {
    ipcMain.handle('amf-parser', this.ipcHandler.bind(this));
  }

  /**
   * @param {Electron.IpcMainEvent} e
   * @param {string} action The action to perform.
   */
  async ipcHandler(e, action) {
    switch (action) {
      case 'get-port': return this.getServerPort();
      default: throw new Error(`Unknown action: ${action}`);
    }
  }

  serviceUrl() {
    const base = app.getAppPath();
    return path.join(base, 'services', 'AmfParserService.js');
  }

  /**
   * Reads the port number from the www server created by this service.
   * 
   * @returns {Promise<number>} The port number the service is running on.
   */
  async getServerPort() {
    if (!this.process) {
      return this.startProcess();
    }
    return new Promise((resolve, reject) => {
      const id = v4();
      this.queue.set(id, {
        rejector: reject,
        resolver: resolve,
      });
      this.process.send({
        type: 'getPort',
        id,
      });
    });
  }

  /**
   * Stops the www process.
   * @return {Promise<void>} 
   */
  async stopProcess() {
    if (!this.process) {
      return undefined;
    }
    return new Promise((resolve, reject) => {
      const id = v4();
      this.queue.set(id, {
        rejector: reject,
        resolver: resolve,
      });
      this.process.send({
        type: 'stop',
        id,
      });
    });
  }

  /**
   * Starts the www process.
   * 
   * @returns {Promise<number>} The port number the service is running on.
   */
  async startProcess() {
    return new Promise((resolve, reject) => {
      const id = v4();
      this.queue.set(id, {
        rejector: reject,
        resolver: resolve,
      });
      this.process = fork(this.serviceUrl());
      // the first message is `initialized` so we are sure we can proceed.
      this.process.once('message', () => {
        this.process.addListener('message', this.processMessageHandler.bind(this));
        this.process.addListener('error', this.processErrorHandler.bind(this));
        this.process.addListener('close', this.processCloseHandler.bind(this));
        this.process.send({
          type: 'start',
          id,
        });
      });
    });
  }

  /**
   * @param {any} message
   */
  processMessageHandler(message) {
    const { id, type } = message;
    if (!id && type === 'error') {
      logger.error(message.message);
      if (message.stack) {
        logger.error(message.stack);
      }
      return;
    }
    if (!id) {
      logger.error(`Ignoring AMF process message. Queue ID is not set.`);
      return;
    }
    const info = this.queue.get(id);
    if (!info) {
      logger.warn(`Ignoring AMF process message. Queue ID is no longer in the queue.`);
      return;
    }
    this.queue.delete(id);
    if (type === 'error') {
      const err = new Error(message.message);
      if (message.stack) {
        err.stack = message.stack;
      }
      info.rejector(err);
      return;
    }
    info.resolver(message.result);
  }

  /**
   * @param {Error} error
   */
  processErrorHandler(error) {
    logger.error(error.message);
  }

  /**
   * Reacts to the process close event.
   * Rejects any remaining promises and clears the process.
   */
  processCloseHandler() {
    this.process = undefined;
    for (const [, info] of this.queue) {
      info.rejector(new Error('The parser process is closing'));
    }
    this.queue.clear();
  }
}
