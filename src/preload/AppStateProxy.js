import { ipcRenderer } from 'electron';

/** @typedef {import('@advanced-rest-client/arc-types').ArcState.ARCState} ARCState */

/**
 * A class that acts as a proxy to read application settings.
 */
export class AppStateProxy {
  /**
   * Reads the current application state.
   * @returns {Promise<ARCState>}
   */
  read() {
    return ipcRenderer.invoke('app-state-read');
  }

  /**
   * Updates a single state value
   * @param {string} name Path to the state preference
   * @param {any} value State value
   * @returns {Promise<void>}
   */
  update(name, value) {
    return ipcRenderer.invoke('app-state-update', name, value);
  }
}
