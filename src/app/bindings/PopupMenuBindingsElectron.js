import { PopupMenuBindings } from '../../../web_modules/index.js';

/**
 * The bindings that run in the menu popup window that support proxying
 * navigation to the main other windows.
 */
export class PopupMenuBindingsElectron extends PopupMenuBindings {
  /**
   * Informs the main application window about a navigation that ocurred in the menu window.
   * 
   * @param {string} type The type of the navigation (request, project, api, etc.)
   * @param {...any} args Thew list of arguments to send to the page.
   */
  async propagateNavigation(type, ...args) {
    ArcEnvironment.ipc.send('popup-app-menu-nav', type, ...args);
  }
}
