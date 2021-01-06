"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useBehaviors = useBehaviors;
exports.Behavior = exports.BehaviorController = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireDefault(require("react"));

var _useRefOnce = _interopRequireDefault(require("./useRefOnce"));

var useEffect = _react.default.useEffect;

var BehaviorController = /*#__PURE__*/function () {
  function BehaviorController() {
    var _this = this;

    (0, _classCallCheck2.default)(this, BehaviorController);
    (0, _defineProperty2.default)(this, "behaviors", {});
    (0, _defineProperty2.default)(this, "eventTypes", new Set());
    (0, _defineProperty2.default)(this, "boundEventTypes", new Set());
    (0, _defineProperty2.default)(this, "locks", {});
    (0, _defineProperty2.default)(this, "handleEvent", function (e) {
      Object.keys(_this.behaviors).sort(function (aKey, bKey) {
        var a = _this.behaviors[aKey];
        var b = _this.behaviors[bKey];
        return b.priority - a.priority;
      }).forEach(function (behaviorName) {
        var behavior = _this.behaviors[behaviorName];
        var behaviorEventSubscription = behavior.eventHandlers[e.type];

        if (behaviorEventSubscription && behavior.enabled) {
          behaviorEventSubscription(e, _this);
        }
      });
    });
  }

  (0, _createClass2.default)(BehaviorController, [{
    key: "acquireLock",
    // behaviors can call this to try to get exclusive control of some resource
    // (eg. dragging). they will receive it if only a lower pri behavior (or no
    // behavior) owns it
    value: function acquireLock(type, behavior, priority) {
      if (this.hasLock(type, behavior)) {
        return true;
      }

      if (this.locks[type] && this.locks[type].priority < priority) {
        this.releaseLock(type);
      }

      if (!this.locks[type]) {
        this.locks[type] = {
          behavior: behavior,
          priority: priority
        };
        Object.values(this.behaviors).forEach(function (behavior) {
          behavior.onAnyLockChange(type, true);
        });
        return true;
      }

      return false;
    }
  }, {
    key: "hasLock",
    value: function hasLock(type, behavior) {
      var _this$locks$type;

      return ((_this$locks$type = this.locks[type]) === null || _this$locks$type === void 0 ? void 0 : _this$locks$type.behavior) === behavior;
    }
  }, {
    key: "lockExists",
    value: function lockExists(type) {
      return this.locks[type] != null;
    }
  }, {
    key: "releaseLock",
    value: function releaseLock(type) {
      if (!this.locks[type]) return;
      this.locks[type].behavior.onReleaseLock(type);
      this.locks[type] = null;
      Object.values(this.behaviors).forEach(function (behavior) {
        behavior.onAnyLockChange(type, false);
      });
    }
  }, {
    key: "addBehavior",
    value: function addBehavior(name, BehaviorClass, priority) {
      var _this2 = this;

      if (this.behaviors[name]) throw new Error("already a behavior named ".concat(name));
      var behavior = new BehaviorClass(this, name, priority);
      behavior.eventHandlers = behavior.getEventHandlers();
      this.behaviors[name] = behavior; // add new event types

      Object.keys(behavior.eventHandlers).forEach(function (eventType) {
        return _this2.eventTypes.add(eventType);
      }); // if already bound to canvas, we need to ensure the correct set of handlers
      // are bound

      var canvas = this.canvas;

      if (canvas) {
        this.unbind();
        this.bind(canvas);
      }
    }
  }, {
    key: "bind",
    value: function bind(canvas) {
      var _this3 = this;

      this.canvas = canvas;
      this.eventTypes.forEach(function (type) {
        _this3.canvas.addEventListener(type, _this3.handleEvent);
      });
      this.boundEventTypes = new Set(this.eventTypes);
    }
  }, {
    key: "unbind",
    value: function unbind() {
      var _this4 = this;

      if (!this.canvas) return;
      this.boundEventTypes.forEach(function (type) {
        _this4.canvas.removeEventListener(type, _this4.handleEvent);
      });
      this.boundEventTypes = new Set();
      this.canvas = null;
    }
  }]);
  return BehaviorController;
}();

exports.BehaviorController = BehaviorController;

var Behavior = /*#__PURE__*/function () {
  function Behavior(controller, name, priority) {
    (0, _classCallCheck2.default)(this, Behavior);
    (0, _defineProperty2.default)(this, "enabled", true);
    (0, _defineProperty2.default)(this, "props", {});
    this.controller = controller;
    this.name = name;
    this.priority = priority;
  }

  (0, _createClass2.default)(Behavior, [{
    key: "setProps",
    value: function setProps(props) {
      this.receiveProps(this.props, props);
      this.props = props;
    }
  }, {
    key: "receiveProps",
    value: function receiveProps(prevProps, props) {}
  }, {
    key: "setEnabled",
    value: function setEnabled(enabled) {
      var _this5 = this;

      if (this.enabled !== enabled) {
        if (enabled) {
          this.onEnabled();
        } else {
          // release any locks held by this behavior
          Object.keys(this.controller.locks).forEach(function (type) {
            if (_this5.controller.hasLock(type, _this5)) {
              _this5.controller.releaseLock(type);
            }
          });
          this.onDisabled();
        }

        this.enabled = enabled;
      }
    } // return a map of event handlers

  }, {
    key: "getEventHandlers",
    value: function getEventHandlers() {
      return {};
    } // run when lock for this behavior is released or lost due to
    // priority. use to clean up lock state

  }, {
    key: "onReleaseLock",
    value: function onReleaseLock(type) {} // run when changing from enabled to disabled

  }, {
    key: "onEnabled",
    value: function onEnabled() {}
  }, {
    key: "onDisabled",
    value: function onDisabled() {}
  }, {
    key: "acquireLock",
    value: function acquireLock(lock) {
      return this.controller.acquireLock(lock, this, this.priority);
    }
  }, {
    key: "releaseLock",
    value: function releaseLock(lock) {
      if (this.hasLock(lock)) {
        this.controller.releaseLock(lock);
      }
    }
  }, {
    key: "hasLock",
    value: function hasLock(lock) {
      return this.controller.hasLock(lock, this);
    }
  }, {
    key: "onAnyLockChange",
    value: function onAnyLockChange(type, locked) {}
  }, {
    key: "canvas",
    get: function get() {
      return this.controller.canvas;
    }
  }]);
  return Behavior;
}();

exports.Behavior = Behavior;

function useBehaviors(makeBehaviors, _ref) {
  var canvas = _ref.canvas,
      props = _ref.props,
      enabled = _ref.enabled;
  var controllerRef = (0, _useRefOnce.default)(makeBehaviors);
  var controller = controllerRef.current;
  useEffect(function () {
    Object.keys(props !== null && props !== void 0 ? props : {}).forEach(function (behaviorName) {
      controller.behaviors[behaviorName].setProps(props[behaviorName]);
    });
    Object.keys(enabled !== null && enabled !== void 0 ? enabled : {}).forEach(function (behaviorName) {
      if (enabled[behaviorName] != null) {
        controller.behaviors[behaviorName].setEnabled(enabled[behaviorName]);
      }
    });
  });
  useEffect(function () {
    if (!canvas) return;
    controller.bind(canvas);
    return function () {
      controller.unbind();
    };
  }, [canvas, controller]);
}