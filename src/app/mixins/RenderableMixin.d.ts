import { TemplateResult } from 'lit-html/lit-html.js';

export declare const renderingValue: unique symbol;
export declare const renderPage: unique symbol;

declare function RenderableMixin<T extends new (...args: any[]) => {}>(base: T): T & RenderableMixinConstructor;
interface RenderableMixinConstructor {
  new(...args: any[]): RenderableMixin;
}

/**
 * Adds methods that helps with asynchronous template rendering.
 *
 * @mixin
 */
declare interface RenderableMixin {
  /** 
   * True when rendering debouncer is running.
   */
  readonly rendering: boolean;

  [renderingValue]: boolean;
  firstRendered: boolean;

  /** 
   * A promise resolved when the render finished.
   */
  updateComplete: Promise<void>;

  /**
   * Helper function to be overridden by child classes. It is called when the view
   * is rendered for the first time.
   */
  firstRender(): void;

  /**
   * This to be used by the child classes to render page template.
   * @returns {} Application page template
   */
  appTemplate(): TemplateResult;

  /**
   * The main render function. Sub classes should not override this method.
   * Override `[renderPage]()` instead.
   *
   * The function calls `[renderPage]()` in a micro task so it is safe to call this
   * multiple time in the same event loop.
   */
  render(): void;

  [renderPage](): void;
}

export {RenderableMixinConstructor};
export {RenderableMixin};