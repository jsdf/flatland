"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.range = range;
exports.scaleLinear = scaleLinear;
exports.scaleDiscreteArbitrary = scaleDiscreteArbitrary;
exports.scaleDiscreteQuantized = scaleDiscreteQuantized;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

function range(size) {
  var startAt = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
  return (0, _toConsumableArray2.default)(Array(size).keys()).map(function (i) {
    return i + startAt;
  });
}

function scaleMapper(domain, range, rangeSize, domainValue) {
  // normalize to 0.0...1.0
  var normalized = (domainValue - domain[0]) / (domain[1] - domain[0]); // scale to range[0]...range[1]

  return normalized * rangeSize + range[0];
}

function scaleLinear(domain, range) {
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  if (domain[0] > domain[1]) {
    throw new Error('domain must go from smaller to larger');
  }

  if (range[0] > range[1]) {
    throw new Error('range must go from smaller to larger');
  } // map a value in domain[0]...domain[1] to range[0]...range[1]


  var domainSize = domain[1] - domain[0];
  var rangeSize = range[1] - range[0];
  return {
    scale: function scale(domainValue) {
      var scaled = scaleMapper(domain, range, rangeSize, domainValue);

      if (options.clamp) {
        scaled = Math.max(Math.min(range[1], scaled), range[0]);
      }

      return scaled;
    },
    invert: function invert(rangeValue) {
      var scaled = scaleMapper(range, domain, domainSize, rangeValue);

      if (options.clamp) {
        scaled = Math.max(Math.min(domain[1], scaled), domain[0]);
      }

      return scaled;
    }
  };
}

function scaleDiscreteArbitrary(domain, range) {
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var linear = scaleLinear(domain, [0, 1], options);
  return {
    scale: function scale(domainValue) {
      var rangeValue = linear.scale(domainValue);
      return range[Math.round((range.length - 1) * rangeValue)];
    },
    invert: function invert(rangeValue) {
      var index = range.indexOf(rangeValue);

      if (index === -1) {
        throw new Error('scaleQuantized value not in range');
      }

      return linear.invert(index / (range.length - 1));
    }
  };
}

function scaleDiscreteQuantized(domain, range) {
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var linear = scaleLinear(domain, range, options);
  var aliases = null;

  if (options.alias) {
    var _aliases;

    aliases = (_aliases = {}, (0, _defineProperty2.default)(_aliases, options.alias.domain, 'domain'), (0, _defineProperty2.default)(_aliases, options.alias.range, 'range'), _aliases);
  }

  if (options.stepSize == null) {
    throw new Error('stepSize option is required');
  }

  return {
    scale: function scale(domainValue) {
      var _options$round;

      var rangeValue = linear.scale(domainValue);
      var round = (_options$round = options.round) !== null && _options$round !== void 0 ? _options$round : Math.floor;
      return range[0] + round((rangeValue - range[0]) / options.stepSize) * options.stepSize;
    },
    invert: function invert(rangeValue) {
      return linear.invert(rangeValue);
    },
    to: function to(type, value) {
      if (!aliases || !(type in aliases)) {
        throw new Error("can't use to() without alias option");
      }

      if (aliases[type] == 'domain') {
        return this.invert(value);
      } else {
        return this.scale(value);
      }
    }
  };
}