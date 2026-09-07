import { TuNode } from './node.model.js';
import { Point } from './point.model.js';

export const shapeTypes = ['rectangle', 'circle', 'triangle', 'line'] as const;

export type ShapeType = (typeof shapeTypes)[number];

export interface Shape {
  shapeType: ShapeType;
  position: Point;
  layer: number;
  width: number;
  height: number;
  rotation: number;
  backgroundColor?: string | null;
  borderColor?: string | null;
  borderWidth?: number | null;
}

export function isShape(node: TuNode): node is TuNode<Shape> {
  return node.type === 'shape';
}

export type ShapeNode = TuNode<Shape, 'shape'>;
