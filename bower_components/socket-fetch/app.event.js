(function() {
  'use strict';
  /*******************************************************************************
   * Copyright 2016 Pawel Psztyc, The ARC team
   *
   * Licensed under the Apache License, Version 2.0 (the "License"); you may not
   * use this file except in compliance with the License. You may obtain a copy of
   * the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
   * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
   * License for the specific language governing permissions and limitations under
   * the License.
   ******************************************************************************/
  /**
   * EventTarget is an interface implemented by objects that can receive events and may have
   * listeners for them.
   */
  class ArcEventTarget {
    /**
     *
     * @constructor
     */
    constructor() {
      /**
       * A list of events registered by this {@link ArcEventTarget}
       */
      this.events = new Map();
    }
    /**
     * Register an event handler of a specific event type on the {@link ArcEventTarget}.
     *
     * @property {String} type A string representing the event type to listen for.
     * @property {Function} listener The object that receives a notification when an event of the
     * specified type occurs. This must be a JavaScript function.
     */
    addEventListener(type, listener) {
      if (typeof type !== 'string') {
        throw new TypeError('Type must be a string.');
      }
      if (typeof listener !== 'function') {
        throw new TypeError('listener must be a function.');
      }
      if (!this.events.has(type)) {
        this.events.set(type, new Set());
      }
      var set = this.events.get(type);
      if (set.has(listener)) {
        console.warn('Listener for type %s is already registered.', type);
        return;
      }
      set.add(listener);
    }
    /**
     * Removes the event listener previously registered with
     * {@link EventTarget.addEventListener()}.
     *
     * @property {String} type A string representing the event type to remove.
     * @property {Function} listener The EventListener function to remove from the event target.
     */
    removeEventListener(type, listener) {
      if (typeof type !== 'string') {
        throw new TypeError('Type must be a string.');
      }
      if (typeof listener !== 'function') {
        throw new TypeError('listener must be a function.');
      }
      if (!this.events.has(type)) {
        console.warn('Type %s is not registered.', type);
        return;
      }
      var set = this.events.get(type);
      if (!set.has(listener)) {
        console.warn('Listener for type %s wasn\'t registered.', type);
        return;
      }
      set.delete(listener);
    }
    /**
     * Dispatches an Event at the specified EventTarget, invoking the affected EventListeners
     * in the appropriate order.
     *
     * @param {Event} event An event to be dispatched.
     * @return {Boolean} true if the event  
     */
    dispatchEvent(event) {
      var type = event.type;
      var cancelable = event.cancelable;
      if (!type) {
        throw new TypeError('Argument is not a valid event.');
      }
      if (!this.events.has(type)) {
        return false;
      }
      var set = this.events.get(type);
      for (let listener of set) {
        try {
          listener(event);
          if (cancelable && event.defaultPrevented) {
            return true;
          }
        } catch (e) {
          console.error(e);
        }
      }
      return false;
    }
  }

  class ArcEventSource extends ArcEventTarget {
    constructor() {
      super();
      /**
       * A DOMString representing the URL of the source.
       *
       * @type {String}
       */
      this._url = undefined;
      /**
       * An unsigned short representing the state of the connection.
       * Possible values are CONNECTING (0), OPEN (1), or CLOSED (2).
       *
       * @type {Number}
       */
      this._readyState = undefined;
    }
    /**
     * A DOMString representing the URL of the source.
     *
     * @type {String}
     */
    get url() {
      return this._url;
    }
    /**
     * An unsigned short representing the state of the connection.
     *
     * @type {Number}
     */
    get readyState() {
      return this._readyState;
    }
    /**
     * Sets a listener for open event.
     *
     * @param {Function} listener A function to be called
     */
    set onopen(listener) {
      this._onopen = listener;
      if (this._onopen) {
        this.removeEventListener('open', this._onopen);
      }
      this.addEventListener('open', listener);
    }
    /**
     * Is an EventHandler being called when an open event is received, that is when the
     * connection was just opened.
     *
     * @type {Function}
     */
    get onopen() {
      return this._onopen;
    }
    /**
     * Sets a listener for message event.
     *
     * @param {Function} listener A function to be called
     */
    set onmessage(listener) {
      this._onmessage = listener;
      if (this._onmessage) {
        this.removeEventListener('message', this._onmessage);
      }
      this.addEventListener('message', listener);
    }
    /**
     * Is an EventHandler being called when a message event is received, that is when a message
     * is coming from the source.
     *
     * @type {Function}
     */
    get onmessage() {
      return this._onmessage;
    }
    /**
     * Sets a listener for error event.
     *
     * @param {Function} listener A function to be called
     */
    set onerror(listener) {
      this._onerror = listener;
      if (this._onerror) {
        this.removeEventListener('error', this._onerror);
      }
      this.addEventListener('error', listener);
    }
    /**
     * Is an EventHandler being called when an error occurs and the error event is dispatched
     * on this object.
     *
     * @type {Function}
     */
    get onerror() {
      return this._onerror;
    }
  }
  window.ArcEventTarget = ArcEventTarget;
  window.ArcEventSource = ArcEventSource;
})();
