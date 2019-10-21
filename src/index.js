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
    let done = false;
    utils.utils.iterateSync(this.middlewaresBefore, (val, idx, setKey, stopExec) => {
      if (idx === id) {
        stopExec();
        delete this.middlewaresBefore[id];
        done = true;
      }
    });
    if (done) return;
    utils.utils.iterateSync(this.middlewaresAfter, (val, idx, setKey, stopExec) => {
      if (idx === id) {
        stopExec();
        delete this.middlewaresAfter[id];
      }
    });
  }

  /**
   * Emits an event in a sync way (should be used if there are no async callbacks or middlewares)
   *
   * If no listeners were attached to the event or before middleware has stopped execution, returns undefined
   * If there were only one listener, returns the return value of the event callback
   * If there were multiple listeners, returns an array of the return values of the events callbacks
   *
   * @param eventName {string} event name
   * @param args {...any} just arguments for the listeners of the event
   * @returns {undefined | any | [any]} result of execution
   */
  emit(eventName, ...args) {
    let shouldStopExecution = false;
    let fEventName          = eventName;
    let fArgs               = args;
    let returnValue         = undefined;

    utils.utils.iterateSync(this.middlewaresBefore, (middleware, idx, setKey, stopExecution) => {
      let res = middleware(fEventName, fArgs);
      if (res.eventName) fEventName = res.eventName;
      if (res.args) fArgs = res.args;
      if (res.stopExecution) {
        shouldStopExecution = true;
        returnValue         = res.stopExecutionReturnValue;
        stopExecution();
      }
    });
    if (shouldStopExecution) return returnValue;
    if (!this.registeredCallbacks[fEventName]) return;

    returnValue = utils.utils.iterateSync(this.registeredCallbacks[fEventName], (value, index) => {
      return value(...fArgs);
    }, []);
    if (returnValue.length === 1) returnValue = returnValue[0];


    utils.utils.iterateSync(this.middlewaresAfter, (middleware, idx, setKey, stopExecution) => {
      let res = middleware(fEventName, fArgs, returnValue);
      if (res.returnValue) returnValue = res.returnValue;
    });

    return returnValue;
  }


  /**
   * Emits an event in an async way (should be used if there are are async callbacks or middlewares)
   *
   * If no listeners were attached to the event or before middleware has stopped execution, returns undefined
   * If there were only one listener, returns the return value of the event callback
   * If there were multiple listeners, returns an array of the return values of the events callbacks
   *
   * @param eventName {string} event name
   * @param args {...any} just arguments for the listeners of the event
   * @returns {Promise<undefined | any | [any]>} result of execution
   */
  async emitAsync(eventName, ...args) {
    let shouldStopExecution = false;
    let fEventName          = eventName;
    let fArgs               = args;
    let returnValue         = undefined;

    await utils.utils.iterateAsync(this.middlewaresBefore, async (middleware, idx, setKey, stopExecution) => {
      let res = await middleware(fEventName, fArgs);
      if (res.eventName) fEventName = res.eventName;
      if (res.args) fArgs = res.args;
      if (res.stopExecution) {
        shouldStopExecution = true;
        returnValue         = res.stopExecutionReturnValue;
        stopExecution();
      }
    });
    if (shouldStopExecution) return returnValue;
    if (!this.registeredCallbacks[fEventName]) return;

    returnValue = await utils.utils.iterateAsync(this.registeredCallbacks[fEventName], async (value, index) => {
      return await value(...fArgs);
    }, []);
    if (returnValue.length === 1) returnValue = returnValue[0];


    await utils.utils.iterateSync(this.middlewaresAfter, async (middleware, idx, setKey, stopExecution) => {
      let res = await middleware(fEventName, fArgs, returnValue);
      if (res.returnValue) returnValue = res.returnValue;
    });

    return returnValue;
  }
}


export default {
  Events,
  MIDDLEWARE_BEFORE,
  MIDDLEWARE_AFTER
};
