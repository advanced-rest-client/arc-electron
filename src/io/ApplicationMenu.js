/* eslint-disable no-param-reassign */
import { EventEmitter } from 'events';
import { app, Menu, MenuItem } from 'electron';
import fs from 'fs-extra';
import path from 'path';
import { logger } from './Logger.js';
import { WorkspaceHistory } from './models/WorkspaceHistory.js';


/** @typedef {import('../menus/types').MenuDefinition} MenuDefinition */
/** @typedef {import('../menus/types').MenuItemDefinition} MenuItemDefinition */
/** @typedef {import('./models/Models').WorkspaceHistoryEntry} WorkspaceHistoryEntry */
/** @typedef {import('./ApplicationUpdater').ApplicationUpdater} ApplicationUpdater */
/** @typedef {import('electron').BrowserWindow} BrowserWindow */

export const appendHistoryEntry = Symbol('appendHistoryEntry');
export const workspaceHistoryAction = Symbol('workspaceHistoryAction');
export const clearWorkspaceHistory = Symbol('clearWorkspaceHistory');
export const createWorkspaceHistory = Symbol('createWorkspaceHistory');

/**
 * The class that builds application menu per the OS and handles the differences.
 * Also works with the ApplicationUpdated module to add support for the update process.
 */
export class ApplicationMenu extends EventEmitter {
  /**
   * @param {ApplicationUpdater} updateStatus The instance of the update status class
   */
  constructor(updateStatus) {
    super();
    this.topMenu = new Menu();
    this.history = new WorkspaceHistory();
    this.menuLoaded = false;
    this.us = updateStatus;

    this.us.on('status-changed', this.updateStatusHandler.bind(this));
    this[workspaceHistoryAction] = this[workspaceHistoryAction].bind(this);
  }

  /**
   * Builds and sets the application menu.
   * @return {Promise<void>} Resolved when the application menu is created.
   */
  async build() {
    logger.debug('Building application menu from a template...');
    try {
      const template = await this.getTemplate();
      this.createFromTemplate(template);
      this.menuLoaded = true;
      Menu.setApplicationMenu(this.topMenu);
      logger.debug('Application menu is now set.');
    } catch (cause) {
      this.menuLoaded = false;
      const message = 'Menu template file was not found.';
      logger.error(message);
      logger.error(cause);
    }
  }

  /**
   * Gets menu template depending on the platform.
   * @return {Promise<MenuDefinition>} Promise resolved to JS object of menu template
   * definition.
   */
  async getTemplate() {
    const osName = this.platformToName();
    const name = `${osName}.json`;
    const file = path.join(__dirname, '..', 'menus', name);
    logger.debug(`Menu template location: ${file}`);
    return fs.readJson(file);
  }

  /**
   * Returns common names for the platform.
   * @returns {string} Either `darwin`, `win` or `linux`
   */
  platformToName() {
    switch (process.platform) {
      case 'darwin': return process.platform;
      case 'win32': return 'win';
      default: return 'linux';
    }
  }

  /**
   * Creates a menu definition from ARC's internal template.
   * @param {MenuDefinition} template [description]
   */
  createFromTemplate(template) {
    logger.debug('Creating application menu instance');
    this.createMainMenu(template.menu);
  }

  /**
   * Creates application menu.
   * @param {MenuItemDefinition[]} template Menu template model.
   */
  createMainMenu(template) {
    template.forEach((data) => {
      const item = this.createMenuItem(data);
      this.topMenu.append(item);
    });
  }

  /**
   * Creates a menu item from menu definition model.
   * @param {MenuItemDefinition} options Menu item model.
   * @return {MenuItem} Created menu item.
   */
  createMenuItem(options) {
    const init = /** @type {Electron.MenuItemConstructorOptions} */ ({ ...options });
    if (options.command) {
      init.click = this.itemActionHandler.bind(this, options.command);
    }
    if (options.submenu) {
      init.submenu = this.createSubMenu(options.submenu);
    }
    if (options.label === 'VERSION') {
      init.label = `Version: ${app.getVersion()}`;
    }
    return new MenuItem(init);
  }

  /**
   * Creates a sub menu for a menu item.
   * 
   * @param {MenuItemDefinition[]} submenu Menu data model
   * @return {Menu} Menu item to be appended to another menu item.
   */
  createSubMenu(submenu) {
    const menu = new Menu();
    submenu.forEach((item) => menu.append(this.createMenuItem(item)));
    return menu;
  }

  /**
   * Handler for the menu item click event. Emits the `menu-action` event.
   *
   * @param {string} command The command associated with the menu.
   * @param {MenuItem} menuItem Clicked menu item.
   * @param {BrowserWindow} browserWindow Target window.
   */
  itemActionHandler(command, menuItem, browserWindow) {
    logger.info(`Main menu action detected: ${command}`);
    this.emit('menu-action', command, browserWindow);
    this.us.menuActionHandler(command);
  }

  /**
   * Appends an item to the list of workspace history items.
   * @param {string} filePath Location of the workspace file.
   * @return {Promise<void>}
   */
  async appendWorkspaceHistory(filePath) {
    await this.history.addEntry(filePath)
    this[appendHistoryEntry](filePath);
  }

  /**
   * Clears list of workspace history.
   * Persists the state in the settings file.
   * @returns {Promise<void>}
   */
  async clearWorkspaceHistory() {
    await this.history.clearHistory();
    this[clearWorkspaceHistory]();
  }

  /**
   * Loads workspace history list and creates menu entries.
   * @returns {Promise<void>}
   */
  async loadWorkspaceHistory() {
    const entries = await this.history.loadEntries();
    if (!entries) {
      return;
    }
    this[createWorkspaceHistory](entries);
  }

  /**
   * @return {Menu} A reference to workspace history submenu.
   */
  getWorkspaceHistoryMenu() {
    // linux: 5, win: 5, osx: 6
    const index = process.platform === 'darwin' ? 6 : 5;
    const workspaceMenu = this.topMenu.items[index];
    const historyMenu = workspaceMenu.submenu.items[3];
    return historyMenu.submenu;
  }

  /**
   * Appends history entry item to the history menu.
   * 
   * @param {string} filePath A path to the workspace file.
   */
  [appendHistoryEntry](filePath) {
    const menu = this.getWorkspaceHistoryMenu();
    const { items } = menu;
    if (items[2].visible) {
      items[2].visible = false;
    }
    const options = /** @type Electron.MenuItemConstructorOptions */ ({
      label: filePath,
      after: ['no-history-entry'],
      click: this[workspaceHistoryAction],
    });
    const item = new MenuItem(options);
    menu.append(item);
  }

  /**
   * A handler for menu item click action.
   * 
   * @param {MenuItem} menuItem Instance of the menu item
   */
  [workspaceHistoryAction](menuItem) {
    this.emit('open-workspace', menuItem.label);
    this.history.addEntry(menuItem.label);
  }

  /**
   * Removes all workspace history entries from the menu.
   */
  [clearWorkspaceHistory]() {
    const menu = this.getWorkspaceHistoryMenu();
    const items = Array.from(menu.items);
    items.splice(3);
    items[2].visible = true;
    // @ts-ignore
    menu.clear();
    items.forEach((item) => menu.append(item));
    Menu.setApplicationMenu(this.topMenu);
  }

  /**
   * Iterates over the argument and creates menu entries from it.
   * @param {WorkspaceHistoryEntry[]} entries List of history entries.
   */
  [createWorkspaceHistory](entries) {
    entries.forEach((item) => {
      const filePath = item.file;
      // Un-trusted source
      if (typeof filePath !== 'string') {
        return;
      }
      this[appendHistoryEntry](filePath);
    });
  }

  // 
  // Auto updater methods
  // 

  /**
   * Called when update status has changed from auto updated.
   * @param {string} status The current status
   */
  updateStatusHandler(status) {
    if (!this.menuLoaded) {
      return;
    }
    const name = this.platformToName();
    switch (name) {
      case 'darwin': this.updateDarwinMenuUpdater(status); break;
      case 'linux': this.updateLinuxMenuUpdater(status); break;
      case 'win': this.updateWindowsMenuUpdater(status); break;
      default:
    }
  }

  /**
   * Updates the menu for the darwin platform menu.
   * 
   * @param {string} status The current status
   */
  updateDarwinMenuUpdater(status) {
    const items = this.topMenu.items[0].submenu;
    this.updateUpdaterStatus(status, items.items, 2);
  }

  /**
   * Updates the menu for the linux platform menu.
   * 
   * @param {string} status The current status
   */
  updateLinuxMenuUpdater(status) {
    const { length } = this.topMenu.items;
    const items = this.topMenu.items[length - 1].submenu;
    this.updateUpdaterStatus(status, items.items, 3);
  }

  /**
   * Updates the menu for the linux platform menu.
   * 
   * @param {string} status The current status
   */
  updateWindowsMenuUpdater(status) {
    const { length } = this.topMenu.items;
    const items = this.topMenu.items[length - 1].submenu;
    this.updateUpdaterStatus(status, items.items, 1);
  }

  /**
   * @param {string} status The current updater status
   * @param {MenuItem[]} items The menu items containing the update status items
   * @param {number} index The starting index where the updater menu items are located.
   */
  updateUpdaterStatus(status, items, index) {
    items[index].visible = status === 'update-downloaded';
    items[index + 1].visible = status === 'not-available';
    items[index + 2].visible = status === 'checking-for-update';
    items[index + 3].visible = status === 'download-progress';
  }
}
