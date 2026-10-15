import { describe, expect, it } from 'vitest';
import { edgeSnapOffset } from './edge-snap';

const other = { x: 0, y: 0, width: 100, height: 100 };

describe('edgeSnapOffset', () => {
  it('sticks the left edge to a neighbour right edge when close', () => {
    const moving = [{ x: 105, y: 0, width: 50, height: 50 }];

    expect(edgeSnapOffset(moving, [other], 8)).toEqual({ x: -5, y: 0 });
  });

  it('aligns top edges when close', () => {
    const moving = [{ x: 300, y: 4, width: 50, height: 50 }];

    expect(edgeSnapOffset(moving, [other], 8)).toEqual({ x: 0, y: -4 });
  });

  it('does nothing when edges are out of range', () => {
    const moving = [{ x: 200, y: 200, width: 50, height: 50 }];

    expect(edgeSnapOffset(moving, [other], 8)).toEqual({ x: 0, y: 0 });
  });

  it('does nothing without other boxes', () => {
    expect(edgeSnapOffset([other], [], 8)).toEqual({ x: 0, y: 0 });
  });
});
