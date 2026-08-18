/** Standard stroke width for 24×24 outline icons */
export const DEFAULT_STROKE_WIDTH = 2;

/** Scale stroke to match DEFAULT_STROKE_WIDTH on non-24 viewBoxes */
export function scaledStrokeWidth(strokeWidth, viewBoxSize) {
  return strokeWidth * (viewBoxSize / 24);
}
