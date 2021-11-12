import { PlatformBindings, EventTypes, Events } from '../../../web_modules/index.js';

/** @typedef {import('@advanced-rest-client/events').Config.ARCConfig} ARCConfig */
/** @typedef {import('@advanced-rest-client/events').ConfigStateUpdateEvent} ConfigStateUpdateEvent */
/** @typedef {import('@advanced-rest-client/base').VariablesSuggestionsElement} VariablesSuggestionsElement */

export class ContextActionBindings extends PlatformBindings {
  constructor() {
    super();
    this.systemVariablesEnabled = false;
  }

  async initialize() {
    let settings = /** @type ARCConfig */ ({});
    try {
      settings = (await Events.Config.readAll(document.body)) || {};
    } catch (e) {
      // ...
    }
    if (settings.request && typeof settings.request.useSystemVariables === 'boolean') {
      this.systemVariablesEnabled = settings.request.useSystemVariables;
    }
    ArcEnvironment.ipc.send('window-context-menu-init');
    ArcEnvironment.ipc.on('run-context-action', (e, action, ...args) => { 
      this.runContextAction(action, ...args) 
    });
    window.addEventListener(EventTypes.Config.State.update, this.configStateChangeHandler.bind(this));
  }

  /**
   * @param {string} action
   * @param {...any} args
   */
   runContextAction(action, ...args) {
    switch (action) {
      case 'insert-variable': this.renderVariablesSuggestions(args[0], args[1]); break;
      default: ArcEnvironment.logger.error(`Unhandled action: ${action}`);
    }
  }

  /**
   * @returns {Element|undefined}
   */
  getShadowActiveElement() {
    let current = document.activeElement;
    if (!current) {
      return undefined;
    }
    const guard = true;
    while (guard) {
      if (current.shadowRoot && current.shadowRoot.activeElement) {
        current = current.shadowRoot.activeElement;
      } else {
        break;
      }
    }
    return current;
  }

  /**
   * Renders variables suggestions on an input element.
   * It checks the document's active element for the target input.
   * If the active element is not an input then it does nothing.
   * 
   * @param {number} x
   * @param {number} y
   */
  renderVariablesSuggestions(x, y) {
    const target = this.getShadowActiveElement();
    if (!target || target.localName !== 'input') {
      return;
    }
    let list = /** @type VariablesSuggestionsElement */ (document.querySelector('variables-suggestions'));
    if (!list) {
      list = /** @type VariablesSuggestionsElement */ (document.createElement('variables-suggestions'));
      list.systemVariablesEnabled = this.systemVariablesEnabled;
      list.systemVariables = process.env;
      document.body.appendChild(list);
    }
    list.input = /** @type HTMLInputElement */ (target);
    list.style.top = `${y}px`;
    list.style.left = `${x}px`;
    list.opened = true;
  }

  /**
   * @param {ConfigStateUpdateEvent} e
   */
  configStateChangeHandler(e) {
    const { key, value } = e.detail;
    if (key === 'request.useSystemVariables') {
      this.systemVariablesEnabled = value;
      const list = /** @type VariablesSuggestionsElement */ (document.querySelector('variables-suggestions'));
      if (list) {
        list.systemVariablesEnabled = value;
        list.systemVariables = process.env;
      }
    }
  }
}
