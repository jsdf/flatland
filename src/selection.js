import Vector2 from './Vector2';
import Rect from './Rect';

export function getSelectionBox(start, end) {
  const startX = Math.min(start.x, end.x);
  const startY = Math.min(start.y, end.y);
  const endX = Math.max(start.x, end.x);
  const endY = Math.max(start.y, end.y);
  return new Rect({
    position: new Vector2({x: startX, y: startY}),
    size: new Vector2({x: endX - startX, y: endY - startY}),
  });
}
