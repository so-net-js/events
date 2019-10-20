import utils from '@svjs/utils/src/index';


const MIDDLEWARE_BEFORE = 'mid-before';
const MIDDLEWARE_AFTER  = 'mid-after';

class Events {
  constructor() {
    this.middlewaresBefore   = {};
    this.middlewaresAfter    = {};
    this.registeredCallbacks = {};
  }

  /**
   * Creates listener for an event
   * @param eventName {string} event name
   * @param callback {function} async or sync function
   * @returns {string} id of listener to be used with off
   */
  on(eventName, callback) {
    let id = utils.id.nano();
    if (!this.registeredCallbacks[eventName]) this.registeredCallbacks[eventName] = {};
    this.registeredCallbacks[eventName][id] = callback;
    return id;
  }


  /**
   * Deletes listener
   * @param id {string} id of listener
   */
  off(id) {
    let done = false;
    utils.utils.iterateSync(this.registeredCallbacks, (value, eventName, setKey, stopExecution) => {
      utils.utils.iterateSync(value, (val, callbackId, setKey, stopExec) => {
        if (callbackId === id) {
          delete this.registeredCallbacks[eventName][id];
          done = true;
          stopExec();
        }
        if (done) stopExecution();
      });
    });
  }

  /**
   * Adds middleware
   * @param middleware {object | function} function or object with install method
   * @param options? {object} settings for the middleware
   * @param options.middlewareType? {MIDDLEWARE_AFTER | MIDDLEWARE_BEFORE}  middleware type
   * @param options.settings? {any} settings which will be passed to the install method
   * @returns {string} id of the middleware
   */
  use(middleware, options) {
    let mwId = utils.id.nano();
    if (typeof middleware === 'function') {
      switch (options.middlewareType) {
        case MIDDLEWARE_BEFORE:
          this.middlewaresBefore[mwId] = middleware;
          break;
        case MIDDLEWARE_AFTER:
          this.middlewaresAfter[mwId] = middleware;
      }
      return mwId;
    }
    if (!(typeof middleware === 'object' && typeof middleware.install === 'function')) {
      throw new Error('Middleware should be a function or an object');
    }

    middleware.install(this, options.settings);
  }


  /**
   * Removes middleware
   * @param id {string} middleware id
   */
  unUse(id) {

  }

  emit(eventName, ...args) {

  }

  emitAsync(eventName, args) {

  }
}


export default {
  Events,
  MIDDLEWARE_BEFORE,
  MIDDLEWARE_AFTER
};
