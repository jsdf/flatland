"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _Vector = _interopRequireDefault(require("./Vector2"));

var Rect = /*#__PURE__*/function () {
  function Rect() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        position = _ref.position,
        size = _ref.size;

    (0, _classCallCheck2.default)(this, Rect);
    this.position = new _Vector.default(position);
    this.size = new _Vector.default(size);
  }

  (0, _createClass2.default)(Rect, [{
    key: "containsPoint",
    value: function containsPoint(point) {
      if ( // min
      point.x > this.position.x && point.y > this.position.y && // max
      point.x < this.position.x + this.size.x && point.y < this.position.y + this.size.y) {
        return true;
      }

      return false;
    }
  }, {
    key: "intersectsRect",
    value: function intersectsRect(other) {
      return collision(this, other);
    }
  }, {
    key: "clone",
    value: function clone() {
      return new Rect({
        position: this.position,
        size: this.size
      });
    }
  }]);
  return Rect;
}();

exports.default = Rect;

function collision(a, b) {
  // work out the corners (x1,x2,y1,y1) of each rectangle
  // top left
  var ax1 = a.position.x;
  var ay1 = a.position.y; // bottom right

  var ax2 = a.position.x + a.size.x;
  var ay2 = a.position.y + a.size.y; // top left

  var bx1 = b.position.x;
  var by1 = b.position.y; // bottom right

  var bx2 = b.position.x + b.size.x;
  var by2 = b.position.y + b.size.y; // test rectangular overlap

  return !(ax1 > bx2 || bx1 > ax2 || ay1 > by2 || by1 > ay2);
}