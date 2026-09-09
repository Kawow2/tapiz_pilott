import { TuNode } from './node.model.js';
import { Point } from './point.model.js';

// Visible region of the source image, as fractions (0..1) of the full image.
// Absent means the whole image is shown.
export interface ImageCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Image {
  url: string;
  width: number;
  height: number;
  position: Point;
  layer: number;
  rotation: number;
  crop?: ImageCrop;
}

export function isImage(node: TuNode): node is TuNode<Image> {
  return node.type === 'image';
}
