import logo from './logo.svg';
import './App.css';

import debounce from 'debounce';

import React from 'react';

const {useEffect, useMemo, useRef, useState, useCallback} = React;

const colors = [
  '#ff1e47', // r
  '#ffa400', // o
  '#fff823', // y
  '#9cff42', // g
  '#23c2ff', // b
  '#6c3fd8', // i
  '#bb71ff', // v
];

function range(size, startAt = 0) {
  return [...Array(size).keys()].map((i) => i + startAt);
}

function scaleMapper(domain, range, rangeSize, domainValue) {
  // normalize to 0.0...1.0
  const normalized = (domainValue - domain[0]) / (domain[1] - domain[0]);
  // scale to range[0]...range[1]
  return normalized * rangeSize + range[0];
}

function scaleLinear(domain, range) {
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

const defaultStyle = {
  strokeStyle: 'transparent',
  fillStyle: 'transparent',
};

const scaleDegrees = range(7);

class Vector2 {
  constructor({x, y} = {}) {
    this.x = x ?? 0;
    this.y = y ?? 0;
  }

  clone() {
    return new Vector2(this);
  }

  copyFrom({x, y} = {}) {
    this.x = x ?? 0;
    this.y = y ?? 0;
  }

  add(other) {
    this.x += other.x;
    this.y += other.y;
    return this;
  }

  sub(other) {
    this.x -= other.x;
    this.y -= other.y;
    return this;
  }

  mul(other) {
    this.x *= other.x;
    this.y *= other.y;
    return this;
  }

  div(other) {
    this.x /= other.x;
    this.y /= other.y;
    return this;
  }
}

class Rect {
  constructor({position, size} = {}) {
    this.position = new Vector2(position);
    this.size = new Vector2(size);
  }

  containsPoint(point) {
    if (
      // min
      point.x > this.position.x &&
      point.y > this.position.y &&
      // max
      point.x < this.position.x + this.size.x &&
      point.y < this.position.y + this.size.y
    ) {
      return true;
    }
    return false;
  }
}

function useViewportControls(canvas, handlers) {
  const [viewportState, setViewportState] = useState(() => ({
    zoom: new Vector2({x: 1, y: 1}),
    pan: new Vector2(),
  }));

  const stateRef = useRef({
    isMouseDown: false,
    dragMoved: false,
    panAtDragStart: new Vector2(),
    currentPan: new Vector2(),
    startMousePos: new Vector2(),
  });

  useEffect(() => {
    // store pan value on ref every time it changes so our event handlers can
    // access it without needing to be re-bound every time it changes
    stateRef.current.currentPan.copyFrom(viewportState.pan);
  }, [viewportState]);

  useEffect(() => {
    if (!canvas) return;
    function onmousedown(e) {
      stateRef.current.isMouseDown = true;
      stateRef.current.dragMoved = false;

      stateRef.current.panAtDragStart.copyFrom(stateRef.current.currentPan);
      stateRef.current.startMousePos.copyFrom(getMouseEventPos(e, canvas));
    }

    function onmouseup(e) {
      if (!stateRef.current.dragMoved) {
        handlers?.onSelect(e);
      }
      stateRef.current.isMouseDown = false;
      stateRef.current.dragMoved = false;
    }

    function onmousemove(e) {
      if (stateRef.current.isMouseDown) {
        stateRef.current.dragMoved = true;

        const movementSinceStart = getMouseEventPos(e, canvas).sub(
          stateRef.current.startMousePos
        );

        setViewportState((s) => {
          // pan is in world (unzoomed) coords so we must scale our translations
          const translation = movementSinceStart.clone().div(s.zoom).mul({
            x: -1,
            y: -1,
          });
          return {
            ...s,
            pan: translation.add(stateRef.current.panAtDragStart),
            // pan: s.pan.clone().mul(s.zoom).sub(movement).div(s.zoom),
          };
        });
      }
    }

    function onwheel(e) {
      e.preventDefault();
      e.stopPropagation();

      // implements mouse-position-aware zoom

      const viewSize = new Vector2({
        x: canvas.width,
        y: canvas.height,
      }).div({x: 2, y: 2});
      // zoom centered on mouse
      const mousePosInView = getMouseEventPos(e, canvas);

      setViewportState((s) => {
        const deltaY = e.deltaY;
        // is zoom in pixels or lines?
        if (e.deltaMode > 0) deltaY *= 100;

        // this is just manually tuned, it relates to the scale of mousewheel movement values
        const zoomSpeed = 0.005;

        const zoomScaleFactor = 1 + zoomSpeed * -deltaY;

        const updatedZoom = s.zoom
          .clone()
          .mul({x: zoomScaleFactor, y: zoomScaleFactor});
        updatedZoom.y = 1; // lock zoom to x axis

        // find where the mouse is in (unzoomed) world coords
        const mousePosWorld = mousePosInView.clone().div(s.zoom).add(s.pan);
        // find mouse (zoomed) coords at new zoom, sub mouse viewport offset to
        // get viewport offset (zoomed coords), then unzoom to get global pan
        const updatedPan = mousePosWorld
          .clone()
          .mul(updatedZoom)
          .sub(mousePosInView)
          .div(updatedZoom);

        return {
          ...s,
          zoom: updatedZoom,
          pan: updatedPan,
        };
      });
    }

    canvas.addEventListener('mousedown', onmousedown);
    canvas.addEventListener('mouseup', onmouseup);
    canvas.addEventListener('mousemove', onmousemove);

    canvas.addEventListener('wheel', onwheel);

    return () => {
      canvas.removeEventListener('mousedown', onmousedown);
      canvas.removeEventListener('mouseup', onmouseup);
      canvas.removeEventListener('mousemove', onmousemove);
      canvas.removeEventListener('wheel', onwheel);
    };
  }, [canvas]);

  return [viewportState, setViewportState];
}

function useViewport({zoom, pan}) {
  return useMemo(
    () => ({
      sizeToScreen(size) {
        // just scale
        return new Vector2(size).mul(zoom);
      },
      positionToScreen(position) {
        // translate then scale, as pan is in world (unzoomed) coords
        return new Vector2(position).sub(pan).mul(zoom);
      },
    }),
    [zoom, pan]
  );
}

function useWindowDimensions() {
  const [windowDimensions, setWindowDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    window.addEventListener(
      'resize',
      debounce(() => {
        setWindowDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }, 300)
    );
  }, []);

  return windowDimensions;
}

function useCanvasContext2d() {
  const canvasRef = useRef(null);
  const [state, setState] = useState(null);

  useEffect(() => {
    if (canvasRef.current && (!state || state.canvas != canvasRef.current)) {
      setState({
        canvas: canvasRef.current,
        ctx: canvasRef.current?.getContext('2d'),
      });
    }
  });
  return {
    canvasRef,
    ctx: state?.ctx,
  };
}

const initialEvents = [
  {degree: 0, start: 0, duration: 1},
  {degree: 3, start: 4, duration: 1},
  {degree: 5, start: 5, duration: 2},
  {degree: 6, start: 6, duration: 3},
];

function drawRect(ctx, rect, attrs) {
  Object.assign(ctx, defaultStyle, attrs);

  if (attrs.fillStyle) {
    ctx.fillRect(rect.position.x, rect.position.y, rect.size.x, rect.size.y);
  }
  if (attrs.strokeStyle) {
    ctx.strokeRect(rect.position.x, rect.position.y, rect.size.x, rect.size.y);
  }
}

function getExtents(events) {
  if (events.length === 0) {
    return {
      start: 0,
      end: 0,
      size: 0,
    };
  }

  const start = events.reduce((acc, ev) => Math.min(acc, ev.start), Infinity);
  const end = events.reduce(
    (acc, ev) => Math.max(acc, ev.start + ev.duration),
    -Infinity
  );
  return {
    start,
    end,
    size: end - start,
  };
}

function getMouseEventPos(event, canvas) {
  var rect = canvas.getBoundingClientRect();
  return new Vector2({
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  });
}

const TIMELINE_ROW_HEIGHT = 20;
const QUARTER_NOTE_WIDTH = 10;

function App() {
  const {canvasRef, ctx} = useCanvasContext2d();

  const [events, setEvents] = useState(initialEvents);

  const extents = useMemo(() => getExtents(events), [events]);

  const drawnElementsRef = useRef([]);
  const [selection, setSelection] = useState(null);
  const [cursor, setCursor] = useState(() => new Vector2());

  const onSelect = useCallback((e) => {
    const mousePos = getMouseEventPos(e, canvasRef.current);

    let intersecting = null;

    // iterate in reverse to visit frontmost rects first
    for (var i = drawnElementsRef.current.length - 1; i >= 0; i--) {
      const drawnEl = drawnElementsRef.current[i];

      const intersection = drawnEl.rect.containsPoint(mousePos);
      if (intersection) {
        // clicked on this rect
        intersecting = drawnEl.object;
        break;
      }
    }

    setSelection(intersecting);
    setCursor(mousePos);
  });

  const [
    viewportState,
    setViewportState,
  ] = useViewportControls(canvasRef.current, {onSelect});

  const viewport = useViewport(viewportState);

  const windowDimensions = useWindowDimensions();

  useEffect(() => {
    if (!ctx) return;
    // clear
    ctx.canvas.width = windowDimensions.width;
    ctx.canvas.height = windowDimensions.height;

    drawnElementsRef.current = [];

    scaleDegrees.forEach((i) => {
      ctx.globalAlpha = 0.2;
      drawRect(
        ctx,
        new Rect({
          position: viewport.positionToScreen({
            x: 0,
            y: i * TIMELINE_ROW_HEIGHT,
          }),
          size: viewport.sizeToScreen({
            x:
              Math.ceil((extents.start + extents.size) / 4) *
              4 *
              QUARTER_NOTE_WIDTH,
            y: TIMELINE_ROW_HEIGHT,
          }),
        }),
        {
          fillStyle: colors[i],
        }
      );

      ctx.globalAlpha = 1;
    });

    events.forEach((ev) => {
      const rect = new Rect({
        position: viewport.positionToScreen({
          x: ev.start * QUARTER_NOTE_WIDTH,
          y: ev.degree * TIMELINE_ROW_HEIGHT,
        }),
        size: viewport.sizeToScreen({
          x: ev.duration * QUARTER_NOTE_WIDTH,
          y: TIMELINE_ROW_HEIGHT,
        }),
      });
      drawRect(ctx, rect, {
        fillStyle: colors[ev.degree],
        strokeStyle: selection === ev ? 'white' : null,
      });

      drawnElementsRef.current.push({
        rect,
        object: ev,
      });

      drawRect(
        ctx,
        new Rect({
          position: cursor,
          size: {x: 1, y: 1},
        }),
        {
          fillStyle: 'white',
        }
      );
    });
  }, [ctx, events, viewport, cursor, selection, windowDimensions]);

  return (
    <canvas
      ref={canvasRef}
      width={1000}
      height={600}
      style={{
        overflow: 'hidden',
        // filter: 'invert(100%)',
      }}
    />
  );
}

export default App;
