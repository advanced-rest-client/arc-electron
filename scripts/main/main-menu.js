const EventEmitter = require('events');
const {app, Menu, MenuItem} = require('electron');
const fs = require('fs-extra');
const path = require('path');
const log = require('./logger');
const {WorkspaceHistory} = require('./models/workspace-history.js');

/**
 * A module to handle app menu actions
 */
class ArcMainMenu extends EventEmitter {
  /**
   * @constructor
   */
  constructor() {
    super();
    this.topMenu = new Menu();
    this.history = new WorkspaceHistory();

    this._workspaceHistoryAction = this._workspaceHistoryAction.bind(this);
  }
  /**
   * Builds and sets the application menu.
   * @return {Promise} Resolved when menu is created.
   */
  build() {
    log.info('Building application menu from template');
    return this._getTemplate()
    .then((template) => this._createFromTemplate(template))
    .then(() => this._menuLoaded = true)
    .then(() => Menu.setApplicationMenu(this.topMenu))
    .then(() => {
      log.info('Application menu is now set.');
      if (!this.pendingActions) {
        return;
      }
      this.pendingActions.forEach((item) => {
        this[item]();
      });
    })
    .catch((cause) => {
      this._menuLoaded = false;
      let message = 'Menu template file was not found.';
      console.error(message);
      console.error(cause);
      log.error(message);
      log.error(cause);
    });
  }
  /**
   * Called when update status has changed from auto updated.
   * @param {Object} status Data associated with the event.
   * First item in the array is event type. Resto of items are avent arguments.
   */
  updateStatusChnaged(status) {
    if (!this._menuLoaded) {
      return;
    }
    const name = this._platformToName(process.platform);
    this['_' + name + 'UpdateStatusChnaged'](status);
  }
  /**
   * Handles Darwin update status change.
   * @param {Object} status Data associated with the event.
   * First item in the array is event type. Resto of items are avent arguments.
   */
  _darwinUpdateStatusChnaged(status) {
    let items = this.topMenu.items[0].submenu;
    switch (status) {
      case 'checking-for-update':
        items.items[2].visible = false;
        items.items[3].visible = false;
        items.items[4].visible = true;
        items.items[5].visible = false;
        break;
      case 'download-progress':
        items.items[2].visible = false;
        items.items[3].visible = false;
        items.items[4].visible = false;
        items.items[5].visible = true;
        break;
      case 'not-available':
        items.items[2].visible = false;
        items.items[3].visible = true;
        items.items[4].visible = false;
        items.items[5].visible = false;
        break;
      case 'update-downloaded':
        items.items[2].visible = true;
        items.items[3].visible = false;
        items.items[4].visible = false;
        items.items[5].visible = false;
        break;
    }
  }
  /**
   * Handles Windows update status change.
   * @param {Object} status Data associated with the event.
   * First item in the array is event type. Resto of items are avent arguments.
   */
  _winUpdateStatusChnaged(status) {
    let items = this.topMenu.items[6].submenu;
    switch (status) {
      case 'checking-for-update':
        items.items[1].visible = false;
        items.items[2].visible = false;
        items.items[3].visible = true;
        items.items[4].visible = false;
        break;
      case 'download-progress':
        items.items[1].visible = false;
        items.items[2].visible = false;
        items.items[3].visible = false;
        items.items[4].visible = true;
        break;
      case 'not-available':
        items.items[1].visible = false;
        items.items[2].visible = true;
        items.items[3].visible = false;
        items.items[4].visible = false;
        break;
      case 'update-downloaded':
        items.items[1].visible = true;
        items.items[2].visible = false;
        items.items[3].visible = false;
        items.items[4].visible = false;
        break;
    }
  }
  /**
   * Handles Linux update status change.
   * @param {Object} status Data associated with the event.
   * First item in the array is event type. Resto of items are avent arguments.
   */
  _linuxUpdateStatusChnaged(status) {
    const items = this.topMenu.items[6].submenu;
    switch (status) {
      case 'checking-for-update':
        items.items[3].visible = false;
        items.items[4].visible = false;
        items.items[5].visible = true;
        items.items[6].visible = false;
        break;
      case 'download-progress':
        items.items[3].visible = false;
        items.items[4].visible = false;
        items.items[5].visible = false;
        items.items[6].visible = true;
        break;
      case 'not-available':
        items.items[3].visible = false;
        items.items[4].visible = true;
        items.items[5].visible = false;
        items.items[6].visible = false;
        break;
      case 'update-downloaded':
        items.items[3].visible = true;
        items.items[4].visible = false;
        items.items[5].visible = false;
        items.items[6].visible = false;
        break;
    }
  }
  /**
   * Handler for the menu item click event. Emmits `menu-action`.
   *
   * @param {String} command Command associated with the menu.
   * @param {Object} menuItem Clicked menu item.
   * @param {BrowserWindow} browserWindow Target window.
   */
  _itemAction(command, menuItem, browserWindow) {
    log.info('Main menu action detected: ' + command);
    this.emit('menu-action', command, browserWindow);
  }
  /**
   * Creates a menu definition from ARC's internal template.
   * @param {[type]} template [description]
   */
  _createFromTemplate(template) {
    log.info('Creating menu instance');
    this._createMainMenu(template.menu);
    // TODO: Context menus.
  }
  /**
   * Creates application menu.
   * @param {Array} template Menu template model.
   */
  _createMainMenu(template) {
    template.forEach((data) => {
      const item = this._createMenuItem(data);
      this.topMenu.append(item);
    });
  }
  /**
   * Creates a menu item from menu definition model.
   * @param {Object} options Menu item model.
   * @return {MenuItem} Created menu item.
   */
  _createMenuItem(options) {
    if (options.command) {
      options.click = this._itemAction.bind(this, options.command);
      delete options.command;
    }
    if (options.submenu) {
      options.submenu = this._createSubMenu(options.submenu);
    }
    if (options.label === 'VERSION') {
      options.label = 'Version: ' + app.getVersion();
    }
    return new MenuItem(options);
  }
  /**
   * Creates a sub mennu for menu item.
   * @param {Array} submenu Menu data model
   * @return {Menu} Menu item to be appended to another menu item.
   */
  _createSubMenu(submenu) {
    const menu = new Menu();
    submenu.forEach((item) => menu.append(this._createMenuItem(item)));
    return menu;
  }
  /**
   * Gets menu template depending on the platform.
   * @return {Promise} Promise resolved to JS object of menu template
   * definition.
   */
  _getTemplate() {
    const name = this._platformToName(process.platform) + '.json';
    const file = path.join(__dirname, '..', '..', 'menus', name);
    log.info('Menu template location', file);
    return fs.readJson(file);
  }
  /**
   * Returns common names for the platform.
   * @return {String} Either `darwin`, `win` or `linux`
   */
  _platformToName() {
    switch (process.platform) {
      case 'darwin': return process.platform;
      case 'win32': return 'win';
      default: return 'linux';
    }
  }
  /**
   * @return {Array<MenuItem>} List of menu items representing (in order)
   * separator and popup menu item.
   */
  getPopupMenuItem() {
    let i;
    let j;
    switch (process.platform) {
      case 'darwin':
        i = 4;
        j = 5;
        break;
      case 'win32':
        i = 3;
        j = 4;
        break;
      default:
        i = 3;
        j = 4;
    }
    const menu = this.topMenu.items[i];
    if (!menu) {
      return;
    }
    const items = menu.submenu.items;
    return [items[j], items[j + 1]];
  }

  enableAppMenuPopup() {
    const items = this.getPopupMenuItem();
    if (!items) {
      if (!this.pendingActions) {
        this.pendingActions = [];
      }
      this.pendingActions.push('enableAppMenuPopup');
      return;
    }
    items[0].visible = true;
    items[1].visible = true;
  }

  disableAppMenuPopup() {
    const items = this.getPopupMenuItem();
    if (!items) {
      if (!this.pendingActions) {
        this.pendingActions = [];
      }
      this.pendingActions.push('disableAppMenuPopup');
      return;
    }
    items[0].visible = false;
    items[1].visible = false;
  }
  /**
   * Appends an item to the list of workspace history items.
   * @param {String} filePath Location of the workspace file.
   * @return {Promise}
   */
  appendWorkspaceHistory(filePath) {
    return this.history.addEntry(filePath)
    .then(() => this._appendHistoryEntry(filePath));
  }
  /**
   * Clears list of workspace history.
   * Persists the state in the settings file.
   * @return {Promise}
   */
  clearWorkspaceHistory() {
    return this.history.clearHistory()
    .then(() => this._clearWorkspaceHistory());
  }
  /**
   * Loads workspace history list and creates menu entries.
   * @return {Promise}
   */
  loadWorkspaceHistory() {
    return this.history.loadEntries()
    .then((entries) => {
      if (!entries) {
        return;
      }
      return this._createWorkspaceHistory(entries);
    });
  }
  /**
   * Iterates over the argument and creates menu entries from it.
   * @param {Array<String>} entries List of history entries.
   */
  _createWorkspaceHistory(entries) {
    for (let i = 0, len = entries.length; i < len; i++) {
      const filePath = entries[i].file;
      // Untrusted source
      if (typeof filePath !== 'string') {
        continue;
      }
      this._appendHistoryEntry(filePath);
    }
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
   * @param {String} filePath A path to the workspace file.
   */
  _appendHistoryEntry(filePath) {
    const menu = this.getWorkspaceHistoryMenu();
    const items = menu.items;
    if (items[2].visible) {
      items[2].visible = false;
    }
    const options = {
      label: filePath,
      after: 'no-history-entry',
      click: this._workspaceHistoryAction
    };
    const item = new MenuItem(options);
    menu.append(item);
  }
  /**
   * A handler for menu item click action.
   * @param {MenuItem} menuItem Instance of the menu item
   */
  _workspaceHistoryAction(menuItem) {
    this.emit('open-workspace', menuItem.label);
    this.history.addEntry(menuItem.label);
  }
  /**
   * Removes all workspace history entries from the menu.
   */
  _clearWorkspaceHistory() {
    const menu = this.getWorkspaceHistoryMenu();
    const items = Array.from(menu.items);
    menu.clear();
    if (!items[2].visible) {
      items[2].visible = true;
    }
    for (let i = 0; i < 3; i++) {
      menu.append(items[i]);
    }
  }
}
exports.ArcMainMenu = ArcMainMenu;
