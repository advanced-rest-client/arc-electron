import { ipcRenderer } from 'electron';

/**
 * A proxy for the renderer process to communicate with the WindowManager
 */
export class WindowProxy {
  /**
   * Queries for the initial data the page was loaded with.
   */
  async initContextMenu() {
    ipcRenderer.send('window-context-menu-init');
  }
}
