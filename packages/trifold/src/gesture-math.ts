export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/** Track translateX: 0 = first panel, -vw per step. */
export const trackXForDragN = (
  originIndex: number,
  dx: number,
  viewportWidth: number,
  panelCount: number
): number => {
  if (panelCount < 1) {
    return 0;
  }
  const minX = -(panelCount - 1) * viewportWidth;
  const maxX = 0;
  return clamp(-originIndex * viewportWidth + dx, minX, maxX);
};

/**
 * Snap from released position. Between panel k and k+1, boundary at k + snapBoundaryFraction
 * (default 0.38 vs 0.5 midpoint).
 */
export const panelIndexFromTrackXN = (
  trackX: number,
  viewportWidth: number,
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
  const f = clamp(-trackX / viewportWidth, 0, maxF);
  for (let k = 0; k < panelCount - 1; k++) {
    if (f < k + snapBoundaryFraction) {
      return k;
    }
  }
  return panelCount - 1;
};

/** @deprecated Use {@link trackXForDragN} with panelCount 3. */
export const trackXForDrag = (
  originIndex: 0 | 1 | 2,
  dx: number,
  viewportWidth: number
): number => trackXForDragN(originIndex, dx, viewportWidth, 3);

/** @deprecated Use {@link panelIndexFromTrackXN} with panelCount 3. */
export const panelIndexFromTrackX = (
  trackX: number,
  viewportWidth: number,
  snapBoundaryFraction: number
): 0 | 1 | 2 =>
  panelIndexFromTrackXN(trackX, viewportWidth, 3, snapBoundaryFraction) as
    | 0
    | 1
    | 2;
