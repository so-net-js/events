"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _index = _interopRequireDefault(require("@svjs/utils/src/index"));

var MIDDLEWARE_BEFORE = 'mid-before';
var MIDDLEWARE_AFTER = 'mid-after';

var Events =
/*#__PURE__*/
function () {
  function Events() {
    (0, _classCallCheck2["default"])(this, Events);
    this.middlewaresBefore = {};
    this.middlewaresAfter = {};
    this.registeredCallbacks = {};
  }
  /**
   * Creates listener for an event
   * @param eventName {string} event name
   * @param callback {function} async or sync function
   * @returns {string} id of listener to be used with off
   */


  (0, _createClass2["default"])(Events, [{
    key: "on",
    value: function on(eventName, callback) {
      var id = _index["default"].id.nano();

      if (!this.registeredCallbacks[eventName]) this.registeredCallbacks[eventName] = {};
      this.registeredCallbacks[eventName][id] = callback;
      return id;
    }
    /**
     * Deletes listener
     * @param id {string} id of listener
     */

  }, {
    key: "off",
    value: function off(id) {
      var _this = this;

      var done = false;

      _index["default"].utils.iterateSync(this.registeredCallbacks, function (value, eventName, setKey, stopExecution) {
        _index["default"].utils.iterateSync(value, function (val, callbackId, setKey, stopExec) {
          if (callbackId === id) {
            delete _this.registeredCallbacks[eventName][id];
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

  }, {
    key: "use",
    value: function use(middleware, options) {
      var mwId = _index["default"].id.nano();

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

      if (!((0, _typeof2["default"])(middleware) === 'object' && typeof middleware.install === 'function')) {
        throw new Error('Middleware should be a function or an object');
      }

      middleware.install(this, options.settings);
    }
    /**
     * Removes middleware
     * @param id {string} middleware id
     */

  }, {
    key: "unUse",
    value: function unUse(id) {}
  }, {
    key: "emit",
    value: function emit(eventName) {}
  }, {
    key: "emitAsync",
    value: function emitAsync(eventName, args) {}
  }]);
  return Events;
}();

var _default = {
  Events: Events,
  MIDDLEWARE_BEFORE: MIDDLEWARE_BEFORE,
  MIDDLEWARE_AFTER: MIDDLEWARE_AFTER
};
exports["default"] = _default;