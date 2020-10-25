import logo from './logo.svg';
import './App.css';

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

function useViewport({zoom, pan}) {
  return useMemo(
    () => ({
      sizeToScreen(size) {
        return new Vector2(size).mul(zoom);
      },
      positionToScreen(position) {
        return new Vector2(position).mul(zoom).add(pan);
      },
    }),
    [zoom, pan]
  );
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
  {degree: 6, start: 6, duration: 2},
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

  const [zoom, setZoom] = useState(() => new Vector2({x: 1, y: 1}));
  const [pan, setPan] = useState(() => new Vector2());
  const viewport = useViewport({zoom, pan});
  const [selection, setSelection] = useState(null);

  const drawnElementsRef = useRef([]);

  useEffect(() => {
    if (!ctx) return;
    // clear
    ctx.canvas.width = ctx.canvas.width;

    drawnElementsRef.current = [];

    scaleDegrees.forEach((i) => {
      ctx.globalAlpha = 0.2;
      drawRect(
        ctx,
        new Rect({
          position: viewport.positionToScreen({
            x: extents.start * QUARTER_NOTE_WIDTH,
            y: i * TIMELINE_ROW_HEIGHT,
          }),
          size: viewport.sizeToScreen({
            x: extents.size * QUARTER_NOTE_WIDTH,
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
    });
  }, [ctx, events, viewport]);

  const handleClick = useCallback((e) => {
    const mousePos = getMouseEventPos(e, canvasRef.current);

    // iterate in reverse to visit frontmost rects first
    for (var i = drawnElementsRef.current.length - 1; i >= 0; i--) {
      const drawnEl = drawnElementsRef.current[i];

      const intersection = drawnEl.rect.containsPoint(mousePos);
      if (intersection) {
        // clicked on this rect
        setSelection(drawnEl.object);
        break;
      }
    }

    setSelection(null);
  });

  return (
    <canvas
      ref={canvasRef}
      width={1000}
      height={600}
      onMouseUp={handleClick}
      style={{
        overflow: 'hidden',
        // filter: 'invert(100%)',
      }}
    />
  );
}

export default App;
