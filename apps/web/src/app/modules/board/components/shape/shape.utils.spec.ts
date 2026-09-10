import { describe, expect, it } from 'vitest';
import { getShapeGeometry } from './shape.utils';

describe('getShapeGeometry', () => {
  it('computes geometry for a shape without a border', () => {
    const geometry = getShapeGeometry(200, 100, 0);

    expect(geometry).toEqual({
      inset: 0,
      viewBox: '0 0 200 100',
      centerX: 100,
      centerY: 50,
      innerWidth: 200,
      innerHeight: 100,
      radiusX: 100,
      radiusY: 50,
      lineX2: 200,
      trianglePoints: '100,0 200,100 0,100',
    });
  });

  it('insets everything by half the stroke width', () => {
    const geometry = getShapeGeometry(200, 100, 10);

    expect(geometry.inset).toBe(5);
    expect(geometry.innerWidth).toBe(190);
    expect(geometry.innerHeight).toBe(90);
    expect(geometry.radiusX).toBe(95);
    expect(geometry.radiusY).toBe(45);
    expect(geometry.lineX2).toBe(195);
    expect(geometry.trianglePoints).toBe('100,5 195,95 5,95');
  });

  it('keeps the viewBox at the full node size regardless of the stroke', () => {
    expect(getShapeGeometry(320, 240, 16).viewBox).toBe('0 0 320 240');
  });

  it('never returns negative dimensions when the stroke exceeds the size', () => {
    const geometry = getShapeGeometry(4, 4, 20);

    expect(geometry.innerWidth).toBe(0);
    expect(geometry.innerHeight).toBe(0);
    expect(geometry.radiusX).toBe(0);
    expect(geometry.radiusY).toBe(0);
    expect(geometry.lineX2).toBe(0);
  });
});
