const EventEmitter = require('events');
const {app, Menu, MenuItem} = require('electron');
const fs = require('fs-extra');
const path = require('path');
const log = require('electron-log');
log.transports.file.level = 'info';

/**
 * A module to handle app menu actions
 */
class ArcMainMenu extends EventEmitter {
  constructor() {
    super();
    this.topMenu = new Menu();
  }

  build() {
    this._getTemplate()
    .then(template => this._createFromTemplate(template))
    .then(() => this._menuLoaded = true)
    .then(() => Menu.setApplicationMenu(this.topMenu))
    .catch(cause => {
      this._menuLoaded = false;
      let message = 'Menu template file was not found.';
      console.error(message);
      console.error(cause);
      log.error(message);
      log.error(cause);
    });
  }

  updateStatusChnaged(status) {
    if (!this._menuLoaded) {
      return;
    }
    var name = this._platformToName(process.platform);
    this['_' + name + 'UpdateStatusChnaged'](status);
  }

  _darwinUpdateStatusChnaged(status) {
    var items = this.topMenu.items[0].submenu;
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

  _winUpdateStatusChnaged(status) {
    var items = this.topMenu.items[3].submenu;
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

  _linuxUpdateStatusChnaged(status) {
    var items = this.topMenu.items[3].submenu;
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

  _itemAction(command, menuItem, browserWindow) {
    this.emit('menu-action', command, browserWindow);
  }

  _createFromTemplate(template) {
    this._createMainMenu(template.menu);
    // TODO: Context menus.
  }

  _createMainMenu(template) {
    template.forEach(data => {
      let item = this._createMenuItem(data);
      this.topMenu.append(item);
    });
  }

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

  _createSubMenu(submenu) {
    const menu = new Menu();
    submenu.forEach(item => menu.append(this._createMenuItem(item)));
    return menu;
  }

  _getTemplate() {
    var name = this._platformToName(process.platform) + '.json';
    var file = path.join(__dirname, '..', 'menus', name);
    return fs.readJson(file);
  }

  _platformToName() {
    switch (process.platform) {
      case 'darwin': return process.platform;
      case 'win32': return 'win';
      default: return 'linux';
    }
  }
}
exports.ArcMainMenu = ArcMainMenu;
