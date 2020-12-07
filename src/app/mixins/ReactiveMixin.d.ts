export declare const setObservableProperty: unique symbol;

declare function ReactiveMixin<T extends new (...args: any[]) => {}>(base: T): T & ReactiveMixinConstructor;
interface ReactiveMixinConstructor {
  new(...args: any[]): ReactiveMixin;
}

/**
 * Adds methods to register reactive properties, the properties 
 * that trigger the `render()` function once changed.
 * 
 * Use the `initObservableProperties()` function that accepts a list 
 * of properties set on the base class that once set triggers the render function. The setter checks
 * whether the a value actually changed. It works well for primitives but it won't work as expected
 * for complex types.
 * 
 * ## Example
 * 
 * ```javascript
 * constructor() {
 *   super();
 *   this.initObservableProperties('prop1', 'prop2', 'prop3');
 *   this.prop1 = 'test'; // <- this triggers the render() function
 * }
 * ```
 *
 * @mixin
 */
declare interface ReactiveMixin {
  /**
   * Creates setters and getters to properties defined in the passed list of properties.
   * Property setter will trigger render function.
   *
   * @param props List of properties to initialize.
   */
  initObservableProperties(...props: string[]): void;

  [setObservableProperty](prop: string, value: any): void;

  /**
   * The main render function. This is to be implemented by the mixin consumer.
   */
  render(): void;
}

export {ReactiveMixinConstructor};
export {ReactiveMixin};