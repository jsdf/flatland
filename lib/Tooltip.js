"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Tooltip = exports.TooltipBehavior = void 0;

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _assertThisInitialized2 = _interopRequireDefault(require("@babel/runtime/helpers/assertThisInitialized"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireDefault(require("react"));

var _behavior = require("./behavior");

var _mouseUtils = require("./mouseUtils");

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

var useState = _react.default.useState,
    useImperativeHandle = _react.default.useImperativeHandle,
    forwardRef = _react.default.forwardRef;
var TOOLTIP_OFFSET = 8;

var TooltipBehavior = /*#__PURE__*/function (_Behavior) {
  (0, _inherits2.default)(TooltipBehavior, _Behavior);

  var _super = _createSuper(TooltipBehavior);

  function TooltipBehavior() {
    var _this;

    (0, _classCallCheck2.default)(this, TooltipBehavior);

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _this = _super.call.apply(_super, [this].concat(args));
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "onMouseMove", function (e) {
      var _this$props$getEventA, _this$props, _this$props$setToolti, _this$props2;

      if (_this.controller.lockExists('drag')) return;
      var mousePos = (0, _mouseUtils.getMouseEventPos)(e, _this.canvas);
      var intersecting = (_this$props$getEventA = (_this$props = _this.props).getEventAtPos) === null || _this$props$getEventA === void 0 ? void 0 : _this$props$getEventA.call(_this$props, mousePos);
      (_this$props$setToolti = (_this$props2 = _this.props).setTooltip) === null || _this$props$setToolti === void 0 ? void 0 : _this$props$setToolti.call(_this$props2, intersecting ? {
        position: mousePos,
        event: intersecting
      } : null);
    });
    return _this;
  }

  (0, _createClass2.default)(TooltipBehavior, [{
    key: "onAnyLockChange",
    value: function onAnyLockChange(type, locked) {
      if (type === 'drag' && locked) {
        var _this$props$setToolti2, _this$props3;

        // hide tooltip
        (_this$props$setToolti2 = (_this$props3 = this.props).setTooltip) === null || _this$props$setToolti2 === void 0 ? void 0 : _this$props$setToolti2.call(_this$props3, null);
      }
    }
  }, {
    key: "getEventHandlers",
    value: function getEventHandlers() {
      return {
        mousemove: this.onMouseMove
      };
    }
  }]);
  return TooltipBehavior;
}(_behavior.Behavior);

exports.TooltipBehavior = TooltipBehavior;

var Tooltip = /*#__PURE__*/_react.default.memo(forwardRef(function Tooltip(_ref, ref) {
  var component = _ref.component;

  var _useState = useState(null),
      _useState2 = (0, _slicedToArray2.default)(_useState, 2),
      tooltip = _useState2[0],
      setTooltip = _useState2[1];

  useImperativeHandle(ref, function () {
    return {
      setTooltip: setTooltip
    };
  });
  var Component = component;
  return /*#__PURE__*/_react.default.createElement("div", {
    style: {
      height: 0,
      width: 0
    }
  }, tooltip && /*#__PURE__*/_react.default.createElement("div", {
    style: {
      transform: "translate3d(".concat(tooltip.position.x + TOOLTIP_OFFSET, "px,").concat(tooltip.position.y + TOOLTIP_OFFSET, "px,0)"),
      color: '#000',
      backgroundColor: 'white',
      pointerEvents: 'none',
      width: 'fit-content',
      userSelect: 'none',
      fontSize: 10,
      fontFamily: ' Lucida Grande',
      padding: '2px 4px',
      boxShadow: '3px 3px 5px rgba(0,0,0,0.4)'
    }
  }, /*#__PURE__*/_react.default.createElement(Component, {
    position: tooltip.position,
    event: tooltip.event
  })));
}));

exports.Tooltip = Tooltip;