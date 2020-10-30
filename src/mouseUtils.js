import Vector2 from './Vector2';

export function getMouseEventPos(event, canvas) {
  var rect = canvas.getBoundingClientRect();
  return new Vector2({
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  });
}
