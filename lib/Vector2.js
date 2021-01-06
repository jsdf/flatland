"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var Vector2 = /*#__PURE__*/function () {
  function Vector2() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        x = _ref.x,
        y = _ref.y;

    (0, _classCallCheck2.default)(this, Vector2);
    this.x = x !== null && x !== void 0 ? x : 0;
    this.y = y !== null && y !== void 0 ? y : 0;
  }

  (0, _createClass2.default)(Vector2, [{
    key: "clone",
    value: function clone() {
      return new Vector2(this);
    }
  }, {
    key: "copyFrom",
    value: function copyFrom() {
      var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          x = _ref2.x,
          y = _ref2.y;

      this.x = x !== null && x !== void 0 ? x : 0;
      this.y = y !== null && y !== void 0 ? y : 0;
    }
  }, {
    key: "origin",
    value: function origin() {
      this.x = 0;
      this.y = 0;
    }
  }, {
    key: "add",
    value: function add(other) {
      this.x += other.x;
      this.y += other.y;
      return this;
    }
  }, {
    key: "sub",
    value: function sub(other) {
      this.x -= other.x;
      this.y -= other.y;
      return this;
    }
  }, {
    key: "mul",
    value: function mul(other) {
      this.x *= other.x;
      this.y *= other.y;
      return this;
    }
  }, {
    key: "div",
    value: function div(other) {
      this.x /= other.x;
      this.y /= other.y;
      return this;
    }
  }, {
    key: "distanceTo",
    value: function distanceTo(other) {
      return Math.sqrt(Math.pow(this.x - other.x, 2) + Math.pow(this.y - other.y, 2));
    }
  }, {
    key: "toJSON",
    value: function toJSON() {
      return {
        x: this.x,
        y: this.y
      };
    }
  }]);
  return Vector2;
}();

exports.default = Vector2;