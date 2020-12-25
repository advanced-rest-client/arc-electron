// Scrips are moved to scripts/renderer/preload.js so node integration can be disabled
// in the application window.

/* eslint-disable no-console */

/**
 * Class responsible for initializing the main ARC elements
 * and setup base options.
 * Also serves as a communication bridge between main process and app window.
 *
 * This is only supported in the Electron platform.
 *
 * In ARC node integration is disabled as responses received from the server
 * can be executed in preview window. Any script would instantly get access
 * to whole electron and node environment. As a consequence the script
 * would have access to user system. Classes that need access to electron / node
 * API are loaded in sandbox in the preload script and initialized here.
 * Scripts can't use `require()` or any other node function.
 */
class ArcInit {
  /**
   * @constructor
   */
  constructor() {
    /* global ArcElectronDrive, ElectronAmfService, versionInfo */
    this.created = false;
    this.driveBridge = new ArcElectronDrive();
    this.amfService = new ElectronAmfService();
  }
  

  /**
   * Listens for application events to create a communication
   * bridge between main process and the app.
   */
  listen() {
    this.driveBridge.listen();
    this.amfService.listen();
  }

  /**
   * Handler for the `window-state-info` event from the main process.
   * Setups properties to be passed to the ARC application.
   *
   * When this is called it creates application window and places it in the
   * document body.
   *
   * @param {Event} e
   * @param {Object} info Main proces initil properties. See `AppOptions` class
   * for more details.
   */
  async _stateInfoHandler(e, info) {
    await this.processInitialPath();
  }
  
  /**
   * Sets up the application properties.
   *
   * @param {ArcElectron} app App electron element.
   */
  _setupApp(app) {
    // console.info('Initializing ARC app');
    // app.componentsDir = this.initConfig.appComponents;
    app.appVersion = versionInfo.appVersion;
    app.browserVersion = versionInfo.chrome;
    app.initTutorial();
  }

  /**
   * Handler for application command.
   *
   * @param {EventEmitter} e Node's event
   * @param {String} action
   * @param {Array} args
   */
  commandHandler(e, action, ...args) {
    // console.info('Renderer command handled: ', action);
    const { app } = this;
    switch (action) {
      case 'about': app.openAbout(); break;
      case 'open-license': app.openLicense(); break;
      case 'open-messages': app.openInfoCenter(); break;
      case 'open-onboarding': app.openOnboarding(); break;
      case 'open-workspace-details': app.openWorkspaceDetails(); break;
      default:
        console.warn('Unknown command', action, args);
    }
  }

  
  /**
   * Handles action performed in main thread (menu action) related to
   * a request.
   *
   * @param {EventEmitter} e
   * @param {String} action Action name to perform.
   */
  execRequestAction(e, action, ...args) {
    switch (action) {
      case 'save-as':
        // app.saveOpened();
        break;
      default:
    }
  }

  async processInitialPath() {
    const {startPath} = this.initConfig;
    if (!startPath) {
      return null;
    }
    const parts = startPath.split('/');
    if (parts[0] === 'file-protocol-action') {
      return this.handleDefaultProtocolActon(parts.slice(1));
    }
    window.history.pushState('', null, `#${  startPath}`);
    return null;
  }

  /**
   * Handles action run from default protocol. ARC open files having protocol
   * `arc-file:`.
   * @param {Array} args Action arguments passed from the main process.
   * @return {Promise}
   */
  async handleDefaultProtocolActon(args) {
    const [source, action, id] = args;
    switch (source) {
      case 'google-drive': return this.handleGoogleDriveAction(action, id);
      default: return null;
    }
  }

  /**
   * Handles opening a file from Google Drive UI.
   * @param {String} action Action passed from the Drive app. Currently only `open` action
   * is supported.
   * @param {String} fileId File id to process
   * @return {Promise}
   */
  async handleGoogleDriveAction(action, fileId) {
    if (action !== 'open') {
      console.warn('Currently only open action for Google Drive is supported.');
      return;
    }
    const infoNode = document.querySelector('.loading-info');
    infoNode.innerText = 'Loading file from Google Drive';
    let data = await this.driveBridge.getFile(fileId)
    if (!data) {
      const e = new Error('Google drive did not return any data.');
      this.app.notifyError(e.message);
      throw e;
    }
    try {
      data = JSON.parse(data);
    } catch (cause) {
      console.warn(cause);
      this.app.notifyError(cause.message);
      throw new Error('Unable to parse received data.');
    }
    document.body.dispatchEvent(new CustomEvent('import-process-data', {
      bubbles: true,
      cancelable: true,
      detail: {
        data
      }
    }));
  }

  
}
