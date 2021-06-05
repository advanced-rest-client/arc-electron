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

  // /**
  //  * Maps an element to an internal target name. This should be overridden by the implementation.
  //  *
  //  * @param {HTMLElement|SVGElement} element The context click target
  //  * @returns {string|undefined} The internal target name.
  //  */
  // elementToTarget(element) {
  //   if (element === this.workspace) {
  //     return 'root';
  //   }
  //   return undefined;
  // }
}
