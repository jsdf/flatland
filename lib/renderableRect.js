"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getIntersectingRenderedRect = getIntersectingRenderedRect;
exports.getIntersectingEvent = getIntersectingEvent;
exports.findIntersectingEvents = findIntersectingEvents;

function getIntersectingRenderedRect(point, renderedRects) {
  var intersecting = null; // iterate in reverse to visit frontmost rects first

  for (var i = renderedRects.length - 1; i >= 0; i--) {
    var renderedRect = renderedRects[i];
    var intersection = renderedRect.rect.containsPoint(point);

    if (intersection) {
      // clicked on this rect
      intersecting = renderedRect;
      break;
    }
  }

  return intersecting;
}

function getIntersectingEvent(point, renderedRects) {
  var intersecting = getIntersectingRenderedRect(point, renderedRects);

  if (intersecting) {
    return intersecting.object;
  }

  return null;
}

function findIntersectingEvents(rect, renderedRects) {
  var intersecting = []; // iterate in reverse to visit frontmost rects first

  for (var i = renderedRects.length - 1; i >= 0; i--) {
    var renderedRect = renderedRects[i];
    var intersection = renderedRect.rect.intersectsRect(rect);

    if (intersection) {
      // clicked on this rect
      intersecting.push(renderedRect.object);
    }
  }

  return intersecting;
}