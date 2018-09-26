const EventEmitter = require('events');
const {app, Menu, MenuItem} = require('electron');
const fs = require('fs-extra');
const path = require('path');
const log = require('electron-log');
// log.transports.file.level = 'info';

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
  }
  /**
   * Builds and sets the application menu.
   * @return {Promise} Resolved when menu is created.
   */
  build() {
    return this._getTemplate()
    .then((template) => this._createFromTemplate(template))
    .then(() => this._menuLoaded = true)
    .then(() => Menu.setApplicationMenu(this.topMenu))
    .then(() => {
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
    let items = this.topMenu.items[5].submenu;
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
    const items = this.topMenu.items[5].submenu;
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
    this.emit('menu-action', command, browserWindow);
  }
  /**
   * Creates a menu definition from ARC's internal template.
   * @param {[type]} template [description]
   */
  _createFromTemplate(template) {
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
        j = 4;
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
}
exports.ArcMainMenu = ArcMainMenu;
