"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useCanvasContext2d = useCanvasContext2d;
exports.drawRect = drawRect;
exports.drawTextRect = drawTextRect;

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _react = _interopRequireDefault(require("react"));

var useEffect = _react.default.useEffect,
    useState = _react.default.useState,
    useRef = _react.default.useRef;

function useCanvasContext2d() {
  var canvasRef = useRef(null);

  var _useState = useState(null),
      _useState2 = (0, _slicedToArray2.default)(_useState, 2),
      state = _useState2[0],
      setState = _useState2[1];

  useEffect(function () {
    if (canvasRef.current && (!state || state.canvas !== canvasRef.current)) {
      var _canvasRef$current;

      var ctx = (_canvasRef$current = canvasRef.current) === null || _canvasRef$current === void 0 ? void 0 : _canvasRef$current.getContext('2d');
      setState({
        canvas: canvasRef.current,
        ctx: ctx
      });
    }
  }, [state]);
  return {
    canvasRef: canvasRef,
    ctx: state === null || state === void 0 ? void 0 : state.ctx,
    canvas: state === null || state === void 0 ? void 0 : state.canvas
  };
}

var defaultStyle = {
  strokeStyle: 'transparent',
  fillStyle: 'transparent'
};
var defaultTextStyle = {
  font: '12px Lucida Grande'
};

function drawRect(ctx, rect, attrs) {
  Object.assign(ctx, defaultStyle, attrs);

  if (attrs.fillStyle) {
    ctx.fillRect(Math.floor(rect.position.x), Math.floor(rect.position.y), Math.floor(rect.size.x), Math.floor(rect.size.y));
  }

  if (attrs.strokeStyle) {
    ctx.strokeRect(Math.floor(rect.position.x), Math.floor(rect.position.y), Math.max(Math.floor(rect.size.x - 1), 0), Math.max(Math.floor(rect.size.y - 1, 0)));
  }
}

function drawTextRect(ctx, text, rect, attrs, props) {
  var _props$offset$x, _props$offset, _props$offset$y, _props$offset2;

  ctx.save();
  Object.assign(ctx, defaultTextStyle, attrs);
  ctx.rect(Math.floor(rect.position.x), Math.floor(rect.position.y), Math.floor(rect.size.x), Math.floor(rect.size.y));
  ctx.clip();
  ctx.fillText(text, Math.floor(rect.position.x + ((_props$offset$x = props === null || props === void 0 ? void 0 : (_props$offset = props.offset) === null || _props$offset === void 0 ? void 0 : _props$offset.x) !== null && _props$offset$x !== void 0 ? _props$offset$x : 0)), Math.floor(rect.position.y + ((_props$offset$y = props === null || props === void 0 ? void 0 : (_props$offset2 = props.offset) === null || _props$offset2 === void 0 ? void 0 : _props$offset2.y) !== null && _props$offset$y !== void 0 ? _props$offset$y : 0)));
  ctx.restore();
}