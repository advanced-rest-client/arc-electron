const ipc = require('electron').ipcRenderer;
const log = require('electron-log');
/**
 * A class responsible to render and handle actions related to context menu.
 */
class ArcContextMenu {
  /**
   * @constructor
   */
  constructor() {
    this.contextActions = [];
    this._registerAction = this._registerAction.bind(this);
    this._contextMenuHandler = this._contextMenuHandler.bind(this);
    this._selectionHandler = this._selectionHandler.bind(this);
    this._clickHandler = this._clickHandler.bind(this);
  }
  /**
   * Reference to the main application window.
   *
   * @return {HtmlElement}
   */
  get app() {
    return document.getElementById('app');
  }
  /**
   * Listens for main process and window events.
   */
  listenMainEvents() {
    ipc.on('register-context-action', this._registerAction);
    window.addEventListener('contextmenu', this._contextMenuHandler);
    document.body.addEventListener('click', this._clickHandler);
  }
  /**
   * Handler for `register-context-action` main process event.
   *
   * @param {EventEmitter} e
   * @param {Object} action
   */
  _registerAction(e, action) {
    if (!this._valid(action)) {
      log.warn('Unable to register content action. Not valid', action);
      return;
    }
    this.contextActions.push(action);
  }
  /**
   * Tests if passed action is a valid context action.
   *
   * @param {Object} action
   * @return {Boolean}
   */
  _valid(action) {
    if (!action || !action.label || !action.selector || !action.action) {
      return false;
    }
    return true;
  }
  /**
   * A handler for `contextmenu` event dispatched when the user right click on
   * an element.
   * If the target element matches any selector of registered actions it will
   * be added to the list of results to dropdown menu.
   *
   * @param {MouseEvent} e
   */
  _contextMenuHandler(e) {
    const target = e.composedPath()[0];
    if (!target) {
      return;
    }
    const actions = [];
    for (let i = 0, len = this.contextActions.length; i < len; i++) {
      const data = this.contextActions[i];
      if (target.matches(data.selector)) {
        actions.push(data);
      }
    }
    if (actions.length) {
      this._lastTarget = target;
      this.renderActions(actions, {
        x: e.x,
        y: e.y
      });
    }
  }
  /**
   * Unregisters context action.
   *
   * @param {EventEmitter} e
   * @param {Object} action
   */
  _unregisterContextAction(e, action) {
    if (!this._valid(action)) {
      log.warn('Unable to unregister content action. Not valid', action);
      return;
    }
    const index = this.contextActions.findIndex((item) => {
      return item.selector === action.selector && item.action === action.action;
    });
    if (index === -1) {
      return;
    }
    this.contextActions.splice(index, 1);
  }
  /**
   * Renders context menu actions.
   *
   * @param {Array<Object>} actions List of actions to render
   * @param {Object} xy An object with `x` and `y` coordinates of click.
   */
  renderActions(actions, xy) {
    this.removeActions();
    const box = document.createElement('paper-listbox');
    box.addEventListener('selected-changed', this._selectionHandler);
    actions.forEach((action) => {
      const item = document.createElement('paper-item');
      item.innerText = action.label;
      item.dataset.action = action.action;
      box.appendChild(item);
    });
    this._currentMenu = box;
    this._currentActions = actions;
    box.className = 'arc-context-menu';
    box.style.top = xy.y + 'px';
    box.style.left = xy.x + 'px';
    document.body.appendChild(box);
  }
  /**
   * Removes context menu view from the document.
   */
  removeActions() {
    if (!this._currentMenu) {
      return;
    }
    this._currentMenu.removeEventListener('selected-changed',
      this._selectionHandler);
    document.body.removeChild(this._currentMenu);
    this._currentMenu = undefined;
    this._currentActions = undefined;
  }
  /**
   * Handler for menu selection.
   *
   * @param {CustomEvent} e
   */
  _selectionHandler(e) {
    const action = this._currentActions[e.detail.value];
    this.removeActions();
    if (!action) {
      this._lastTarget = undefined;
      return;
    }
    this._handleAction(action);
  }
  /**
   * Handles application default actions when calling main process is not
   * needed.
   *
   * @param {Object} action Action definition
   */
  _handleAction(action) {
    switch (action.action) {
      case 'request-panel-close-tab':
        this.app.closeWorkspaceTab(this._getTabIndex());
        break;
      case 'request-panel-close-all-tabs':
        this.app.closeAllWorkspaceTabs();
        break;
      case 'request-panel-close-other-tabs':
        this.app.closeOtherWorkspaceTabs(this._getTabIndex());
        break;
      case 'request-panel-duplicate-tab':
        this.app.duplicateWorkspaceTab(this._getTabIndex());
        break;
    }
  }

  _getTabIndex() {
    const tab = this._lastTarget.parentElement;
    return Array.from(tab.parentElement.children).indexOf(tab);
  }
  /**
   * Closes menu action.
   *
   * @param {MouseEvent} e
   */
  _clickHandler(e) {
    const path = e.composedPath();
    let inside = path.some((item) => item === this._currentMenu);
    if (!inside) {
      this.removeActions();
      this._lastTarget = undefined;
    }
  }
}
exports.ArcContextMenu = ArcContextMenu;
