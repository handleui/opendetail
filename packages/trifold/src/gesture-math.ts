import type { TrifoldPanelIndex } from "./types.js";

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/** Track translateX: 0 = leading fully visible, -vw = main, -2vw = trailing. */
export const trackXForDrag = (
  originIndex: TrifoldPanelIndex,
  dx: number,
  viewportWidth: number
): number => {
  const minX = -2 * viewportWidth;
  const maxX = 0;
  return clamp(-originIndex * viewportWidth + dx, minX, maxX);
};

/**
 * Snap from released position. Boundaries default to 0.38 / 1.38 instead of 0.5 / 1.5 so a
 * shorter drag commits to the next panel (less “strong swipe” needed).
 */
export const panelIndexFromTrackX = (
  trackX: number,
  viewportWidth: number,
  snapBoundaryFraction: number
): TrifoldPanelIndex => {
  const f = clamp(-trackX / viewportWidth, 0, 2);
  if (f < snapBoundaryFraction) {
    return 0;
  }
  if (f < 1 + snapBoundaryFraction) {
    return 1;
  }
  return 2;
};
