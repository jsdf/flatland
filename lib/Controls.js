"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _Vector = _interopRequireDefault(require("./Vector2"));

var _viewport = require("./viewport");

var Controls = /*#__PURE__*/_react.default.memo(function Controls(_ref) {
  var mode = _ref.mode,
      onModeChange = _ref.onModeChange,
      viewportState = _ref.viewportState,
      onViewportStateChange = _ref.onViewportStateChange,
      canvasLogicalDimensions = _ref.canvasLogicalDimensions;
  return /*#__PURE__*/_react.default.createElement("div", {
    style: {
      position: 'absolute',
      width: '50vw',
      top: 0,
      right: 0,
      textAlign: 'right'
    }
  }, ['select', 'pan'].map(function (value) {
    return /*#__PURE__*/_react.default.createElement("button", {
      key: value,
      style: {
        background: value === mode ? '#fff' : '#ccc'
      },
      onClick: function onClick() {
        return onModeChange(value);
      }
    }, value);
  }), /*#__PURE__*/_react.default.createElement("label", {
    style: {
      fontSize: 24
    }
  }, "\u2B0C", /*#__PURE__*/_react.default.createElement("input", {
    type: "range",
    value: viewportState.zoom.x,
    min: 0.5,
    max: 10,
    step: 0.01,
    onChange: function onChange(e) {
      return onViewportStateChange(function (s) {
        var updatedZoom = s.zoom.clone();
        updatedZoom.x = parseFloat(e.target.value);
        var zoomPos = new _Vector.default({
          x: canvasLogicalDimensions.width / 2,
          y: canvasLogicalDimensions.height / 2
        });
        return (0, _viewport.zoomAtPoint)(s, zoomPos, updatedZoom);
      });
    }
  })), /*#__PURE__*/_react.default.createElement("label", {
    style: {
      fontSize: 24
    }
  }, "\u2B0D", /*#__PURE__*/_react.default.createElement("input", {
    type: "range",
    value: viewportState.zoom.y,
    min: 0.5,
    max: 10,
    step: 0.01,
    onChange: function onChange(e) {
      return onViewportStateChange(function (s) {
        var updatedZoom = s.zoom.clone();
        updatedZoom.y = parseFloat(e.target.value);
        var zoomPos = new _Vector.default({
          x: canvasLogicalDimensions.width / 2,
          y: canvasLogicalDimensions.height / 2
        });
        return (0, _viewport.zoomAtPoint)(s, zoomPos, updatedZoom);
      });
    }
  })));
});

var _default = Controls;
exports.default = _default;