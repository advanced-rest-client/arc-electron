/** @typedef {import('./ContextMenu').ContextMenu} ContextMenu */

export class ContextMenuStore {
  /**
   * Store's cache object when the menu items keeps their data.
   * @type {Map<string, any>}
   */
  #cache = new Map();

  /**
   * The context menu instance.
   */
  #menu;

  /**
   * @param {ContextMenu} targetMenu The instance of the context menu that has this store.
   */
  constructor(targetMenu) {
    this.#menu = targetMenu;
  }

  /**
   * Sets a value in the store.
   *
   * @param {string} key The key under which to store the value
   * @param value {any} The value to store.
   * @returns {void}
   */
  set(key, value) {
    this.#cache.set(key, value);
  }

  /**
   * Reads a value from the state store.
   *
   * @param {string} key The key under which the value exists
   * @returns {any|undefined} Stored value or undefined if not set.
   */
  get(key) {
    return this.#cache.get(key);
  }

  /**
   * Removes a value from the store.
   *
   * @param {string} key The key under which the value exists
   * @returns {void}
   */
  delete(key) {
    this.#cache.delete(key);
  }
}
