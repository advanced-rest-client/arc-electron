import '../../../../web_modules/@anypoint-web-components/anypoint-listbox/anypoint-listbox.js';
import '../../../../web_modules/@anypoint-web-components/anypoint-item/anypoint-icon-item.js';
import '../../../../web_modules/@advanced-rest-client/arc-icons/arc-icon.js';
import { ContextMenuStore } from './ContextMenuStore.js';

/** @typedef {import('./interfaces').RegisteredCommand} RegisteredCommand */
/** @typedef {import('./interfaces').ClickVector} ClickVector */
/** @typedef {import('./interfaces').ContextMenuCommand} ContextMenuCommand */
/** @typedef {import('./interfaces').ExecuteOptions} ExecuteOptions */

let index = 0;

/**
 * A plugin that adds content menu support to the visualization workspace.
 * 
 * This is a base class and by its own it has no commands registered. Override this class
 * to register own commands with the `registerCommand()` function. Child class must also
 * override the `elementToTarget()` that translates click target to a registered in the commands 
 * name. Each command has the `target` that is used to recognize which command should be rendered.
 * 
 * After the visualization workspace is initialized create an instance of this class
 * and call `connect()` to register event listener. After the workspace is no longer rendered 
 * or when context change, call `disconnect()` to clean up listeners.
 */
export class ContextMenu {
  #connectedValue = false;

  /**
   * @returns {boolean} True when the plug-in is listening for the input events.
   */
  get connected() {
    return this.#connectedValue;
  }

  /**
   * The root target of this context menu
   * @type {HTMLElement}
   */
  workspace;

  /**
   * A reference to the store initialized with this context menu
   * @type {ContextMenuStore}
   */
  store;

  /**
   * List of registered commands.
   * @type {RegisteredCommand[]}
   */
  commands = [];

  /**
   * @type {RegisteredCommand[]}
   */
  currentCommands = undefined;

  /**
   * @type {(HTMLElement|SVGElement)}
   */
  currentTarget = undefined;
  
  /**
   * @type {HTMLDivElement}
   */
  currentMenu = undefined;

  /**
   * @type {ClickVector}
   */
  targetVector = undefined;

  /** 
   * @type {((args: ExecuteOptions) => void)}
   */
  #callback = undefined;

  /**
   * @param {HTMLElement} workspace The root element that is the click handler
   */
  constructor(workspace) {
    this.workspace = workspace;
    this.store = new ContextMenuStore(this);
    this.contextHandler = this.contextHandler.bind(this);
    this.menuClickHandler = this.menuClickHandler.bind(this);
    this.clickHandler = this.clickHandler.bind(this);
    this.keydownHandler = this.keydownHandler.bind(this);
  }

  /**
   * Registers a callback function to be called when a menu item is activated.
   * This function is only called when the `execute` function is not defined on the action and the `command` property is set.
   * @param {((args: ExecuteOptions) => void)} callback The function with the value of the `command` property of the action.
   */
  registerCallback(callback) {
    this.#callback = callback;
  }

  /**
   * Starts listening on user events
   * @returns {void}
   */
  connect() {
    this.workspace.addEventListener('contextmenu', this.contextHandler);
    window.addEventListener('click', this.clickHandler);
    window.addEventListener('keydown', this.keydownHandler);
    this.connectedValue = true;
  }

  /**
   * Cleans up the listeners
   * @returns {void}
   */
  disconnect() {
    this.workspace.removeEventListener('contextmenu', this.contextHandler);
    window.removeEventListener('click', this.clickHandler);
    window.removeEventListener('keydown', this.keydownHandler);
    this.connectedValue = false;
  }

  /**
   * Handler for the context menu event.
   * @param {MouseEvent} e 
   * @returns {void}
   */
  contextHandler(e) {
    this.destroy();
    const target = this.findTarget(e);
    if (!target) {
      return;
    }
    
    // since the context menu has fixed position it doesn't matter what the context 
    // is as the menu is rendered over all element.
    // The `readClickPosition()` is used to determine click target for the commands.
    const clickVector = {
      x: e.clientX, 
      y: e.clientY,
    }
    const targetVector = this.readClickPosition(e);
    this.build(e, target, clickVector, targetVector);
  }

  /**
   * Reads {x,y} vector of the click from the pointer event.
   * @param {MouseEvent} e
   * @returns {ClickVector}
   */
  readClickPosition(e) {
    return {
      x: e.clientX, 
      y: e.clientY,
    }
  }

  /**
   * Finds the click target from the event
   * @param {MouseEvent} e
   * @returns {HTMLElement|SVGElement|undefined}
   */
  findTarget(e) {
    const target = e.composedPath()[0];
    return /** @type HTMLElement|SVGElement|undefined */ (target);
  }

  /**
   * Builds a menu for a specific target.
   *
   * @param {MouseEvent} e 
   * @param {HTMLElement|SVGElement} target The element that triggered the menu
   * @param {ClickVector} placementVector
   * @param {ClickVector} targetVector
   * @returns {void}
   */
  build(e, target, placementVector, targetVector) {
    const commands = this.listCommands(target);
    if (!commands.length) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    this.targetVector = targetVector;
    const groups = this.groupCommands(commands);
    this.currentCommands = commands;
    this.currentTarget = target;
    this.render(target, placementVector, groups);
    target.setAttribute('active', '');
  }

  /**
   * @param {HTMLElement|SVGElement} target The element that triggered the menu
   * @param {ClickVector} vector The canvas position of where to place the menu.
   * @param {RegisteredCommand[][]} groups The commands render
   * @returns {void}
   */
  render(target, vector, groups) {
    const root = this.createContainer();
    const box = root.querySelector('anypoint-listbox');
    const size = groups.length;
    groups.forEach((commands, i) => {
      commands.forEach((command) => {
        const item = this.createCommandItem(command, target);
        box.append(item);
      });
      if (i + 1 !== size) {
        box.append(this.createCommandDivider());
      }
    });
    this.currentMenu = root;
    root.style.top = `${vector.y}px`;
    root.style.left = `${vector.x}px`;
    const { workspace } = this;
    if (workspace.shadowRoot) {
      this.workspace.shadowRoot.append(root);
    } else {
      this.workspace.append(root);
    }
  }

  /**
   * Removes currently rendered menu.
   * @returns {void}
   */
  destroy() {
    if (!this.currentMenu) {
      return;
    }
    const items = /** @type NodeListOf<HTMLDivElement> */ (this.currentMenu.querySelectorAll('.item'));
    items.forEach((item) => item.removeEventListener('click', this.menuClickHandler));
    this.currentTarget.removeAttribute('active');
    
    this.currentCommands = undefined;
    this.currentTarget = undefined;
    this.targetVector = undefined;

    const { workspace } = this;
    if (workspace.shadowRoot) {
      this.workspace.shadowRoot.removeChild(this.currentMenu);
    } else {
      this.workspace.removeChild(this.currentMenu);
    }
    this.currentMenu = undefined;
  }

  /**
   * Maps an element to an internal target name. This should be overridden by the implementation.
   *
   * @param {HTMLElement|SVGElement} element The context click target
   * @returns {string|undefined} The internal target name.
   */
  elementToTarget(element) {
    if (element === this.workspace) {
      return 'root';
    }
    return undefined;
  }

  /**
   * Registers multiple commands in a batch call.
   * @param {ContextMenuCommand[]} commands The list of commands to register
   * @returns {void}
   */
  registerCommands(commands) {
    commands.forEach((command) => this.registerCommand(command));
  }

  /**
   * Registers a new command in the context menu.
   * @param {ContextMenuCommand} command
   * @returns {void}
   */
  registerCommand(command) {
    index += 1;
    const cmd = { ...command, id: index };
    this.commands.push(cmd);
  }

  /**
   * Lists all commands that matches the target.
   *
   * @param {HTMLElement|SVGElement} target The build target
   * @returns {RegisteredCommand[]}
   */
  listCommands(target) {
    const { commands } = this;
    const result =/** @type RegisteredCommand[] */ ([]);
    commands.forEach((cmd) => {
      if (cmd.selector === '*' || target.matches(cmd.selector)) {
        result.push(cmd);
      }
    });
    return result;
  }

  /**
   * Creates an ordered grouped list of commands
   *
   * @param {RegisteredCommand[]} commands The commands to group
   * @returns {RegisteredCommand[][]} Ordered list of grouped commands.
   */
  groupCommands(commands) {
    const main = /** @type RegisteredCommand[] */ ([]);
    const tmp = /** @type Map<string, RegisteredCommand[]> */ (new Map());
    commands.forEach((cmd) => {
      const { group } = cmd;
      if (!group || group === 'main') {
        main.push(cmd);
      } else {
        if (!tmp.has(group)) {
          tmp.set(group, []);
        }
        tmp.get(group).push(cmd);
      }
    });
    const result = /** @type RegisteredCommand[][] */ ([]);
    if (main.length) {
      result.push(main);
    }
    for (const item of tmp) {
      result.push(item[1]);
    }
    return result;
  }

  /**
   * @return {HTMLDivElement}
   */
  createContainer() {
    const container = document.createElement('div');
    container.classList.add('context-menu');
    const list = document.createElement('anypoint-listbox');
    list.classList.add('listbox');
    container.append(list);
    return container;
  }

  /**
   * @param {RegisteredCommand} command The command render
   * @param {HTMLElement|SVGElement} target The element that triggered the menu
   * @returns AnypointIconItem
   */
  createCommandItem(command, target) {
    const { label, title, icon, enabled, id } = command;
    const item = document.createElement('anypoint-icon-item');
    item.classList.add('item');
    const labelElement = document.createElement('span');
    let disabled = false;
    if (typeof enabled === 'function') {
      disabled = !enabled({
        store: this.store,
        target, 
        root: this.workspace,
      });
    }
    if (disabled) {
      item.classList.add('disabled');
    }
    if (title) {
      item.title = title;
    }
    if (icon) {
      const mi = this.createIcon(icon);
      item.append(mi);
    } else {
      const mi = document.createElement('div');
      mi.slot = 'item-icon';
      mi.classList.add('menu-icon');
      item.append(mi);
    }
    labelElement.innerText = label;
    item.append(labelElement);
    item.addEventListener('click', this.menuClickHandler);
    item.dataset.cmd = String(id);
    return item;
  }

  /**
   * Creates an icon to be added to the menu item.
   * @param {string} icon
   * @returns {HTMLElement}
   */
  createIcon(icon) {
    const mi = document.createElement('arc-icon');
    // @ts-ignore
    mi.icon = icon;
    mi.slot = 'item-icon';
    mi.classList.add('menu-icon');
    return mi;
  }

  /**
   * Creates the menu items divider.
   * @returns HTMLDivElement
   */
  createCommandDivider() {
    const item = document.createElement('div');
    item.classList.add('menu-divider');
    return item;
  }

  /**
   * Handles the click on the menu item.
   * @param {MouseEvent} e
   * @returns {void}
   */
  menuClickHandler(e) {
    const node = /** @type HTMLElement */ (e.currentTarget);
    const id = Number(node.dataset.cmd);
    if (Number.isNaN(id)) {
      return;
    }
    const { currentCommands, currentTarget, targetVector } = this;
    this.destroy();
    const command = currentCommands.find((item) => item.id === id);
    if (!command) {
      return;
    }
    const opts = {
      store: this.store,
      target: currentTarget, 
      root: this.workspace, 
      vector: targetVector,
      command: command.command,
    };
    if (this.#callback && command.command) {
      this.#callback(opts);
    } else {
      command.execute(opts);
    }
  }

  /**
   * Handles the click event on the document to close the menu is the click
   * is outside the menu.
   * @param {MouseEvent}e 
   * @returns {void}
   */
  clickHandler(e) {
    if (!this.currentMenu || e.defaultPrevented) {
      return;
    }
    const elm = /** @type Element */ (e.target);
    const inside = this.currentMenu.contains(elm);
    if (!inside) {
      this.destroy();
    }
  }

  /**
   * Closes the menu when ESC is pressed
   * @param {KeyboardEvent} e
   * @returns {void}
   */
  keydownHandler(e) {
    if (e.key === 'Escape' && this.currentMenu) {
      this.destroy();
    }
  }
}
