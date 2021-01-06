"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useWindowDimensions = useWindowDimensions;
exports.getDPR = getDPR;

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _react = _interopRequireDefault(require("react"));

var useEffect = _react.default.useEffect,
    useState = _react.default.useState;

function debounce(fn, delay) {
  var timer;
  return function () {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    clearTimeout(timer);
    timer = setTimeout(function () {
      timer = null;
      fn.apply(void 0, args);
    }, delay);
  };
}

function useWindowDimensions() {
  var _useState = useState({
    width: window.innerWidth,
    height: window.innerHeight
  }),
      _useState2 = (0, _slicedToArray2.default)(_useState, 2),
      windowDimensions = _useState2[0],
      setWindowDimensions = _useState2[1];

  useEffect(function () {
    window.addEventListener('resize', debounce(function () {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    }, 300));
  }, []);
  return windowDimensions;
}

function getDPR() {
  return window.devicePixelRatio || 1;
}