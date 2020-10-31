import React from 'react';

import Vector2 from './Vector2';
import {getMouseEventPos} from './mouseUtils';
import useRefOnce from './useRefOnce';

const {useEffect, useMemo, useRef, useState} = React;

const SELECT_MAX_MOVE_DISTANCE = 5;

function zoomAtPoint(
  {zoom: prevZoom, pan: prevPan},
  pointInView,
  zoomScaleFactor
) {
  const updatedZoom = prevZoom
    .clone()
    .mul({x: zoomScaleFactor, y: zoomScaleFactor});
  // updatedZoom.y = 1; // lock zoom to x axis

  // find where the point is in (unzoomed) world coords
  const pointWorld = pointInView.clone().div(prevZoom).add(prevPan);
  // find point (zoomed) coords at new zoom, subtract point viewport offset
  // to get viewport offset (zoomed coords), then unzoom to get global pan
  const updatedPan = pointWorld
    .clone()
    .mul(updatedZoom)
    .sub(pointInView)
    .div(updatedZoom);

  return {
    zoom: updatedZoom,
    pan: updatedPan,
  };
}

class PanZoomBehavior {
  isMouseDown = false;
  dragMoved = false;
  panAtDragStart = new Vector2();
  currentPan = new Vector2();
  startMousePos = new Vector2();
  options = {};

  constructor(setViewportState) {
    this.setViewportState = setViewportState;
  }

  setOptions(options) {
    this.options = options;
  }

  onViewportState(viewportState) {
    // store pan value every time it changes so our event handlers can
    // access it without needing to be re-bound every time it changes
    this.currentPan.copyFrom(viewportState.pan);
  }

  bind(canvas) {
    this.canvas = canvas;
    this.canvas.addEventListener('mousedown', this.onmousedown);
    this.canvas.addEventListener('mouseup', this.onmouseup);
    this.canvas.addEventListener('mouseout', this.onmouseup);
    this.canvas.addEventListener('mousemove', this.onmousemove);
    this.canvas.addEventListener('wheel', this.onwheel);
  }

  unbind() {
    if (!this.canvas) return;
    this.canvas.removeEventListener('mousedown', this.onmousedown);
    this.canvas.removeEventListener('mouseup', this.onmouseup);
    this.canvas.removeEventListener('mouseout', this.onmouseup);
    this.canvas.removeEventListener('mousemove', this.onmousemove);
    this.canvas.removeEventListener('wheel', this.onwheel);
    this.canvas = null;
  }

  onmousedown = (e) => {
    this.options.onMouseDown && this.options.onMouseDown(e);
    this.isMouseDown = true;
    this.dragMoved = false;

    this.panAtDragStart.copyFrom(this.currentPan);
    this.startMousePos.copyFrom(getMouseEventPos(e, this.canvas));
  };

  onmouseup = (e) => {
    this.options.onMouseUp && this.options.onMouseUp(e);

    const disanceMoved = getMouseEventPos(e, this.canvas).distanceTo(
      this.startMousePos
    );
    if (this.dragMoved && disanceMoved > SELECT_MAX_MOVE_DISTANCE) {
      this.options.onDragEnd && this.options.onDragEnd(e);
    } else {
      this.options.onSelect && this.options.onSelect(e);
    }

    this.isMouseDown = false;
    this.dragMoved = false;
  };

  onmousemove = (e) => {
    this.options.onMouseMove && this.options.onMouseMove(e);

    if (this.options.dragPan && this.isMouseDown) {
      if (!this.dragMoved) {
        this.options.onDragStart && this.options.onDragStart(e);
      }
      this.dragMoved = true;

      const movementSinceStart = getMouseEventPos(e, this.canvas).sub(
        this.startMousePos
      );

      this.setViewportState((s) => {
        // pan is in world (unzoomed) coords so we must scale our translations
        const translation = movementSinceStart.clone().div(s.zoom).mul({
          x: -1,
          y: -1,
        });
        return {
          ...s,
          pan: translation.add(this.panAtDragStart),
          // pan: s.pan.clone().mul(s.zoom).sub(movement).div(s.zoom),
        };
      });
    }
  };

  onwheel = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // zoom centered on mouse
    const mousePosInView = getMouseEventPos(e, this.canvas);

    let deltaY = e.deltaY;
    // is zoom in pixels or lines?
    if (e.deltaMode > 0) deltaY *= 100;

    // this is just manually tuned, it relates to the scale of mousewheel movement values
    const zoomSpeed = 0.005;

    const zoomScaleFactor = 1 + zoomSpeed * -deltaY;

    this.setViewportState((s) => {
      const updated = zoomAtPoint(s, mousePosInView, zoomScaleFactor);

      if (this.options?.wheelZoom?.x !== true) {
        updated.zoom.x = s.zoom.x;
        updated.pan.x = s.pan.x;
      }
      if (this.options?.wheelZoom?.y !== true) {
        updated.zoom.y = s.zoom.y;
        updated.pan.y = s.pan.y;
      }

      return {
        ...s,
        ...updated,
      };
    });
  };
}

export function useViewportControls(canvas, options) {
  const [viewportState, setViewportState] = useState(() => ({
    zoom: new Vector2({x: 1, y: 1}),
    pan: new Vector2(),
  }));

  const panZoomRef = useRefOnce(() => new PanZoomBehavior(setViewportState));

  panZoomRef.current.setOptions(options);

  useEffect(() => {
    panZoomRef.current.onViewportState(viewportState);
  }, [viewportState]);

  useEffect(() => {
    if (!canvas) return;

    panZoomRef.current.bind(canvas);

    return () => {
      panZoomRef.current.unbind();
    };
  }, [canvas]);

  return [viewportState, setViewportState];
}

export function useViewport({zoom, pan}) {
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
