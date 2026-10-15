import { Point } from '@tapiz/board-commons';

export interface SnapRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Closest edge-to-edge distance on one axis: the moving box's start/end edges
// against every other box's start/end edges (so boxes can sit side by side or
// line up). Returns the correction to apply, or 0 when nothing is in range.
function axisOffset(
  start: number,
  end: number,
  others: { start: number; end: number }[],
  threshold: number,
): number {
  let best = 0;
  let bestDistance = threshold + 1;

  for (const other of others) {
    for (const edge of [start, end]) {
      for (const target of [other.start, other.end]) {
        const distance = Math.abs(target - edge);

        if (distance < bestDistance) {
          bestDistance = distance;
          best = target - edge;
        }
      }
    }
  }

  return bestDistance <= threshold ? best : 0;
}

/**
 * Offset to apply to the dragged boxes so their outer edges "stick" to the
 * nearest edge of another box when within `threshold`.
 */
export function edgeSnapOffset(
  moving: SnapRect[],
  others: SnapRect[],
  threshold: number,
): Point {
  if (!moving.length || !others.length) {
    return { x: 0, y: 0 };
  }

  const left = Math.min(...moving.map((it) => it.x));
  const top = Math.min(...moving.map((it) => it.y));
  const right = Math.max(...moving.map((it) => it.x + it.width));
  const bottom = Math.max(...moving.map((it) => it.y + it.height));

  return {
    x: axisOffset(
      left,
      right,
      others.map((it) => ({ start: it.x, end: it.x + it.width })),
      threshold,
    ),
    y: axisOffset(
      top,
      bottom,
      others.map((it) => ({ start: it.y, end: it.y + it.height })),
      threshold,
    ),
  };
}
