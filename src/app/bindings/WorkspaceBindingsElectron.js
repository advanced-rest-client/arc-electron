import { WorkspaceBindings, Events } from '../../../web_modules/index.js';

/** @typedef {import('@advanced-rest-client/events').Workspace.DomainWorkspace} DomainWorkspace */
/** @typedef {import('@advanced-rest-client/events').Workspace.LegacyWorkspace} LegacyWorkspace */

const idSymbol = Symbol('idSymbol');
const fileSymbol = Symbol('fileSymbol');
const writeTimeoutSymbol = Symbol('writeTimeoutSymbol');
const getFileLocationSymbol = Symbol('getFileLocationSymbol');

/**
 * Web platform bindings for the request workspace related logic.
 */
export class WorkspaceBindingsElectron extends WorkspaceBindings {
  constructor() {
    super();
    /** @type {string} */
    this[idSymbol] = undefined;
    /** 
     * @type {string} The read location of the workspace file.
     */
    this[fileSymbol] = undefined;
    /** 
     * @type {*}
     */
    this[writeTimeoutSymbol] = undefined;
    /**
     * Store data debounce timer.
     * By default it's 500 ms.
     * @type {Number}
     */
    this.timeout = 500;
  }

  /**
   * Stores the state to a file.
   * @param {DomainWorkspace} workspace The workspace data to store.
   */
  storeAsync(workspace) {
    if (this[writeTimeoutSymbol]) {
      clearTimeout(this[writeTimeoutSymbol]);
    }
    this[writeTimeoutSymbol] = setTimeout(() => this.store(workspace), this.timeout);
  }

  /**
   * @param {DomainWorkspace} contents The workspace to store.
   */
  async store(contents) {
    const file = await this[getFileLocationSymbol]();
    try {
      await ArcEnvironment.fs.ensureFile(file);
      await ArcEnvironment.fs.writeJSON(file, contents);
      Events.Workspace.State.write(window);
    } catch (e) {
      ArcEnvironment.logger.error(`Workspace file write error to file ${file}`);
    }
  }

  /**
   * Executes the logic to change the workspace id.
   * @param {string} id The new workspace ID.
   */
  setId(id) {
    this[idSymbol] = id;
  }

  /**
   * Selects a user directory and triggers the save action in the workspace.
   * @returns {Promise<void>}
   */
  async exportWorkspace() {
    const opts = {
      file: 'arc-workspace.json',
    };
    const dialogResult = await ArcEnvironment.ipc.invoke('save-dialog', opts);
    const { canceled, filePath } = dialogResult;
    if (canceled) {
      return;
    }
    const id = await ArcEnvironment.ipc.invoke('workspace-change-location', filePath);
    this[idSymbol] = id;
    this[fileSymbol] = undefined;
    Events.Workspace.triggerWrite(window);
  }

  /**
   * Reads the current state of the workspace.
   * @returns {Promise<DomainWorkspace>}
   */
  // @ts-ignore
  async restore() {
    const file = await this[getFileLocationSymbol]();
    let result; 
    try {
      await ArcEnvironment.fs.ensureFile(file);
      result = await ArcEnvironment.fs.readJSON(file, { throws: true });
    } catch (e) {
      ArcEnvironment.logger.error(`Workspace file read error for file ${file}`);
    }
    return this.processWorkspaceInput(result);
  }

  /**
   * @returns {Promise<string>}
   */
  async [getFileLocationSymbol]() {
    if (this[fileSymbol]) {
      return this[fileSymbol];
    }
    const location = await ArcEnvironment.ipc.invoke('workspace-get-location', this[idSymbol]);
    this[fileSymbol] = location;
    return location;
  }
}
