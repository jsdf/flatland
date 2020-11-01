import './App.css';

import debounce from 'debounce';

import React from 'react';
import ReactDOM from 'react-dom';

import {
  useViewport,
  useViewportControls,
  makeViewportState,
  ViewportStateSerializer,
} from './viewport';
import {getMouseEventPos} from './mouseUtils';
import Vector2 from './Vector2';
import Rect from './Rect';
import {range, scaleLinear} from './utils';

import {getSelectionBox} from './selection';
import useRefOnce from './useRefOnce';
import useLocalStorageAsync from './useLocalStorageAsync';

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

const TIMELINE_ROW_HEIGHT = 20;
const QUARTER_NOTE_WIDTH = 10;
const TOOLTIP_OFFSET = 8;

const defaultStyle = {
  strokeStyle: 'transparent',
  fillStyle: 'transparent',
};

const defaultTextStyle = {
  font: '12px Lucida Grande',
};

const scaleDegrees = range(7);

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

function getDPR() {
  return window.devicePixelRatio || 1;
}

function useCanvasContext2d() {
  const canvasRef = useRef(null);
  const [state, setState] = useState(null);

  useEffect(() => {
    if (canvasRef.current && (!state || state.canvas != canvasRef.current)) {
      const ctx = canvasRef.current?.getContext('2d');
      setState({
        canvas: canvasRef.current,
        ctx,
      });
    }
  }, [state]);

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
    ctx.fillRect(
      Math.floor(rect.position.x),
      Math.floor(rect.position.y),
      Math.floor(rect.size.x),
      Math.floor(rect.size.y)
    );
  }
  if (attrs.strokeStyle) {
    ctx.strokeRect(
      Math.floor(rect.position.x),
      Math.floor(rect.position.y),
      Math.max(Math.floor(rect.size.x - 1), 0),
      Math.max(Math.floor(rect.size.y - 1, 0))
    );
  }
}

function drawTextRect(ctx, text, rect, attrs, props) {
  ctx.save();
  Object.assign(ctx, defaultTextStyle, attrs);

  ctx.rect(
    Math.floor(rect.position.x),
    Math.floor(rect.position.y),
    Math.floor(rect.size.x),
    Math.floor(rect.size.y)
  );
  ctx.clip();

  ctx.fillText(
    text,
    Math.floor(rect.position.x + (props?.offset?.x ?? 0)),
    Math.floor(rect.position.y + (props?.offset?.y ?? 0))
  );

  ctx.restore();
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

function useRenderableElement() {
  const ref = useRef(null);

  const render = useCallback(function render(element) {
    if (!ref.current) return;

    ReactDOM.render(element, ref.current);
  }, []);

  return {
    ref,
    render,
  };
}

function getIntersectingEvent(point, drawnElements) {
  let intersecting = null;

  // iterate in reverse to visit frontmost rects first
  for (var i = drawnElements.length - 1; i >= 0; i--) {
    const drawnEl = drawnElements[i];

    const intersection = drawnEl.rect.containsPoint(point);
    if (intersection) {
      // clicked on this rect
      intersecting = drawnEl.object;
      break;
    }
  }

  return intersecting;
}

function findIntersectingEvents(rect, drawnElements) {
  let intersecting = [];
  // iterate in reverse to visit frontmost rects first
  for (var i = drawnElements.length - 1; i >= 0; i--) {
    const drawnEl = drawnElements[i];

    const intersection = drawnEl.rect.intersectsRect(rect);
    if (intersection) {
      // clicked on this rect
      intersecting.push(drawnEl.object);
    }
  }

  return intersecting;
}

function Tooltip({canvas, getEventAtPos}) {
  const tooltip = useRenderableElement();

  const onMouseMove = useCallback(
    (e) => {
      const mousePos = getMouseEventPos(e, canvas);

      const intersecting = getEventAtPos(mousePos);

      tooltip.render(
        intersecting ? (
          <div
            style={{
              transform: `translate3d(${mousePos.x + TOOLTIP_OFFSET}px,${
                mousePos.y + TOOLTIP_OFFSET
              }px,0)`,
              backgroundColor: 'white',
              pointerEvents: 'none',
              width: 'fit-content',

              userSelect: 'none',
              fontSize: 10,
              fontFamily: ' Lucida Grande',
              padding: '2px 4px',
              boxShadow: '3px 3px 5px rgba(0,0,0,0.4)',
            }}
          >
            {JSON.stringify(intersecting)}
          </div>
        ) : null
      );
    },
    [canvas]
  );

  useEffect(() => {
    if (!canvas) return;

    canvas.addEventListener('mousemove', onMouseMove);

    return () => {
      canvas.removeEventListener('mousemove', onMouseMove);
    };
  }, [canvas, onMouseMove]);

  return (
    <div
      ref={tooltip.ref}
      style={{
        height: 0,
        width: 0,
      }}
    />
  );
}

const Controls = React.memo(function Controls({mode, onModeChange}) {
  return (
    <div
      style={{
        position: 'absolute',
        width: 300,
        top: 0,
        right: 0,
        textAlign: 'right',
      }}
    >
      {['select', 'hand'].map((value) => (
        <button
          key={value}
          style={{
            background: value === mode ? '#fff' : '#ccc',
          }}
          onClick={() => onModeChange(value)}
        >
          {value}
        </button>
      ))}
    </div>
  );
});

class DragEventBehavior {
  dragging = false;
  props = {};

  setProps(props) {
    this.props = props;
  }

  setEnabled(enabled) {
    if (this.enabled === enabled) return;
    this.dragging = false;
    this.enabled = enabled;
  }

  bind(canvas) {
    this.canvas = canvas;

    this.canvas.addEventListener('mousedown', this.onMouseDown);
    this.canvas.addEventListener('mouseup', this.onMouseUp);
    this.canvas.addEventListener('mousemove', this.onMouseMove);
    this.canvas.addEventListener('mouseout', this.onMouseOut);
  }
  unbind() {
    if (!this.canvas) return;
    this.canvas.removeEventListener('mousedown', this.onMouseDown);
    this.canvas.removeEventListener('mouseup', this.onMouseUp);
    this.canvas.removeEventListener('mousemove', this.onMouseMove);
    this.canvas.removeEventListener('mouseout', this.onMouseOut);
    this.canvas = null;
  }

  onMouseDown = (e) => {
    if (!this.enabled) return;

    this.dragging = this.props.onDragStart?.(e);
  };

  onMouseUp = (e) => {
    if (!this.enabled) return;
    this.dragging = false;
  };

  onMouseOut = (e) => {
    if (!this.enabled) return;
    this.dragging = false;
  };

  onMouseMove = (e) => {
    if (!this.enabled) return;
    if (!this.dragging) return;

    this.props.onDragMove?.(e);
  };
}

class SelectBoxBehavior {
  rect = new Rect();
  selectionStart = new Vector2();
  selectionEnd = new Vector2();
  selecting = false;

  constructor(selectionBox, onSelectRect) {
    this.selectionBox = selectionBox;
    this.onSelectRect = onSelectRect;
  }

  setEnabled(enabled) {
    if (this.enabled === enabled) return;
    if (!enabled) {
      this.selectionBox.render(null);
      this.selecting = false;
    }
    this.enabled = enabled;
  }

  bind(canvas) {
    this.canvas = canvas;

    this.canvas.addEventListener('mousedown', this.onMouseDown);
    this.canvas.addEventListener('mouseup', this.onMouseUp);
    this.canvas.addEventListener('mousemove', this.onMouseMove);
    this.canvas.addEventListener('mouseout', this.onMouseOut);
  }
  unbind() {
    if (!this.canvas) return;
    this.canvas.removeEventListener('mousedown', this.onMouseDown);
    this.canvas.removeEventListener('mouseup', this.onMouseUp);
    this.canvas.removeEventListener('mousemove', this.onMouseMove);
    this.canvas.removeEventListener('mouseout', this.onMouseOut);
    this.canvas = null;
  }

  onMouseDown = (e) => {
    if (!this.enabled) return;
    this.selecting = true;
    this.selectionStart.copyFrom(getMouseEventPos(e, this.canvas));
    this.selectionEnd.copyFrom(this.selectionStart);
  };

  onMouseUp = (e) => {
    if (!this.enabled) return;
    this.selecting = false;
    this.selectionBox.render(null);

    const selectionBoxRect = getSelectionBox(
      this.selectionStart,
      this.selectionEnd
    );

    this.onSelectRect(selectionBoxRect);
  };

  onMouseOut = (e) => {
    if (!this.enabled) return;
    this.selecting = false;
    this.selectionBox.render(null);
  };

  onMouseMove = (e) => {
    if (!this.selecting) return;

    this.selectionEnd.copyFrom(getMouseEventPos(e, this.canvas));

    const selectionBoxRect = getSelectionBox(
      this.selectionStart,
      this.selectionEnd
    );

    this.selectionBox.render(
      <div
        style={{
          transform: `translate3d(${selectionBoxRect.position.x}px,${selectionBoxRect.position.y}px,0)`,
          backgroundColor: 'white',
          opacity: 0.3,
          pointerEvents: 'none',
          width: selectionBoxRect.size.x,
          height: selectionBoxRect.size.y,
        }}
      />
    );
  };
}

const SelectMode = React.memo(function SelectMode({
  onSelectRect,
  canvas,
  enabled,
}) {
  const selectionBox = useRenderableElement();

  const selectBoxBehaviorRef = useRefOnce(
    () => new SelectBoxBehavior(selectionBox, onSelectRect)
  );

  useEffect(() => {
    selectBoxBehaviorRef.current.setEnabled(enabled);
  }, [enabled]);

  useEffect(() => {
    if (!canvas) return;
    selectBoxBehaviorRef.current.bind(canvas);

    return () => {
      selectBoxBehaviorRef.current.unbind();
    };
  }, [canvas]);

  return (
    <div
      ref={selectionBox.ref}
      style={{
        height: 0,
        width: 0,
      }}
    />
  );
});

const LOCALSTORAGE_CONFIG = {
  baseKey: 'roygbiv',
  schemaVersion: '2',
};

function App() {
  const {canvasRef, ctx} = useCanvasContext2d();

  const [events, setEvents] = useState(initialEvents);

  const extents = useMemo(() => getExtents(events), [events]);

  const drawnElementsRef = useRef([]);
  const [selection, setSelection] = useState(new Set());
  const [mode, setMode] = useLocalStorageAsync(
    'mode',
    'select',
    LOCALSTORAGE_CONFIG
  );

  const onSelect = useCallback((e) => {
    const mousePos = getMouseEventPos(e, canvasRef.current);
    const intersecting = getIntersectingEvent(
      mousePos,
      drawnElementsRef.current
    );

    setSelection(new Set(intersecting ? [intersecting] : []));
  }, []);

  const [viewportState, setViewportState] = useLocalStorageAsync(
    'viewportState',
    makeViewportState,
    {
      ...ViewportStateSerializer,
      ...LOCALSTORAGE_CONFIG,
    }
  );
  useViewportControls(canvasRef.current, {
    wheelZoom: {x: true, y: false},
    dragPan: mode === 'hand',
    onSelect: mode !== 'select' ? onSelect : null,
    viewportState,
    setViewportState,
  });

  const viewport = useViewport(viewportState);

  const windowDimensions = useWindowDimensions();
  const canvasLogicalDimensions = windowDimensions;

  useEffect(() => {
    if (!ctx) return;
    const {canvas} = ctx;
    const dpr = getDPR();
    // clear canvas & update to fill window
    canvas.width = canvasLogicalDimensions.width * dpr;
    canvas.height = canvasLogicalDimensions.height * dpr;

    canvas.style.width = `${canvasLogicalDimensions.width}px`;
    canvas.style.height = `${canvasLogicalDimensions.height}px`;

    // Scale all drawing operations by the dpr, so you
    // don't have to worry about the difference.
    ctx.scale(dpr, dpr);

    drawnElementsRef.current = [];

    scaleDegrees.forEach((i) => {
      const rect = new Rect({
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
      });

      ctx.globalAlpha = 0.2;
      drawRect(ctx, rect, {
        fillStyle: colors[i],
      });
      ctx.globalAlpha = 1;

      drawTextRect(
        ctx,
        String(i + 1),
        rect,
        {
          fillStyle: colors[i],
        },
        {offset: {x: 3, y: 14}}
      );
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
        strokeStyle: selection.has(ev) ? 'white' : null,
      });

      drawnElementsRef.current.push({
        rect,
        object: ev,
      });
    });
  }, [ctx, events, viewport, selection, canvasLogicalDimensions]);

  const onDragStart = useCallback((e) => {
    const mousePos = getMouseEventPos(e, canvasRef.current);
    const intersecting = getIntersectingEvent(
      mousePos,
      drawnElementsRef.current
    );

    if (!intersecting) return false;

    if (!selection.has(intersecting)) {
      setSelection(new Set([intersecting]));
    }

    return true;
  }, []);
  const onDragMove = useCallback((e) => {
    const mousePos = getMouseEventPos(e, canvasRef.current);
    console.log('dragging to', mousePos);
  }, []);

  const dragEventBehaviorRef = useRef(new DragEventBehavior());
  dragEventBehaviorRef.current.setEnabled(mode !== 'hand');
  dragEventBehaviorRef.current.setProps({
    onDragStart,
    onDragMove,
  });

  const onSelectRect = useCallback((selectionBoxRect) => {
    const intersecting = findIntersectingEvents(
      selectionBoxRect,
      drawnElementsRef.current
    );

    setSelection(new Set(intersecting));
  }, []);

  const getEventAtPos = useCallback(
    (pos) => getIntersectingEvent(pos, drawnElementsRef.current),
    []
  );

  return (
    <div>
      <SelectMode
        enabled={mode === 'select'}
        canvas={canvasRef.current}
        onSelectRect={onSelectRect}
      />
      <Tooltip canvas={canvasRef.current} getEventAtPos={getEventAtPos} />
      <canvas
        ref={canvasRef}
        width={1000}
        height={600}
        style={{
          overflow: 'hidden',
          // filter: 'invert(100%)',
        }}
      />
      <Controls mode={mode} onModeChange={setMode} />
    </div>
  );
}

export default App;
