import { dedupeMixin } from '../../../web_modules/@open-wc/dedupe-mixin/index.js';

export const setObservableProperty = Symbol('setObservableProperty');

const valuesMap = new WeakMap();

/**
 * @param {new (...args: any[]) => any} base
 */
const mxFunction = (base) => {
  class ReactiveMixinImpl extends base {
    /**
     * Creates setters and getters to properties defined in the passed list of properties.
     * Property setter will trigger render function.
     *
     * @param {...string} props List of properties to initialize.
     * @returns {void}
     */
    initObservableProperties(...props) {
      props.forEach((item) => {
        Object.defineProperty(this, item, {
          get() {
            const map = valuesMap.get(this);
            return map[item];
          },
          set(newValue) {
            this[setObservableProperty](item, newValue);
          },
          enumerable: true,
          configurable: true,
        });
      });
    }

    /**
     * @param {string} prop
     * @param {any} value
     * @returns {void}
     */
    [setObservableProperty](prop, value) {
      let map = valuesMap.get(this); 
      if (!map) {
        map = {};
        valuesMap.set(this, map);
      }
      if (map[prop] === value) {
        return;
      }
      map[prop] = value;
      this.render();
    }

    /**
     * The main render function. This is to be implemented by the mixin consumer.
     * @returns {void}
     */
    render() {
      // nothing
    }
  }
  return ReactiveMixinImpl;
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
export const ReactiveMixin = dedupeMixin(mxFunction);
