/* eslint-disable class-methods-use-this */
import { dedupeMixin } from '../../../web_modules/@open-wc/dedupe-mixin/index.js';
import { html } from '../../../web_modules/lit-html/lit-html.js';
import '../../../web_modules/@advanced-rest-client/arc-icons/arc-icon.js';

/** @typedef {import('lit-html').TemplateResult} TemplateResult */

export const dragEnterHandler = Symbol('dragEnterHandler');
export const dragLeaveHandler = Symbol('dragLeaveHandler');
export const dragOverHandler = Symbol('dragOverHandler');
export const dropHandler = Symbol('dropHandler');

/**
 * @param {new (...args: any[]) => any} base
 */
const mxFunction = (base) => {
  class FileDropMixinImpl extends base {
    constructor() {
      super();
      this[dragEnterHandler] = this[dragEnterHandler].bind(this);
      this[dragLeaveHandler] = this[dragLeaveHandler].bind(this);
      this[dragOverHandler] = this[dragOverHandler].bind(this);
      this[dropHandler] = this[dropHandler].bind(this);

      this.dropTargetActive = false;

      document.body.addEventListener('dragenter', this[dragEnterHandler]);
      document.body.addEventListener('dragleave', this[dragLeaveHandler]);
      document.body.addEventListener('dragover', this[dragOverHandler]);
      document.body.addEventListener('drop', this[dropHandler]);
    }

    /**
     * Processes dropped to the page files
     * @param {FileList} files The list of dropped files
     * @abstract This is to be implemented by the platform bindings
     */
    // eslint-disable-next-line no-unused-vars
    async processDroppedFiles(files) {
      // ...
    }

    /**
     * @return {TemplateResult} The template for the drop file message
     */
    dropTargetTemplate() {
      return html`
      <div class="drop-info">
        <arc-icon icon="file" class="drop-icon"></arc-icon>
        <p class="drop-message">Drop the file here</p>
      </div>
      `;
    }

    /**
     * @param {DragEvent} e
     */
    [dragEnterHandler](e) {
      if (![...e.dataTransfer.types].includes('Files')) {
        return;
      }
      e.preventDefault();
      document.body.classList.add('drop-target');
      this.dropTargetActive = true;
      e.dataTransfer.effectAllowed = 'copy';
    }

    /**
     * @param {DragEvent} e
     */
    [dragLeaveHandler](e) {
      if (![...e.dataTransfer.types].includes('Files')) {
        return;
      }
      const node = /** @type HTMLElement */ (e.target);
      if (node.nodeType !== Node.ELEMENT_NODE) {
        return;
      }
      if (node !== document.body && !node.classList.contains('drop-info')) {
        return;
      }
      e.preventDefault();
      document.body.classList.remove('drop-target');
      this.dropTargetActive = false;
    }

    /**
     * @param {DragEvent} e
     */
    [dragOverHandler](e) {
      if (![...e.dataTransfer.types].includes('Files')) {
        return;
      }
      const node = /** @type HTMLElement */ (e.target);
      if (node.nodeType !== Node.ELEMENT_NODE) {
        return;
      }
      if (node !== document.body && !node.classList.contains('drop-info')) {
        return;
      }
      e.preventDefault();
      document.body.classList.add('drop-target');
      this.dropTargetActive = true;
    }

    /**
     * @param {DragEvent} e
     */
    [dropHandler](e) {
      if (![...e.dataTransfer.types].includes('Files')) {
        return;
      }
      e.preventDefault();
      document.body.classList.remove('drop-target');
      this.dropTargetActive = false;
      this.processDroppedFiles(e.dataTransfer.files);
    }
  }
  return FileDropMixinImpl;
}

/**
 * Adds methods to accept files via drag and drop.
 * The mixin register the dnd events on the body element. When an object is dragged over the window it adds
 * this `drop-target` class to the `body` element. Additionally it sets the `dropTargetActive` property.
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
export const FileDropMixin = dedupeMixin(mxFunction);
