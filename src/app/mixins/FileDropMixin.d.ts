import { TemplateResult } from "lit-html";

export declare const dragEnterHandler: unique symbol;
export declare const dragLeaveHandler: unique symbol;
export declare const dragOverHandler: unique symbol;
export declare const dropHandler: unique symbol;

declare function FileDropMixin<T extends new (...args: any[]) => {}>(base: T): T & FileDropMixinConstructor;
interface FileDropMixinConstructor {
  new(...args: any[]): FileDropMixin;
}

/**
 * Adds methods to accept files via drag and drop.
 * The mixin register the dnd events on the body element. When an object is dragged over the window it adds
 * this `drop-target` class to the `body` element.
 * 
 * The mixin also assumes that when the `drop-target` is set then the `drop-info` overlay is rendered.
 * However, it does not change the logic if the element is not in the DOM.
 * Use the provided `dropTargetTemplate()` function to generate template for the drag info.
 * 
 * The class implementing this mixin should override the `processDroppedFiles(files)`  method
 * to process the incoming files.
 *
 * @mixin
 */
declare interface FileDropMixin {
  /**
   * Processes dropped to the page files
   * @param files The list of dropped files
   */
  processDroppedFiles(files: FileList): Promise<void>;
  /**
   * @return The template for the drop file message
   */
  dropTargetTemplate(): TemplateResult;

  [dragEnterHandler](e: DragEvent): void;

  [dragLeaveHandler](e: DragEvent): void;

  [dragOverHandler](e: DragEvent): void;

  [dropHandler](e: DragEvent): void;
}

export {FileDropMixinConstructor};
export {FileDropMixin};