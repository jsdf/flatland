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

export class PanZoomBehavior {
  isMouseDown = false;
  dragMoved = false;
  panAtDragStart = new Vector2();
  currentPan = new Vector2();
  startMousePos = new Vector2();
  props = {};

  constructor() {}

  setProps(props) {
    if (props.viewportState != this.props.viewportState) {
      this.onViewportStateChange(props.viewportState);
    }
    this.props = props;
  }

  onViewportStateChange(viewportState) {
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
    this.props.onMouseDown && this.props.onMouseDown(e);
    this.isMouseDown = true;
    this.dragMoved = false;

    this.panAtDragStart.copyFrom(this.currentPan);
    this.startMousePos.copyFrom(getMouseEventPos(e, this.canvas));
  };

  onmouseup = (e) => {
    this.props.onMouseUp && this.props.onMouseUp(e);

    const disanceMoved = getMouseEventPos(e, this.canvas).distanceTo(
      this.startMousePos
    );
    if (this.dragMoved && disanceMoved > SELECT_MAX_MOVE_DISTANCE) {
      this.props.onDragEnd && this.props.onDragEnd(e);
    } else {
      this.props.onSelect && this.props.onSelect(e);
    }

    this.isMouseDown = false;
    this.dragMoved = false;
  };

  onmousemove = (e) => {
    this.props.onMouseMove && this.props.onMouseMove(e);

    if (this.props.dragPan && this.isMouseDown) {
      if (!this.dragMoved) {
        this.props.onDragStart && this.props.onDragStart(e);
      }
      this.dragMoved = true;

      const movementSinceStart = getMouseEventPos(e, this.canvas).sub(
        this.startMousePos
      );

      this.props.setViewportState((s) => {
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

    this.props.setViewportState((s) => {
      const updated = zoomAtPoint(s, mousePosInView, zoomScaleFactor);

      if (this.props?.wheelZoom?.x !== true) {
        updated.zoom.x = s.zoom.x;
        updated.pan.x = s.pan.x;
      }
      if (this.props?.wheelZoom?.y !== true) {
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

export function makeViewportState() {
  return {
    zoom: new Vector2({x: 1, y: 1}),
    pan: new Vector2(),
  };
}

export const ViewportStateSerializer = {
  stringify(state) {
    return JSON.stringify(state);
  },
  parse(json) {
    const data = JSON.parse(json);
    if (!data) return null;
    return {
      zoom: new Vector2(data.zoom),
      pan: new Vector2(data.pan),
    };
  },
};

export function useViewportState() {
  return useState(makeViewportState);
}

export function useViewportControls(canvas, props) {
  const panZoomRef = useRefOnce(() => new PanZoomBehavior());

  panZoomRef.current.setProps(props);

  useEffect(() => {
    if (!canvas) return;

    panZoomRef.current.bind(canvas);

    return () => {
      panZoomRef.current.unbind();
    };
  }, [canvas]);
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
