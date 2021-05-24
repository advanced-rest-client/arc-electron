/* eslint-disable class-methods-use-this */
import { dedupeMixin } from '../../../web_modules/@open-wc/dedupe-mixin/index.js';
import { html, render } from '../../../web_modules/lit-html/lit-html.js';

/** @typedef {import('lit-html').TemplateResult} TemplateResult */

export const renderingValue = Symbol('renderingValue');
export const renderPage = Symbol('renderPage');
export const setUpdatePromise = Symbol('setUpdatePromise');
export const updateResolver = Symbol('updateResolver');
export const hasPendingUpdatePromise = Symbol('hasPendingUpdatePromise');
export const resolveUpdatePromise = Symbol('resolveUpdatePromise');

/**
 * @param {new (...args: any[]) => EventTarget} base
 */
const mxFunction = (base) => {
  class RenderableMixin extends base {

    /** 
     * True when rendering debouncer is running.
     */
    get rendering() {
      return this[renderingValue];
    }

    constructor() {
      super();
      /**
       * Determines whether the initial render had run and the `firstRender()`
       * function was called.
       *
       * @type {boolean}
       * @default false
       */
      this.firstRendered = false;
  
      this[renderingValue] = false;

      /** 
       * @type {Promise<void>} A promise resolved when the render finished.
       */
      this.updateComplete = undefined;

      this[setUpdatePromise]();
    }

    /**
     * Helper function to be overridden by child classes. It is called when the view
     * is rendered for the first time.
     */
    firstRender() {
    }

    /**
     * A function called when the template has been rendered
     */
    updated() {}

    /**
     * This to be used by the child classes to render page template.
     * @returns {TemplateResult} Application page template
     */
    appTemplate() {
      return html``;
    }

    /**
     * The main render function. Sub classes should not override this method.
     * Override `[renderPage]()` instead.
     *
     * The function calls `[renderPage]()` in a micro task so it is safe to call this
     * multiple time in the same event loop.
     */
    render() {
      if (this.rendering) {
        return;
      }
      this[renderingValue] = true;
      if (!this[hasPendingUpdatePromise]) {
        this[setUpdatePromise]();
      }
      requestAnimationFrame(() => {
        this[renderingValue] = false;
        this[renderPage]();
      });
    }

    [renderPage]() {
      if (!this.firstRendered) {
        this.firstRendered = true;
        setTimeout(() => this.firstRender());
      }
      render(this.appTemplate(), document.querySelector('#app'), { eventContext: this });
      this[resolveUpdatePromise]();
      this.updated();
    }

    [setUpdatePromise]() {
      this.updateComplete = new Promise((resolve) => {
        this[updateResolver] = resolve;
        this[hasPendingUpdatePromise] = true;
      });
    }

    [resolveUpdatePromise]() {
      if (!this[hasPendingUpdatePromise]) {
        return;
      }
      this[hasPendingUpdatePromise] = false;
      this[updateResolver]();
    }
  }
  return RenderableMixin;
}

/**
 * Adds methods that helps with asynchronous template rendering.
 * 
 * The application page content is rendered into the `#app` container.
 *
 * @mixin
 */
export const RenderableMixin = dedupeMixin(mxFunction);
