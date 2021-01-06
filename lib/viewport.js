"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.zoomAtPoint = zoomAtPoint;
exports.makeViewportState = makeViewportState;
exports.useViewportState = useViewportState;
exports.useViewport = useViewport;
exports.ViewportStateSerializer = exports.WheelZoomBehavior = exports.WheelScrollBehavior = exports.DragPanBehavior = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _assertThisInitialized2 = _interopRequireDefault(require("@babel/runtime/helpers/assertThisInitialized"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireDefault(require("react"));

var _Vector = _interopRequireDefault(require("./Vector2"));

var _mouseUtils = require("./mouseUtils");

var _behavior = require("./behavior");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

var useMemo = _react.default.useMemo,
    useState = _react.default.useState;
var SELECT_MAX_MOVE_DISTANCE = 5;

function zoomAtPoint(_ref, pointInView, updatedZoom) {
  var prevZoom = _ref.zoom,
      prevPan = _ref.pan;
  // find where the point is in (unzoomed) world coords
  var pointWorld = pointInView.clone().div(prevZoom).add(prevPan); // find point (zoomed) coords at new zoom, subtract point viewport offset
  // to get viewport offset (zoomed coords), then unzoom to get global pan

  var updatedPan = pointWorld.clone().mul(updatedZoom).sub(pointInView).div(updatedZoom);
  return {
    zoom: updatedZoom,
    pan: updatedPan
  };
}

var DragPanBehavior = /*#__PURE__*/function (_Behavior) {
  (0, _inherits2.default)(DragPanBehavior, _Behavior);

  var _super = _createSuper(DragPanBehavior);

  function DragPanBehavior() {
    var _this;

    (0, _classCallCheck2.default)(this, DragPanBehavior);

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _this = _super.call.apply(_super, [this].concat(args));
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "isMouseDown", false);
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "panAtDragStart", new _Vector.default());
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "currentPan", new _Vector.default());
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "startMousePos", new _Vector.default());
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "onmousedown", function (e) {
      _this.isMouseDown = true;

      _this.panAtDragStart.copyFrom(_this.props.viewportState.pan);

      _this.startMousePos.copyFrom((0, _mouseUtils.getMouseEventPos)(e, _this.canvas));
    });
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "onmouseup", function (e) {
      _this.isMouseDown = false;

      _this.controller.releaseLock('drag', (0, _assertThisInitialized2.default)(_this));
    });
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "onmousemove", function (e) {
      var distanceMoved = (0, _mouseUtils.getMouseEventPos)(e, _this.canvas).distanceTo(_this.startMousePos);

      if (distanceMoved > SELECT_MAX_MOVE_DISTANCE) {
        // now we know for sure we're dragging
        _this.controller.acquireLock('drag', (0, _assertThisInitialized2.default)(_this), _this.priority);
      }

      if (_this.isMouseDown && _this.controller.hasLock('drag', (0, _assertThisInitialized2.default)(_this))) {
        var _this$props$setViewpo, _this$props;

        var movementSinceStart = (0, _mouseUtils.getMouseEventPos)(e, _this.canvas).sub(_this.startMousePos);
        (_this$props$setViewpo = (_this$props = _this.props).setViewportState) === null || _this$props$setViewpo === void 0 ? void 0 : _this$props$setViewpo.call(_this$props, function (s) {
          // pan is in world (unzoomed) coords so we must scale our translations
          var translation = movementSinceStart.clone().div(s.zoom).mul({
            x: -1,
            y: -1
          });
          return _objectSpread(_objectSpread({}, s), {}, {
            pan: translation.add(_this.panAtDragStart) // pan: s.pan.clone().mul(s.zoom).sub(movement).div(s.zoom),

          });
        });
      }
    });
    return _this;
  }

  (0, _createClass2.default)(DragPanBehavior, [{
    key: "onEnabled",
    value: function onEnabled() {
      this.isMouseDown = false;
    }
  }, {
    key: "getEventHandlers",
    value: function getEventHandlers() {
      return {
        mousemove: this.onmousemove,
        mouseup: this.onmouseup,
        mousedown: this.onmousedown
      };
    }
  }]);
  return DragPanBehavior;
}(_behavior.Behavior);

exports.DragPanBehavior = DragPanBehavior;

var WheelScrollBehavior = /*#__PURE__*/function (_Behavior2) {
  (0, _inherits2.default)(WheelScrollBehavior, _Behavior2);

  var _super2 = _createSuper(WheelScrollBehavior);

  function WheelScrollBehavior() {
    var _this2;

    (0, _classCallCheck2.default)(this, WheelScrollBehavior);

    for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }

    _this2 = _super2.call.apply(_super2, [this].concat(args));
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this2), "onwheel", function (e) {
      var _this2$props$setViewp, _this2$props;

      e.preventDefault();
      e.stopPropagation();
      var deltaY = e.deltaY; // is zoom in pixels or lines?

      if (e.deltaMode > 0) deltaY *= 100;
      var deltaX = e.deltaX;
      (_this2$props$setViewp = (_this2$props = _this2.props).setViewportState) === null || _this2$props$setViewp === void 0 ? void 0 : _this2$props$setViewp.call(_this2$props, function (s) {
        return _objectSpread(_objectSpread({}, s), {}, {
          pan: s.pan.clone().add(new _Vector.default({
            x: deltaX,
            y: deltaY
          }).div(s.zoom))
        });
      });
    });
    return _this2;
  }

  (0, _createClass2.default)(WheelScrollBehavior, [{
    key: "getEventHandlers",
    value: function getEventHandlers() {
      return {
        wheel: this.onwheel
      };
    }
  }]);
  return WheelScrollBehavior;
}(_behavior.Behavior);

exports.WheelScrollBehavior = WheelScrollBehavior;

var WheelZoomBehavior = /*#__PURE__*/function (_Behavior3) {
  (0, _inherits2.default)(WheelZoomBehavior, _Behavior3);

  var _super3 = _createSuper(WheelZoomBehavior);

  function WheelZoomBehavior() {
    var _this3;

    (0, _classCallCheck2.default)(this, WheelZoomBehavior);

    for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
      args[_key3] = arguments[_key3];
    }

    _this3 = _super3.call.apply(_super3, [this].concat(args));
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this3), "onwheel", function (e) {
      var _this3$props$setViewp, _this3$props;

      e.preventDefault();
      e.stopPropagation(); // zoom centered on mouse

      var mousePosInView = (0, _mouseUtils.getMouseEventPos)(e, _this3.canvas);
      var deltaY = e.deltaY; // is zoom in pixels or lines?

      if (e.deltaMode > 0) deltaY *= 100; // this is just manually tuned, it relates to the scale of mousewheel movement values

      var zoomSpeed = 0.005;
      var zoomScaleFactor = 1 + zoomSpeed * -deltaY;
      (_this3$props$setViewp = (_this3$props = _this3.props).setViewportState) === null || _this3$props$setViewp === void 0 ? void 0 : _this3$props$setViewp.call(_this3$props, function (s) {
        var _this3$props2, _this3$props2$dimensi, _this3$props3, _this3$props3$dimensi;

        var updatedZoom = s.zoom.clone().mul({
          x: zoomScaleFactor,
          y: zoomScaleFactor
        });
        var updated = zoomAtPoint(s, mousePosInView, updatedZoom);

        if (((_this3$props2 = _this3.props) === null || _this3$props2 === void 0 ? void 0 : (_this3$props2$dimensi = _this3$props2.dimensions) === null || _this3$props2$dimensi === void 0 ? void 0 : _this3$props2$dimensi.x) !== true) {
          updated.zoom.x = s.zoom.x;
          updated.pan.x = s.pan.x;
        }

        if (((_this3$props3 = _this3.props) === null || _this3$props3 === void 0 ? void 0 : (_this3$props3$dimensi = _this3$props3.dimensions) === null || _this3$props3$dimensi === void 0 ? void 0 : _this3$props3$dimensi.y) !== true) {
          updated.zoom.y = s.zoom.y;
          updated.pan.y = s.pan.y;
        }

        return _objectSpread(_objectSpread({}, s), updated);
      });
    });
    return _this3;
  }

  (0, _createClass2.default)(WheelZoomBehavior, [{
    key: "getEventHandlers",
    value: function getEventHandlers() {
      return {
        wheel: this.onwheel
      };
    }
  }]);
  return WheelZoomBehavior;
}(_behavior.Behavior);

exports.WheelZoomBehavior = WheelZoomBehavior;

function makeViewportState() {
  return {
    zoom: new _Vector.default({
      x: 1,
      y: 1
    }),
    pan: new _Vector.default()
  };
}

var ViewportStateSerializer = {
  stringify: function stringify(state) {
    return JSON.stringify(state);
  },
  parse: function parse(json) {
    var data = JSON.parse(json);
    if (!data) return null;
    return {
      zoom: new _Vector.default(data.zoom),
      pan: new _Vector.default(data.pan)
    };
  }
};
exports.ViewportStateSerializer = ViewportStateSerializer;

function useViewportState() {
  return useState(makeViewportState);
}

function useViewport(_ref2) {
  var zoom = _ref2.zoom,
      pan = _ref2.pan;
  return useMemo(function () {
    return {
      sizeToScreen: function sizeToScreen(size) {
        // just scale
        return new _Vector.default(size).mul(zoom);
      },
      sizeFromScreen: function sizeFromScreen(screenSize) {
        return new _Vector.default(screenSize).div(zoom);
      },
      sizeXFromScreen: function sizeXFromScreen(screenSizeX) {
        return screenSizeX / zoom.x;
      },
      sizeYFromScreen: function sizeYFromScreen(screenSizeY) {
        return screenSizeY / zoom.y;
      },
      positionToScreen: function positionToScreen(position) {
        // translate then scale, as pan is in world (unzoomed) coords
        return new _Vector.default(position).sub(pan).mul(zoom);
      },
      positionFromScreen: function positionFromScreen(screenPos) {
        return new _Vector.default(screenPos).div(zoom).mul(pan);
      }
    };
  }, [zoom, pan]);
}