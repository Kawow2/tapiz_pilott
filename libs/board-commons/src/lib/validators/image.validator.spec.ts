import { describe, expect, it } from 'vitest';
import { newImage, patchImage } from './image.validator';

const baseImage = {
  position: { x: 0, y: 0 },
  layer: 0 as const,
  width: 100,
  height: 100,
  url: 'https://example.com/a.png',
  rotation: 0,
};

describe('image validator', () => {
  it('accepts a valid image', () => {
    expect(newImage.safeParse(baseImage).success).toBe(true);
  });

  it('accepts an optional crop', () => {
    expect(
      newImage.safeParse({
        ...baseImage,
        crop: { x: 0.1, y: 0.1, width: 0.8, height: 0.8 },
      }).success,
    ).toBe(true);
  });

  it('rejects a crop with a missing field', () => {
    expect(
      newImage.safeParse({
        ...baseImage,
        crop: { x: 0, y: 0, width: 1 },
      }).success,
    ).toBe(false);
  });

  it('requires the url', () => {
    const withoutUrl = {
      position: baseImage.position,
      layer: baseImage.layer,
      width: baseImage.width,
      height: baseImage.height,
      rotation: baseImage.rotation,
    };
    expect(newImage.safeParse(withoutUrl).success).toBe(false);
  });

  it('allows patching only the crop', () => {
    expect(
      patchImage.safeParse({ crop: { x: 0, y: 0, width: 1, height: 1 } })
        .success,
    ).toBe(true);
  });
});
