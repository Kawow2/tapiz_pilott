export interface ShapeGeometry {
  inset: number;
  viewBox: string;
  centerX: number;
  centerY: number;
  innerWidth: number;
  innerHeight: number;
  radiusX: number;
  radiusY: number;
  lineX2: number;
  trianglePoints: string;
}

// Pure geometry for the shape SVG, derived from the node size and border width.
// Kept out of the component so it can be unit-tested.
export function getShapeGeometry(
  width: number,
  height: number,
  strokeWidth: number,
): ShapeGeometry {
  const inset = strokeWidth / 2;

  return {
    inset,
    viewBox: `0 0 ${width} ${height}`,
    centerX: width / 2,
    centerY: height / 2,
    innerWidth: Math.max(0, width - strokeWidth),
    innerHeight: Math.max(0, height - strokeWidth),
    radiusX: Math.max(0, (width - strokeWidth) / 2),
    radiusY: Math.max(0, (height - strokeWidth) / 2),
    lineX2: Math.max(0, width - inset),
    trianglePoints: `${width / 2},${inset} ${width - inset},${height - inset} ${inset},${height - inset}`,
  };
}
