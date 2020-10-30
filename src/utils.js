export function range(size, startAt = 0) {
  return [...Array(size).keys()].map((i) => i + startAt);
}

function scaleMapper(domain, range, rangeSize, domainValue) {
  // normalize to 0.0...1.0
  const normalized = (domainValue - domain[0]) / (domain[1] - domain[0]);
  // scale to range[0]...range[1]
  return normalized * rangeSize + range[0];
}

export function scaleLinear(domain, range) {
  // map a value in domain[0]...domain[1] to range[0]...range[1]
  const domainSize = domain[1] - domain[0];
  const rangeSize = range[1] - range[0];

  // todo: implement optional clamping?
  return {
    scale(domainValue) {
      return scaleMapper(domain, range, rangeSize, domainValue);
    },
    invert(rangeValue) {
      return scaleMapper(range, domain, domainSize, rangeValue);
    },
  };
}
