"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _typeof3 = require("@babel/runtime/helpers/typeof");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _index = _interopRequireDefault(require("@svjs/utils/src/index"));

Function.prototype.$asyncbind = function $asyncbind(self, catcher) {
  "use strict";

  if (!Function.prototype.$asyncbind) {
    Object.defineProperty(Function.prototype, "$asyncbind", {
      value: $asyncbind,
      enumerable: false,
      configurable: true,
      writable: true
    });
  }

  if (!$asyncbind.trampoline) {
    $asyncbind.trampoline = function trampoline(t, x, s, e, u) {
      return function b(q) {
        while (q) {
          if (q.then) {
            q = q.then(b, e);
            return u ? undefined : q;
          }

          try {
            if (q.pop) {
              if (q.length) return q.pop() ? x.call(t) : q;
              q = s;
            } else q = q.call(t);
          } catch (r) {
            return e(r);
          }
        }
      };
    };
  }

  if (!$asyncbind.LazyThenable) {
    $asyncbind.LazyThenable = function () {
      function isThenable(obj) {
        return obj && obj instanceof Object && typeof obj.then === "function";
      }

      function resolution(p, r, how) {
        try {
          var x = how ? how(r) : r;
          if (p === x) return p.reject(new TypeError("Promise resolution loop"));

          if (isThenable(x)) {
            x.then(function (y) {
              resolution(p, y);
            }, function (e) {
              p.reject(e);
            });
          } else {
            p.resolve(x);
          }
        } catch (ex) {
          p.reject(ex);
        }
      }

      function _unchained(v) {}

      function thenChain(res, rej) {
        this.resolve = res;
        this.reject = rej;
      }

      function Chained() {}

      ;
      Chained.prototype = {
        resolve: _unchained,
        reject: _unchained,
        then: thenChain
      };

      function then(res, rej) {
        var chain = new Chained();

        try {
          this._resolver(function (value) {
            return isThenable(value) ? value.then(res, rej) : resolution(chain, value, res);
          }, function (ex) {
            resolution(chain, ex, rej);
          });
        } catch (ex) {
          resolution(chain, ex, rej);
        }

        return chain;
      }

      function Thenable(resolver) {
        this._resolver = resolver;
        this.then = then;
      }

      ;

      Thenable.resolve = function (v) {
        return Thenable.isThenable(v) ? v : {
          then: function then(resolve) {
            return resolve(v);
          }
        };
      };

      Thenable.isThenable = isThenable;
      return Thenable;
    }();

    $asyncbind.EagerThenable = $asyncbind.Thenable = ($asyncbind.EagerThenableFactory = function (tick) {
      tick = tick || (typeof process === "undefined" ? "undefined" : _typeof3(process)) === "object" && process.nextTick || typeof setImmediate === "function" && setImmediate || function (f) {
        setTimeout(f, 0);
      };

      var soon = function () {
        var fq = [],
            fqStart = 0,
            bufferSize = 1024;

        function callQueue() {
          while (fq.length - fqStart) {
            try {
              fq[fqStart]();
            } catch (ex) {}

            fq[fqStart++] = undefined;

            if (fqStart === bufferSize) {
              fq.splice(0, bufferSize);
              fqStart = 0;
            }
          }
        }

        return function (fn) {
          fq.push(fn);
          if (fq.length - fqStart === 1) tick(callQueue);
        };
      }();

      function Zousan(func) {
        if (func) {
          var me = this;
          func(function (arg) {
            me.resolve(arg);
          }, function (arg) {
            me.reject(arg);
          });
        }
      }

      Zousan.prototype = {
        resolve: function resolve(value) {
          if (this.state !== undefined) return;
          if (value === this) return this.reject(new TypeError("Attempt to resolve promise with self"));
          var me = this;

          if (value && (typeof value === "function" || _typeof3(value) === "object")) {
            try {
              var first = 0;
              var then = value.then;

              if (typeof then === "function") {
                then.call(value, function (ra) {
                  if (!first++) {
                    me.resolve(ra);
                  }
                }, function (rr) {
                  if (!first++) {
                    me.reject(rr);
                  }
                });
                return;
              }
            } catch (e) {
              if (!first) this.reject(e);
              return;
            }
          }

          this.state = STATE_FULFILLED;
          this.v = value;
          if (me.c) soon(function () {
            for (var n = 0, l = me.c.length; n < l; n++) {
              STATE_FULFILLED(me.c[n], value);
            }
          });
        },
        reject: function reject(reason) {
          if (this.state !== undefined) return;
          this.state = STATE_REJECTED;
          this.v = reason;
          var clients = this.c;
          if (clients) soon(function () {
            for (var n = 0, l = clients.length; n < l; n++) {
              STATE_REJECTED(clients[n], reason);
            }
          });
        },
        then: function then(onF, onR) {
          var p = new Zousan();
          var client = {
            y: onF,
            n: onR,
            p: p
          };

          if (this.state === undefined) {
            if (this.c) this.c.push(client);else this.c = [client];
          } else {
            var s = this.state,
                a = this.v;
            soon(function () {
              s(client, a);
            });
          }

          return p;
        }
      };

      function STATE_FULFILLED(c, arg) {
        if (typeof c.y === "function") {
          try {
            var yret = c.y.call(undefined, arg);
            c.p.resolve(yret);
          } catch (err) {
            c.p.reject(err);
          }
        } else c.p.resolve(arg);
      }

      function STATE_REJECTED(c, reason) {
        if (typeof c.n === "function") {
          try {
            var yret = c.n.call(undefined, reason);
            c.p.resolve(yret);
          } catch (err) {
            c.p.reject(err);
          }
        } else c.p.reject(reason);
      }

      Zousan.resolve = function (val) {
        if (val && val instanceof Zousan) return val;
        var z = new Zousan();
        z.resolve(val);
        return z;
      };

      Zousan.reject = function (err) {
        if (err && err instanceof Zousan) return err;
        var z = new Zousan();
        z.reject(err);
        return z;
      };

      Zousan.version = "2.3.3-nodent";
      return Zousan;
    })();
  }

  function boundThen() {
    return resolver.apply(self, arguments);
  }

  var resolver = this;

  switch (catcher) {
    case true:
      return new $asyncbind.Thenable(boundThen);

    case 0:
      return new $asyncbind.LazyThenable(boundThen);

    case undefined:
      boundThen.then = boundThen;
      return boundThen;

    default:
      return function () {
        try {
          return resolver.apply(self, arguments);
        } catch (ex) {
          return catcher(ex);
        }
      };
  }
};

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
    value: function unUse(id) {
      var _this2 = this;

      var done = false;

      _index["default"].utils.iterateSync(this.middlewaresBefore, function (val, idx, setKey, stopExec) {
        if (idx === id) {
          stopExec();
          delete _this2.middlewaresBefore[id];
          done = true;
        }
      });

      if (done) return;

      _index["default"].utils.iterateSync(this.middlewaresAfter, function (val, idx, setKey, stopExec) {
        if (idx === id) {
          stopExec();
          delete _this2.middlewaresAfter[id];
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

  }, {
    key: "emit",
    value: function emit(eventName) {
      var shouldStopExecution = false;
      var fEventName = eventName;

      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      var fArgs = args;
      var returnValue = undefined;

      _index["default"].utils.iterateSync(this.middlewaresBefore, function (middleware, idx, setKey, stopExecution) {
        var res = middleware(fEventName, fArgs);
        if (res.eventName) fEventName = res.eventName;
        if (res.args) fArgs = res.args;

        if (res.stopExecution) {
          shouldStopExecution = true;
          returnValue = res.stopExecutionReturnValue;
          stopExecution();
        }
      });

      if (shouldStopExecution) return returnValue;
      if (!this.registeredCallbacks[fEventName]) return;
      returnValue = _index["default"].utils.iterateSync(this.registeredCallbacks[fEventName], function (value, index) {
        return value.apply(void 0, (0, _toConsumableArray2["default"])(fArgs));
      }, []);
      if (returnValue.length === 1) returnValue = returnValue[0];

      _index["default"].utils.iterateSync(this.middlewaresAfter, function (middleware, idx, setKey, stopExecution) {
        var res = middleware(fEventName, fArgs, returnValue);
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

  }, {
    key: "emitAsync",
    value: function () {
      var _emitAsync = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee4(eventName) {
        var shouldStopExecution,
            fEventName,
            _len2,
            args,
            _key2,
            fArgs,
            returnValue,
            _args4 = arguments;

        return _regenerator["default"].wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                shouldStopExecution = false;
                fEventName = eventName;

                for (_len2 = _args4.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
                  args[_key2 - 1] = _args4[_key2];
                }

                fArgs = args;
                returnValue = undefined;
                _context4.next = 7;
                return _index["default"].utils.iterateAsync(this.middlewaresBefore,
                /*#__PURE__*/
                function () {
                  var _ref = (0, _asyncToGenerator2["default"])(
                  /*#__PURE__*/
                  _regenerator["default"].mark(function _callee(middleware, idx, setKey, stopExecution) {
                    var res;
                    return _regenerator["default"].wrap(function _callee$(_context) {
                      while (1) {
                        switch (_context.prev = _context.next) {
                          case 0:
                            _context.next = 2;
                            return middleware(fEventName, fArgs);

                          case 2:
                            res = _context.sent;
                            if (res.eventName) fEventName = res.eventName;
                            if (res.args) fArgs = res.args;

                            if (res.stopExecution) {
                              shouldStopExecution = true;
                              returnValue = res.stopExecutionReturnValue;
                              stopExecution();
                            }

                          case 6:
                          case "end":
                            return _context.stop();
                        }
                      }
                    }, _callee);
                  }));

                  return function (_x2, _x3, _x4, _x5) {
                    return _ref.apply(this, arguments);
                  };
                }());

              case 7:
                if (!shouldStopExecution) {
                  _context4.next = 9;
                  break;
                }

                return _context4.abrupt("return", returnValue);

              case 9:
                if (this.registeredCallbacks[fEventName]) {
                  _context4.next = 11;
                  break;
                }

                return _context4.abrupt("return");

              case 11:
                _context4.next = 13;
                return _index["default"].utils.iterateAsync(this.registeredCallbacks[fEventName],
                /*#__PURE__*/
                function () {
                  var _ref2 = (0, _asyncToGenerator2["default"])(
                  /*#__PURE__*/
                  _regenerator["default"].mark(function _callee2(value, index) {
                    return _regenerator["default"].wrap(function _callee2$(_context2) {
                      while (1) {
                        switch (_context2.prev = _context2.next) {
                          case 0:
                            _context2.next = 2;
                            return value.apply(void 0, (0, _toConsumableArray2["default"])(fArgs));

                          case 2:
                            return _context2.abrupt("return", _context2.sent);

                          case 3:
                          case "end":
                            return _context2.stop();
                        }
                      }
                    }, _callee2);
                  }));

                  return function (_x6, _x7) {
                    return _ref2.apply(this, arguments);
                  };
                }(), []);

              case 13:
                returnValue = _context4.sent;
                if (returnValue.length === 1) returnValue = returnValue[0];
                _context4.next = 17;
                return _index["default"].utils.iterateSync(this.middlewaresAfter,
                /*#__PURE__*/
                function () {
                  var _ref3 = (0, _asyncToGenerator2["default"])(
                  /*#__PURE__*/
                  _regenerator["default"].mark(function _callee3(middleware, idx, setKey, stopExecution) {
                    var res;
                    return _regenerator["default"].wrap(function _callee3$(_context3) {
                      while (1) {
                        switch (_context3.prev = _context3.next) {
                          case 0:
                            _context3.next = 2;
                            return middleware(fEventName, fArgs, returnValue);

                          case 2:
                            res = _context3.sent;
                            if (res.returnValue) returnValue = res.returnValue;

                          case 4:
                          case "end":
                            return _context3.stop();
                        }
                      }
                    }, _callee3);
                  }));

                  return function (_x8, _x9, _x10, _x11) {
                    return _ref3.apply(this, arguments);
                  };
                }());

              case 17:
                return _context4.abrupt("return", returnValue);

              case 18:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function emitAsync(_x) {
        return _emitAsync.apply(this, arguments);
      }

      return emitAsync;
    }()
  }]);
  return Events;
}();

var _default = {
  Events: Events,
  MIDDLEWARE_BEFORE: MIDDLEWARE_BEFORE,
  MIDDLEWARE_AFTER: MIDDLEWARE_AFTER
};
exports["default"] = _default;