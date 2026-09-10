import { describe, expect, it } from 'vitest';
import { newShape, patchShape } from './shape.validator';
import { shapeTypes, shapeVerticalAligns } from '../models/shape.model';

const baseShape = {
  position: { x: 0, y: 0 },
  width: 100,
  height: 80,
  shapeType: shapeTypes[0],
};

describe('shape validator', () => {
  it('accepts a minimal new shape', () => {
    expect(newShape.safeParse(baseShape).success).toBe(true);
  });

  it('accepts optional rich text', () => {
    expect(newShape.safeParse({ ...baseShape, text: '<p>hi</p>' }).success).toBe(
      true,
    );
  });

  it.each(shapeVerticalAligns)('accepts vertical align "%s"', (verticalAlign) => {
    expect(
      newShape.safeParse({ ...baseShape, verticalAlign }).success,
    ).toBe(true);
  });

  it('rejects an unknown vertical align', () => {
    expect(
      newShape.safeParse({ ...baseShape, verticalAlign: 'diagonal' }).success,
    ).toBe(false);
  });

  it('rejects an unknown shape type', () => {
    expect(
      newShape.safeParse({ ...baseShape, shapeType: 'hexagon' }).success,
    ).toBe(false);
  });

  it('requires the shape type', () => {
    const withoutType = {
      position: baseShape.position,
      width: baseShape.width,
      height: baseShape.height,
    };
    expect(newShape.safeParse(withoutType).success).toBe(false);
  });

  it('allows patching just the text', () => {
    expect(patchShape.safeParse({ text: 'only text' }).success).toBe(true);
  });
});
