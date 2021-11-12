import { MenuBindings, Events, EventTypes } from '../../../web_modules/index.js';

/** @typedef {import('@advanced-rest-client/events').Menu.MenuSizing} MenuSizing */
/** @typedef {import('@advanced-rest-client/events').ARCHelpTopicEvent} ARCHelpTopicEvent */
/** @typedef {import('@advanced-rest-client/events').ARCExternalNavigationEvent} ARCExternalNavigationEvent */
/** @typedef {import('@advanced-rest-client/events').ExternalNavigationOptions} ExternalNavigationOptions */

/**
 * A menu binding that should be included in the ARC main window.
 */
export class ElectronMenuBindings extends MenuBindings {
  async initialize() {
    await super.initialize();
    window.addEventListener(EventTypes.Navigation.helpTopic, this.helpTopicHandler.bind(this));
    window.addEventListener(EventTypes.Navigation.navigateExternal, this.navigateExternalHandler.bind(this));
    ArcEnvironment.ipc.on('popup-app-menu-opened', this.popupMenuOpenedHandler.bind(this));
    ArcEnvironment.ipc.on('popup-app-menu-closed', this.popupMenuClosedHandler.bind(this));
    ArcEnvironment.ipc.on('app-navigate', this.mainNavigateHandler.bind(this));
  }

  /**
   * Sends the information to the IO thread to detach a menu from the main window.
   * @param {string} menu The name of the menu.
   * @param {MenuSizing} sizing The size of the created menu window.
   */
  async detachMenu(menu, sizing) {
    ArcEnvironment.ipc.send('popup-app-menu', menu, sizing);
    Events.Menu.State.open(document.body, menu);
  }

  /**
   * @param {Electron.IpcRendererEvent} e
   * @param {string} type
   */
  popupMenuOpenedHandler(e, type) {
    Events.Menu.State.open(document.body, type);
  }

  /**
   * @param {Electron.IpcRendererEvent} e
   * @param {string} type
   */
  popupMenuClosedHandler(e, type) {
    Events.Menu.State.close(document.body, type);
  }

  /**
   * @param {Electron.IpcRendererEvent} e
   * @param {string} type
   * @param {string[]} args
   */
  mainNavigateHandler(e, type, args) {
    switch (type) {
      case 'project': this.popupMenuNavigate(type, args[0], args[1]); break;
      case 'request':
      case 'api': 
      case 'navigate': 
        this.popupMenuNavigate(type, args[0], args[1], args[2]); 
        break;
      case 'help': this.popupMenuNavigate(type, args[0]); break;
      default: ArcEnvironment.logger.log(`Unknown navigation: ${type}`);
    }
  }

  /**
   * @param {ARCHelpTopicEvent} e
   */
  helpTopicHandler(e) {
    const { topic } = e;
    ArcEnvironment.ipc.send('help-topic', topic);
  }

  /**
   * @param {ARCExternalNavigationEvent} e
   */
  navigateExternalHandler(e) {
    const { url } = e;
    const options = /** @type ExternalNavigationOptions */ (e.detail || {});
    if (options.purpose) {
      ArcEnvironment.ipc.send('open-web-url', url, options.purpose);
    } else {
      ArcEnvironment.ipc.send('open-external-url', url);
    }
  }
}
