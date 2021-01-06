"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = useLocalStorageAsync;

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _react = require("react");

// like throttle, but calls with last args provided instead of first
function throttleTrailing(fn, time) {
  var timeout = null;
  var _timeoutFn = null;
  var lastArgs = null;

  function throttled() {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    lastArgs = args;

    if (timeout == null) {
      _timeoutFn = function timeoutFn() {
        if (lastArgs) {
          fn.apply(void 0, (0, _toConsumableArray2.default)(lastArgs));
        }

        timeout = null;
        _timeoutFn = null;
      };

      timeout = setTimeout(_timeoutFn, time);
    }
  }

  throttled.flush = function () {
    clearTimeout(timeout);
    timeout = null;

    if (_timeoutFn) {
      _timeoutFn();

      _timeoutFn = null;
    }
  };

  return throttled;
}

function getInitialState(value) {
  return typeof value === 'function' ? value() : value;
}

function useLocalStorageAsync(stateKey, initialValue, options) {
  var _options$baseKey;

  var key = "".concat(((_options$baseKey = options === null || options === void 0 ? void 0 : options.baseKey) !== null && _options$baseKey !== void 0 ? _options$baseKey : 'useLocalStorageAsync') + ((options === null || options === void 0 ? void 0 : options.schemaVersion) != null ? ":v".concat(options.schemaVersion) : ''), ":").concat(stateKey);
  var storeValueRef = (0, _react.useRef)(null);

  if (!storeValueRef.current) {
    var doStore = function doStore(valueToStore) {
      var serialized = options !== null && options !== void 0 && options.stringify ? options.stringify(valueToStore) : JSON.stringify(valueToStore); // Save to local storage

      if (serialized) {
        window.localStorage.setItem(key, serialized); // console.log('stored', key, serialized);
      }
    };

    storeValueRef.current = throttleTrailing(doStore, 500);
  }

  (0, _react.useEffect)(function () {
    var cleanup = function cleanup() {
      if (storeValueRef.current) {
        // do any pending store
        storeValueRef.current.flush();
      }
    };

    window.addEventListener('beforeunload', cleanup); // force write on unmount

    return function () {
      window.removeEventListener('beforeunload', cleanup);
      cleanup();
    };
  }, []); // State to store our value
  // Pass initial state function to useState so logic is only executed once

  var _useState = (0, _react.useState)(function () {
    try {
      // Get from local storage by key
      var item = window.localStorage.getItem(key); // Parse stored json or if none return initialValue

      var parsed = item ? options !== null && options !== void 0 && options.parse ? options.parse(item) : JSON.parse(item) : null;
      var loaded = parsed !== null && parsed !== void 0 ? parsed : getInitialState(initialValue); // console.log('loaded', key, loaded);

      return loaded;
    } catch (error) {
      // If error also return initialValue
      console.error(error);
      window.localStorage.removeItem(key);
      return getInitialState(initialValue);
    }
  }),
      _useState2 = (0, _slicedToArray2.default)(_useState, 2),
      storedValue = _useState2[0],
      setStoredValue = _useState2[1]; // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.


  var setValue = function setValue(value) {
    try {
      // Allow value to be a function so we have same API as useState
      var valueToStore = value instanceof Function ? value(storedValue) : value; // Save state

      setStoredValue(valueToStore);
      storeValueRef.current(valueToStore);
    } catch (error) {
      // A more advanced implementation would handle the error case
      console.log(error);
    }
  };

  return [storedValue, setValue];
}