"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getSelectionBox = getSelectionBox;
exports.SelectBox = exports.SelectBoxBehavior = exports.DragEventBehavior = void 0;

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _assertThisInitialized2 = _interopRequireDefault(require("@babel/runtime/helpers/assertThisInitialized"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _Vector = _interopRequireDefault(require("./Vector2"));

var _Rect = _interopRequireDefault(require("./Rect"));

var _mouseUtils = require("./mouseUtils");

var _react = _interopRequireDefault(require("react"));

var _behavior = require("./behavior");

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

var useState = _react.default.useState,
    useImperativeHandle = _react.default.useImperativeHandle,
    forwardRef = _react.default.forwardRef;

function getSelectionBox(start, end) {
  var startX = Math.min(start.x, end.x);
  var startY = Math.min(start.y, end.y);
  var endX = Math.max(start.x, end.x);
  var endY = Math.max(start.y, end.y);
  return new _Rect.default({
    position: new _Vector.default({
      x: startX,
      y: startY
    }),
    size: new _Vector.default({
      x: endX - startX,
      y: endY - startY
    })
  });
}

var DragEventBehavior = /*#__PURE__*/function (_Behavior) {
  (0, _inherits2.default)(DragEventBehavior, _Behavior);

  var _super = _createSuper(DragEventBehavior);

  function DragEventBehavior() {
    var _this;

    (0, _classCallCheck2.default)(this, DragEventBehavior);

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _this = _super.call.apply(_super, [this].concat(args));
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "draggedEvents", []);
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "dragStartPos", new _Vector.default());
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "onMouseDown", function (e) {
      var mousePos = (0, _mouseUtils.getMouseEventPos)(e, _this.canvas);

      var draggedEvent = _this.props.getEventAtPos(mousePos);

      if (draggedEvent) {
        if (_this.acquireLock('drag')) {
          var _this$props$selection, _this$props$selection2;

          var draggedSelection = (_this$props$selection = _this.props.selection) !== null && _this$props$selection !== void 0 ? _this$props$selection : new Set();

          _this.dragStartPos.copyFrom(mousePos);

          if (!((_this$props$selection2 = _this.props.selection) !== null && _this$props$selection2 !== void 0 && _this$props$selection2.has(draggedEvent.id))) {
            var _this$props$setSelect, _this$props;

            var newSelection = new Set([draggedEvent.id]);
            draggedSelection = newSelection;
            (_this$props$setSelect = (_this$props = _this.props).setSelection) === null || _this$props$setSelect === void 0 ? void 0 : _this$props$setSelect.call(_this$props, newSelection);
          } // take a copy of the events at the time we started dragging


          _this.draggedEvents = [];
          draggedSelection.forEach(function (id) {
            return _this.draggedEvents.push(_this.props.eventsMap.get(id));
          });
        }
      }
    });
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "onMouseUp", function (e) {
      var _this$props$onDragCom, _this$props2;

      if (!_this.hasLock('drag')) return;
      var mousePos = (0, _mouseUtils.getMouseEventPos)(e, _this.canvas);
      (_this$props$onDragCom = (_this$props2 = _this.props).onDragComplete) === null || _this$props$onDragCom === void 0 ? void 0 : _this$props$onDragCom.call(_this$props2, _this.draggedEvents, {
        to: mousePos,
        from: _this.dragStartPos
      });

      _this.releaseLock('drag');
    });
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "onMouseOut", function (e) {
      _this.releaseLock('drag');
    });
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "onMouseMove", function (e) {
      var _this$props$onDragMov, _this$props3;

      if (!_this.hasLock('drag')) return;
      var mousePos = (0, _mouseUtils.getMouseEventPos)(e, _this.canvas);
      (_this$props$onDragMov = (_this$props3 = _this.props).onDragMove) === null || _this$props$onDragMov === void 0 ? void 0 : _this$props$onDragMov.call(_this$props3, _this.draggedEvents, {
        to: mousePos,
        from: _this.dragStartPos
      });
    });
    return _this;
  }

  (0, _createClass2.default)(DragEventBehavior, [{
    key: "getEventHandlers",
    value: function getEventHandlers() {
      return {
        mousemove: this.onMouseMove,
        // mouseout: this.onMouseOut,
        mouseup: this.onMouseUp,
        mousedown: this.onMouseDown
      };
    }
  }]);
  return DragEventBehavior;
}(_behavior.Behavior);

exports.DragEventBehavior = DragEventBehavior;

var SelectBoxBehavior = /*#__PURE__*/function (_Behavior2) {
  (0, _inherits2.default)(SelectBoxBehavior, _Behavior2);

  var _super2 = _createSuper(SelectBoxBehavior);

  function SelectBoxBehavior() {
    var _this2;

    (0, _classCallCheck2.default)(this, SelectBoxBehavior);

    for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }

    _this2 = _super2.call.apply(_super2, [this].concat(args));
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this2), "rect", new _Rect.default());
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this2), "selectionStart", new _Vector.default());
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this2), "selectionEnd", new _Vector.default());
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this2), "onMouseDown", function (e) {
      if (_this2.acquireLock('drag')) {
        _this2.selectionStart.copyFrom((0, _mouseUtils.getMouseEventPos)(e, _this2.canvas));

        _this2.selectionEnd.copyFrom(_this2.selectionStart);
      }
    });
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this2), "onMouseUp", function (e) {
      var _this2$props$setSelec, _this2$props, _this2$props$onSelect, _this2$props2;

      if (!_this2.hasLock('drag')) return;

      _this2.releaseLock('drag');

      (_this2$props$setSelec = (_this2$props = _this2.props).setSelectBoxRect) === null || _this2$props$setSelec === void 0 ? void 0 : _this2$props$setSelec.call(_this2$props, null);
      var selectBoxRect = getSelectionBox(_this2.selectionStart, _this2.selectionEnd);
      (_this2$props$onSelect = (_this2$props2 = _this2.props).onSelectRect) === null || _this2$props$onSelect === void 0 ? void 0 : _this2$props$onSelect.call(_this2$props2, selectBoxRect);
    });
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this2), "onMouseOut", function (e) {
      var _this2$props$setSelec2, _this2$props3;

      if (!_this2.hasLock('drag')) return;

      _this2.releaseLock('drag');

      (_this2$props$setSelec2 = (_this2$props3 = _this2.props).setSelectBoxRect) === null || _this2$props$setSelec2 === void 0 ? void 0 : _this2$props$setSelec2.call(_this2$props3, null);
    });
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this2), "onMouseMove", function (e) {
      var _this2$props$setSelec3, _this2$props4;

      if (!_this2.hasLock('drag')) return;

      _this2.selectionEnd.copyFrom((0, _mouseUtils.getMouseEventPos)(e, _this2.canvas));

      var selectBoxRect = getSelectionBox(_this2.selectionStart, _this2.selectionEnd);
      (_this2$props$setSelec3 = (_this2$props4 = _this2.props).setSelectBoxRect) === null || _this2$props$setSelec3 === void 0 ? void 0 : _this2$props$setSelec3.call(_this2$props4, selectBoxRect);
    });
    return _this2;
  }

  (0, _createClass2.default)(SelectBoxBehavior, [{
    key: "onDisabled",
    value: function onDisabled() {
      var _this$props$setSelect2, _this$props4;

      (_this$props$setSelect2 = (_this$props4 = this.props).setSelectBoxRect) === null || _this$props$setSelect2 === void 0 ? void 0 : _this$props$setSelect2.call(_this$props4, null);
    }
  }, {
    key: "getEventHandlers",
    value: function getEventHandlers() {
      return {
        mousemove: this.onMouseMove,
        mouseout: this.onMouseOut,
        mouseup: this.onMouseUp,
        mousedown: this.onMouseDown
      };
    }
  }]);
  return SelectBoxBehavior;
}(_behavior.Behavior);

exports.SelectBoxBehavior = SelectBoxBehavior;

var SelectBox = /*#__PURE__*/_react.default.memo(forwardRef(function SelectBox(props, ref) {
  var _useState = useState(null),
      _useState2 = (0, _slicedToArray2.default)(_useState, 2),
      selectBoxRect = _useState2[0],
      setSelectBoxRect = _useState2[1];

  useImperativeHandle(ref, function () {
    return {
      setSelectBoxRect: setSelectBoxRect
    };
  });
  return /*#__PURE__*/_react.default.createElement("div", {
    style: {
      height: 0,
      width: 0
    }
  }, selectBoxRect && /*#__PURE__*/_react.default.createElement("div", {
    style: {
      transform: "translate3d(".concat(selectBoxRect.position.x, "px,").concat(selectBoxRect.position.y, "px,0)"),
      backgroundColor: 'white',
      opacity: 0.3,
      pointerEvents: 'none',
      width: selectBoxRect.size.x,
      height: selectBoxRect.size.y
    }
  }));
}));

exports.SelectBox = SelectBox;