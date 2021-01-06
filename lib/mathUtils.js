"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.wrap = wrap;

function wrap(value, max) {
  return (value % max + max) % max;
}