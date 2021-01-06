"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

require("./App.css");

var _react = _interopRequireDefault(require("react"));

var _reactDom = _interopRequireDefault(require("react-dom"));

var _viewport = require("./viewport");

var _canvasUtils = require("./canvasUtils");

var _renderableRect = require("./renderableRect");

var _windowUtils = require("./windowUtils");

var _behavior = require("./behavior");

var _Vector = _interopRequireDefault(require("./Vector2"));

var _Rect = _interopRequireDefault(require("./Rect"));

var _utils = require("./utils");

var _selection = require("./selection");

var _useLocalStorageAsync5 = _interopRequireDefault(require("./useLocalStorageAsync"));

var _Controls = _interopRequireDefault(require("./Controls"));

var _Tooltip = require("./Tooltip");

var _mathUtils = require("./mathUtils");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

var useEffect = _react.default.useEffect,
    useMemo = _react.default.useMemo,
    useRef = _react.default.useRef,
    useState = _react.default.useState,
    useCallback = _react.default.useCallback,
    useImperativeHandle = _react.default.useImperativeHandle,
    forwardRef = _react.default.forwardRef;
var colors = ['#ff1e47', // r
'#ffa400', // o
'#fff823', // y
'#9cff42', // g
'#23c2ff', // b
'#6c3fd8', // i
'#bb71ff' // v
];
var TIMELINE_ROW_HEIGHT = 20;
var QUARTER_NOTE_WIDTH = 10;
var scaleDegrees = (0, _utils.range)(7);
var initialEvents = [{
  degree: 0,
  start: 0,
  duration: 1
}, {
  degree: 3,
  start: 4,
  duration: 1
}, {
  degree: 5,
  start: 5,
  duration: 2
}, {
  degree: 6,
  start: 6,
  duration: 3
}].map(function (ev, index) {
  return _objectSpread(_objectSpread({}, ev), {}, {
    id: index
  });
});

function getExtents(events) {
  if (events.length === 0) {
    return {
      start: 0,
      end: 0,
      size: 0,
      minDegree: 0,
      maxDegree: scaleDegrees.length - 1
    };
  }

  var minDegree = events.reduce(function (acc, ev) {
    return Math.min(acc, ev.degree);
  }, 0);
  var maxDegree = events.reduce(function (acc, ev) {
    return Math.max(acc, ev.degree);
  }, scaleDegrees.length - 1);
  var start = events.reduce(function (acc, ev) {
    return Math.min(acc, ev.start);
  }, Infinity);
  var end = events.reduce(function (acc, ev) {
    return Math.max(acc, ev.start + ev.duration);
  }, -Infinity);
  return {
    start: start,
    end: end,
    size: end - start,
    minDegree: minDegree,
    maxDegree: maxDegree
  };
}

var LOCALSTORAGE_CONFIG = {
  baseKey: 'roygbiv',
  schemaVersion: '2'
};

function TooltipContent(_ref) {
  var event = _ref.event;
  return JSON.stringify(event);
}

function App() {
  var _selectBoxRef$current, _tooltipRef$current;

  var _useCanvasContext2d = (0, _canvasUtils.useCanvasContext2d)(),
      canvasRef = _useCanvasContext2d.canvasRef,
      ctx = _useCanvasContext2d.ctx,
      canvas = _useCanvasContext2d.canvas;

  var _useState = useState(initialEvents),
      _useState2 = (0, _slicedToArray2.default)(_useState, 2),
      events = _useState2[0],
      setEvents = _useState2[1];

  var eventsMap = useMemo(function () {
    return new Map(events.map(function (ev) {
      return [ev.id, ev];
    }));
  }, [events]);
  var extents = useMemo(function () {
    return getExtents(events);
  }, [events]); // map from pixels (unzoomed) to scale degrees

  var quantizerY = useMemo(function () {
    return (0, _utils.scaleDiscreteQuantized)([0, (scaleDegrees.length - 1) * TIMELINE_ROW_HEIGHT], // continuous
    [scaleDegrees[0], scaleDegrees[scaleDegrees.length - 1]], // discrete
    {
      stepSize: 1,
      round: Math.round
    });
  }, []); // map from pixels (unzoomed) to quarter notes

  var quantizerX = useMemo(function () {
    return (0, _utils.scaleDiscreteQuantized)([0, QUARTER_NOTE_WIDTH], // continuous
    [0, 1], // discrete
    {
      stepSize: 1,
      round: Math.round
    });
  }, []);
  var renderedRectsRef = useRef([]);

  var _useState3 = useState(new Set()),
      _useState4 = (0, _slicedToArray2.default)(_useState3, 2),
      selection = _useState4[0],
      setSelection = _useState4[1];

  var _useLocalStorageAsync = (0, _useLocalStorageAsync5.default)('mode', 'select', LOCALSTORAGE_CONFIG),
      _useLocalStorageAsync2 = (0, _slicedToArray2.default)(_useLocalStorageAsync, 2),
      mode = _useLocalStorageAsync2[0],
      setMode = _useLocalStorageAsync2[1];

  var _useLocalStorageAsync3 = (0, _useLocalStorageAsync5.default)('viewportState', _viewport.makeViewportState, _objectSpread(_objectSpread({}, _viewport.ViewportStateSerializer), LOCALSTORAGE_CONFIG)),
      _useLocalStorageAsync4 = (0, _slicedToArray2.default)(_useLocalStorageAsync3, 2),
      viewportState = _useLocalStorageAsync4[0],
      setViewportState = _useLocalStorageAsync4[1];

  var viewport = (0, _viewport.useViewport)(viewportState);
  var onDragMove = useCallback(function (draggedEvents, pos) {
    var delta = pos.to.clone().sub(pos.from);
    var draggedEventsMap = new Map(draggedEvents.map(function (ev) {
      return [ev.id, ev];
    }));
    setEvents(function (events) {
      return events.map(function (ev) {
        if (draggedEventsMap.has(ev.id)) {
          var deltaXQuantized = quantizerX.scale(viewport.sizeXFromScreen(delta.x));
          var deltaYQuantized = quantizerY.scale(viewport.sizeYFromScreen(delta.y));
          var eventBeforeDrag = draggedEventsMap.get(ev.id);
          return _objectSpread(_objectSpread({}, ev), {}, {
            // as the delta is since drag start, we need to use the copy of
            // the event at drag start
            start: eventBeforeDrag.start + deltaXQuantized,
            degree: eventBeforeDrag.degree + deltaYQuantized
          });
        }

        return ev;
      });
    });
  }, [viewport, quantizerX, quantizerY]);
  var onSelectRect = useCallback(function (selectBoxRect) {
    var intersecting = (0, _renderableRect.findIntersectingEvents)(selectBoxRect, renderedRectsRef.current);
    setSelection(new Set(intersecting.map(function (ev) {
      return ev.id;
    })));
  }, []);
  var getEventAtPos = useCallback(function (pos) {
    return (0, _renderableRect.getIntersectingEvent)(pos, renderedRectsRef.current);
  }, []);
  var selectBoxRef = useRef(null);
  var tooltipRef = useRef(null);
  (0, _behavior.useBehaviors)(function () {
    var controller = new _behavior.BehaviorController();
    controller.addBehavior('dragPan', _viewport.DragPanBehavior, 1);
    controller.addBehavior('wheelZoom', _viewport.WheelZoomBehavior, 1);
    controller.addBehavior('wheelScroll', _viewport.WheelScrollBehavior, 1);
    controller.addBehavior('dragEvent', _selection.DragEventBehavior, 2);
    controller.addBehavior('selection', _selection.SelectBoxBehavior, 1);
    controller.addBehavior('tooltip', _Tooltip.TooltipBehavior, 1);
    return controller;
  }, {
    canvas: canvas,
    props: {
      dragPan: {
        viewportState: viewportState,
        setViewportState: setViewportState
      },
      wheelZoom: {
        dimensions: {
          x: true
        },
        viewportState: viewportState,
        setViewportState: setViewportState
      },
      wheelScroll: {
        viewportState: viewportState,
        setViewportState: setViewportState
      },
      dragEvent: {
        getEventAtPos: getEventAtPos,
        onDragMove: onDragMove,
        selection: selection,
        setSelection: setSelection,
        eventsMap: eventsMap
      },
      selection: {
        setSelectBoxRect: (_selectBoxRef$current = selectBoxRef.current) === null || _selectBoxRef$current === void 0 ? void 0 : _selectBoxRef$current.setSelectBoxRect,
        onSelectRect: onSelectRect
      },
      tooltip: {
        getEventAtPos: getEventAtPos,
        setTooltip: (_tooltipRef$current = tooltipRef.current) === null || _tooltipRef$current === void 0 ? void 0 : _tooltipRef$current.setTooltip
      }
    },
    enabled: {
      dragPan: mode === 'pan',
      wheelZoom: mode === 'pan',
      wheelScroll: mode !== 'pan',
      selection: mode === 'select',
      dragEvent: mode === 'select'
    }
  });
  var windowDimensions = (0, _windowUtils.useWindowDimensions)();
  var canvasLogicalDimensions = windowDimensions; // rendering

  useEffect(function () {
    if (!ctx) return;
    var canvas = ctx.canvas;
    var dpr = (0, _windowUtils.getDPR)(); // clear canvas & update to fill window

    canvas.width = canvasLogicalDimensions.width * dpr;
    canvas.height = canvasLogicalDimensions.height * dpr;
    canvas.style.width = "".concat(canvasLogicalDimensions.width, "px");
    canvas.style.height = "".concat(canvasLogicalDimensions.height, "px"); // Scale all drawing operations by the dpr, so you
    // don't have to worry about the difference.

    ctx.scale(dpr, dpr);
    renderedRectsRef.current = [];

    for (var i = extents.minDegree; i <= extents.maxDegree; i++) {
      var rect = new _Rect.default({
        position: viewport.positionToScreen({
          x: 0,
          y: i * TIMELINE_ROW_HEIGHT
        }),
        size: viewport.sizeToScreen({
          x: Math.ceil((extents.start + extents.size) / 4) * 4 * QUARTER_NOTE_WIDTH,
          y: TIMELINE_ROW_HEIGHT
        })
      });
      ctx.globalAlpha = 0.2;
      (0, _canvasUtils.drawRect)(ctx, rect, {
        fillStyle: colors[(0, _mathUtils.wrap)(i, colors.length)]
      });
      ctx.globalAlpha = 1;
      (0, _canvasUtils.drawTextRect)(ctx, String(i + 1), rect, {
        fillStyle: colors[(0, _mathUtils.wrap)(i, colors.length)]
      }, {
        offset: {
          x: 3,
          y: 14
        }
      });
    }

    events.forEach(function (ev) {
      var rect = new _Rect.default({
        position: viewport.positionToScreen({
          x: quantizerX.invert(ev.start),
          y: quantizerY.invert(ev.degree)
        }),
        size: viewport.sizeToScreen({
          x: ev.duration * QUARTER_NOTE_WIDTH,
          y: TIMELINE_ROW_HEIGHT
        })
      });
      (0, _canvasUtils.drawRect)(ctx, rect, {
        fillStyle: colors[(0, _mathUtils.wrap)(ev.degree, colors.length)],
        strokeStyle: selection.has(ev.id) ? 'white' : null
      });
      renderedRectsRef.current.push({
        rect: rect,
        object: ev
      });
    });
  }, [ctx, events, viewport, selection, canvasLogicalDimensions, extents.start, extents.size, extents.minDegree, extents.maxDegree, quantizerX, quantizerY]);
  return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement(_selection.SelectBox, {
    ref: selectBoxRef
  }), /*#__PURE__*/_react.default.createElement(_Tooltip.Tooltip, {
    ref: tooltipRef,
    component: TooltipContent
  }), /*#__PURE__*/_react.default.createElement("canvas", {
    ref: canvasRef,
    width: 1000,
    height: 600,
    style: {
      overflow: 'hidden',
      cursor: mode === 'pan' ? 'grab' : null
    }
  }), /*#__PURE__*/_react.default.createElement(_Controls.default, {
    mode: mode,
    onModeChange: setMode,
    viewportState: viewportState,
    onViewportStateChange: setViewportState,
    canvasLogicalDimensions: canvasLogicalDimensions
  }));
}

var _default = App;
exports.default = _default;