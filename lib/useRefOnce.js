"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = useRefOnce;

var _react = _interopRequireDefault(require("react"));

var useRef = _react.default.useRef;
var UNINITIALZIED = {};

function useRefOnce(init) {
  var ref = useRef(UNINITIALZIED);

  if (ref.current === UNINITIALZIED) {
    ref.current = init();
  }

  return ref;
}