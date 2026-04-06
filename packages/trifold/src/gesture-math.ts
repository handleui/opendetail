export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/**
 * Track translateX in px: 0 = first panel; each step is `stepPx` (typically full viewport width).
 */
export const trackXForDragN = (
  originIndex: number,
  dx: number,
  stepPx: number,
  panelCount: number
): number => {
  if (panelCount < 1) {
    return 0;
  }
  const minX = -(panelCount - 1) * stepPx;
  const maxX = 0;
  return clamp(-originIndex * stepPx + dx, minX, maxX);
};

/**
 * Snap from released position. Between panel k and k+1, boundary at k + snapBoundaryFraction
 * (default 0.38 vs 0.5 midpoint). `stepPx` is the width of one panel in px.
 */
export const panelIndexFromTrackXN = (
  trackX: number,
  stepPx: number,
  panelCount: number,
  snapBoundaryFraction: number
): number => {
  if (panelCount < 1) {
    return 0;
  }
  if (panelCount === 1) {
    return 0;
  }
  const maxF = panelCount - 1;
  const f = clamp(-trackX / stepPx, 0, maxF);
  for (let k = 0; k < panelCount - 1; k++) {
    if (f < k + snapBoundaryFraction) {
      return k;
    }
  }
  return panelCount - 1;
};
