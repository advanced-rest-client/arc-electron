import { ipcMain } from 'electron';
import { logger } from './Logger.js';
import { Hosts } from './lib/Hosts.js';

/** @typedef {import('@advanced-rest-client/events').HostRule.HostRule} HostRule */

const requestHandler = Symbol('requestHandler');

/**
 * A class that manages the OS' hosts file.
 * It creates a proxy from the renderer process to read the hosts file.
 */
export class HostsManager {
  constructor() {
    this.factory = new Hosts();
  }

  listen() {
    logger.debug('Listening for OS hosts events');
    ipcMain.handle('os-hosts', this[requestHandler].bind(this));
  }

  /**
   * Handler for the `os-hosts` event dispatched by ARC windows.
   * @param {Event} e
   * @param {string} type the operation type.
   * @param {...any[]} args
   */
  async [requestHandler](e, type, ...args) {
    switch (type) {
      case 'list': return this.list();
      default: throw new Error(`Unknown type: ${type}, with ${args.length} arguments.`);
    }
  }

  /**
   * @return {Promise<HostRule[]>} 
   */
  async list() {
    return this.factory.read();
  }
}
