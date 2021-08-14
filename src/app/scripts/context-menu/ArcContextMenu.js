import { ContextMenu } from '../../../../web_modules/@api-client/context-menu/index.js';

export class ArcContextMenu extends ContextMenu {
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
   * Maps an element to an internal target name. This should be overridden by the implementation.
   *
   * @param {HTMLElement|SVGElement} element The context click target
   * @returns {string|undefined} The internal target name.
   */
  elementToTarget(element) {
    const result = super.elementToTarget(element);
    if (!result) {
      return result;
    }
    if (result.startsWith('input') || result.startsWith('textarea')) {
      // this is done so the IO process can manage context menus in input fields.
      // TODO: this all should be manages by the IO to reduce confusion between the 
      // context menu styles.
      return undefined;
    }
    return result;
  }
}
