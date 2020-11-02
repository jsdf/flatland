import './App.css';

import debounce from 'debounce';

import React from 'react';
import ReactDOM from 'react-dom';

import {
  useViewport,
  makeViewportState,
  ViewportStateSerializer,
  DragPanBehavior,
  WheelZoomBehavior,
} from './viewport';

import {BehaviorController, Behavior, useBehaviors} from './behavior';

import {getMouseEventPos} from './mouseUtils';
import Vector2 from './Vector2';
import Rect from './Rect';
import {range, scaleDiscreteQuantized} from './utils';

import {getSelectionBox} from './selection';

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
    if (canvasRef.current && (!state || state.canvas !== canvasRef.current)) {
      const ctx = canvasRef.current?.getContext('2d');
      setState({
        canvas: canvasRef.current,
        ctx,
      });
    }
  }, [state]);

  return {canvasRef, ctx: state?.ctx, canvas: state?.canvas};
}

const initialEvents = [
  {degree: 0, start: 0, duration: 1},
  {degree: 3, start: 4, duration: 1},
  {degree: 5, start: 5, duration: 2},
  {degree: 6, start: 6, duration: 3},
].map((ev, index) => ({...ev, id: index}));

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

function getIntersectingDrawnEl(point, drawnElements) {
  let intersecting = null;

  // iterate in reverse to visit frontmost rects first
  for (var i = drawnElements.length - 1; i >= 0; i--) {
    const drawnEl = drawnElements[i];

    const intersection = drawnEl.rect.containsPoint(point);
    if (intersection) {
      // clicked on this rect
      intersecting = drawnEl;
      break;
    }
  }

  return intersecting;
}
function getIntersectingEvent(point, drawnElements) {
  let intersecting = getIntersectingDrawnEl(point, drawnElements);
  if (intersecting) {
    return intersecting.object;
  }

  return null;
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
      {['select', 'pan'].map((value) => (
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

class DragEventBehavior extends Behavior {
  draggedEvents = [];
  dragStartPos = new Vector2();

  onMouseDown = (e) => {
    const mousePos = getMouseEventPos(e, this.canvas);
    const draggedEvent = this.props.getEventAtPos(mousePos);

    if (draggedEvent) {
      if (this.acquireLock('drag')) {
        let draggedSelection = this.props.selection ?? new Set();
        this.dragStartPos.copyFrom(mousePos);

        if (!this.props.selection?.has(draggedEvent.id)) {
          const newSelection = new Set([draggedEvent.id]);
          draggedSelection = newSelection;
          this.props.setSelection?.(newSelection);
        }
        // take a copy of the events at the time we started dragging
        this.draggedEvents = [];
        draggedSelection.forEach((id) =>
          this.draggedEvents.push(this.props.eventsMap.get(id))
        );
      }
    }
  };

  onMouseUp = (e) => {
    this.releaseLock('drag');
  };

  onMouseOut = (e) => {
    this.releaseLock('drag');
  };

  onMouseMove = (e) => {
    if (!this.hasLock('drag')) return;
    const mousePos = getMouseEventPos(e, this.canvas);

    this.props.onDragMove?.(this.draggedEvents, {
      to: mousePos,
      from: this.dragStartPos,
    });
  };

  getEventHandlers() {
    return {
      mousemove: this.onMouseMove,
      mouseout: this.onMouseOut,
      mouseup: this.onMouseUp,
      mousedown: this.onMouseDown,
    };
  }
}

class SelectBoxBehavior extends Behavior {
  rect = new Rect();
  selectionStart = new Vector2();
  selectionEnd = new Vector2();

  onDisabled() {
    this.props.selectBox.render(null);
  }

  onMouseDown = (e) => {
    if (this.acquireLock('drag')) {
      this.selectionStart.copyFrom(getMouseEventPos(e, this.canvas));
      this.selectionEnd.copyFrom(this.selectionStart);
    }
  };

  onMouseUp = (e) => {
    if (!this.hasLock('drag')) return;

    this.releaseLock('drag');
    this.props.selectBox.render(null);

    const selectBoxRect = getSelectionBox(
      this.selectionStart,
      this.selectionEnd
    );

    this.props.onSelectRect?.(selectBoxRect);
  };

  onMouseOut = (e) => {
    if (!this.hasLock('drag')) return;

    this.releaseLock('drag');
    this.props.selectBox.render(null);
  };

  onMouseMove = (e) => {
    if (!this.hasLock('drag')) return;

    this.selectionEnd.copyFrom(getMouseEventPos(e, this.canvas));

    const selectBoxRect = getSelectionBox(
      this.selectionStart,
      this.selectionEnd
    );

    this.props.selectBox.render(
      <div
        style={{
          transform: `translate3d(${selectBoxRect.position.x}px,${selectBoxRect.position.y}px,0)`,
          backgroundColor: 'white',
          opacity: 0.3,
          pointerEvents: 'none',
          width: selectBoxRect.size.x,
          height: selectBoxRect.size.y,
        }}
      />
    );
  };

  getEventHandlers() {
    return {
      mousemove: this.onMouseMove,
      mouseout: this.onMouseOut,
      mouseup: this.onMouseUp,
      mousedown: this.onMouseDown,
    };
  }
}

const SelectBox = React.memo(function SelectBox({selectBox}) {
  return (
    <div
      ref={selectBox.ref}
      style={{
        height: 0,
        width: 0,
      }}
    />
  );
});

class TooltipBehavior extends Behavior {
  onMouseMove = (e) => {
    if (this.controller.lockExists('drag')) return;
    const mousePos = getMouseEventPos(e, this.canvas);

    const intersecting = this.props.getEventAtPos?.(mousePos);

    this.props.tooltip?.render(
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
  };

  onAnyLockChange(type, locked) {
    if (type === 'drag' && locked) {
      // hide tooltip
      this.props.tooltip?.render(null);
    }
  }

  getEventHandlers() {
    return {mousemove: this.onMouseMove};
  }
}

function Tooltip({tooltip}) {
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

const LOCALSTORAGE_CONFIG = {
  baseKey: 'roygbiv',
  schemaVersion: '2',
};

function App() {
  const {canvasRef, ctx, canvas} = useCanvasContext2d();

  const [events, setEvents] = useState(initialEvents);
  const eventsMap = useMemo(() => new Map(events.map((ev) => [ev.id, ev])), [
    events,
  ]);

  const extents = useMemo(() => getExtents(events), [events]);

  // map from pixels (unzoomed) to scale degrees
  const quantizerY = useMemo(
    () =>
      scaleDiscreteQuantized(
        [0, scaleDegrees.length * TIMELINE_ROW_HEIGHT], // continuous
        [scaleDegrees[0], scaleDegrees[scaleDegrees.length - 1]], // discrete
        {
          stepSize: 1,
        }
      ),
    []
  );
  // map from pixels (unzoomed) to quarter notes
  const quantizerX = useMemo(
    () =>
      scaleDiscreteQuantized(
        [0, QUARTER_NOTE_WIDTH], // continuous
        [0, 1], // discrete
        {
          stepSize: 1,
        }
      ),
    []
  );

  const drawnElementsRef = useRef([]);
  const [selection, setSelection] = useState(new Set());
  const [mode, setMode] = useLocalStorageAsync(
    'mode',
    'select',
    LOCALSTORAGE_CONFIG
  );

  const [viewportState, setViewportState] = useLocalStorageAsync(
    'viewportState',
    makeViewportState,
    {
      ...ViewportStateSerializer,
      ...LOCALSTORAGE_CONFIG,
    }
  );

  const viewport = useViewport(viewportState);

  const onDragMove = useCallback(
    (draggedEvents, pos) => {
      const delta = pos.to.clone().sub(pos.from);

      const draggedEventsMap = new Map(draggedEvents.map((ev) => [ev.id, ev]));

      setEvents((events) =>
        events.map((ev) => {
          if (draggedEventsMap.has(ev.id)) {
            const deltaXQuantized = quantizerX.scale(
              viewport.sizeXFromScreen(delta.x)
            );
            const deltaYQuantized = quantizerY.scale(
              viewport.sizeYFromScreen(delta.y)
            );
            const eventBeforeDrag = draggedEventsMap.get(ev.id);
            return {
              ...ev,
              // as the delta is since drag start, we need to use the copy of
              // the event at drag start
              start: eventBeforeDrag.start + deltaXQuantized,
              degree: eventBeforeDrag.degree + deltaYQuantized,
            };
          }

          return ev;
        })
      );
    },
    [viewport, quantizerX, quantizerY]
  );

  const onSelectRect = useCallback((selectBoxRect) => {
    const intersecting = findIntersectingEvents(
      selectBoxRect,
      drawnElementsRef.current
    );

    setSelection(new Set(intersecting.map((ev) => ev.id)));
  }, []);

  const getEventAtPos = useCallback(
    (pos) => getIntersectingEvent(pos, drawnElementsRef.current),
    []
  );

  const selectBox = useRenderableElement();

  const tooltip = useRenderableElement();

  useBehaviors(
    () => {
      const controller = new BehaviorController();
      controller.addBehavior('dragPan', DragPanBehavior, 1);
      controller.addBehavior('wheelZoom', WheelZoomBehavior, 1);
      controller.addBehavior('dragEvent', DragEventBehavior, 2);
      controller.addBehavior('selection', SelectBoxBehavior, 1);
      controller.addBehavior('tooltip', TooltipBehavior, 1);

      return controller;
    },
    {
      canvas,
      props: {
        dragPan: {
          viewportState,
          setViewportState,
        },
        wheelZoom: {
          dimensions: {x: true},
          viewportState,
          setViewportState,
        },
        dragEvent: {
          getEventAtPos,
          onDragMove,
          selection,
          setSelection,
          eventsMap,
        },
        selection: {
          selectBox,
          onSelectRect,
        },
        tooltip: {
          getEventAtPos,
          tooltip,
        },
      },
      enabled: {
        dragPan: mode === 'pan',
        selection: mode === 'select',
        dragEvent: mode === 'select',
      },
    }
  );

  const windowDimensions = useWindowDimensions();
  const canvasLogicalDimensions = windowDimensions;

  // rendering
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
        strokeStyle: selection.has(ev.id) ? 'white' : null,
      });

      drawnElementsRef.current.push({
        rect,
        object: ev,
      });
    });
  }, [
    ctx,
    events,
    viewport,
    selection,
    canvasLogicalDimensions,
    extents.start,
    extents.size,
  ]);

  return (
    <div>
      <SelectBox selectBox={selectBox} />
      <Tooltip tooltip={tooltip} />
      <canvas
        ref={canvasRef}
        width={1000}
        height={600}
        style={{
          overflow: 'hidden',
          cursor: mode === 'pan' ? 'grab' : null,
        }}
      />
      <Controls mode={mode} onModeChange={setMode} />
    </div>
  );
}

export default App;
