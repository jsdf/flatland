"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getMouseEventPos = getMouseEventPos;

var _Vector = _interopRequireDefault(require("./Vector2"));

// get mouse event pos relative to some element (typically the viewport canvas)
function getMouseEventPos(event, canvas) {
  var rect = canvas.getBoundingClientRect();
  return new _Vector.default({
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  });
}