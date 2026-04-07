import { describe, expect, it } from "vitest";

import {
  panelIndexFromSwipeIntent,
  panelIndexFromTrackXN,
  trackXForDragN,
} from "../src/gesture-math.js";

describe("trackXForDragN", () => {
  it("clamps drag range for arbitrary panel count", () => {
    expect(trackXForDragN(0, 9999, 400, 2)).toBe(0);
    expect(trackXForDragN(1, -9999, 400, 2)).toBe(-400);
    expect(trackXForDragN(0, 9999, 400, 5)).toBe(0);
    expect(trackXForDragN(4, -9999, 400, 5)).toBe(-1600);
  });
});

describe("panelIndexFromTrackXN", () => {
  const vw = 400;
  const b = 0.38;

  it("handles two panels", () => {
    expect(panelIndexFromTrackXN(0, vw, 2, b)).toBe(0);
    expect(panelIndexFromTrackXN(-0.37 * vw, vw, 2, b)).toBe(0);
    expect(panelIndexFromTrackXN(-0.38 * vw, vw, 2, b)).toBe(1);
    expect(panelIndexFromTrackXN(-1 * vw, vw, 2, b)).toBe(1);
  });

  it("handles three panels", () => {
    expect(panelIndexFromTrackXN(0, vw, 3, b)).toBe(0);
    expect(panelIndexFromTrackXN(-0.37 * vw, vw, 3, b)).toBe(0);
    expect(panelIndexFromTrackXN(-0.38 * vw, vw, 3, b)).toBe(1);
    expect(panelIndexFromTrackXN(-1 * vw, vw, 3, b)).toBe(1);
    expect(panelIndexFromTrackXN(-1.37 * vw, vw, 3, b)).toBe(1);
    expect(panelIndexFromTrackXN(-1.38 * vw, vw, 3, b)).toBe(2);
    expect(panelIndexFromTrackXN(-2 * vw, vw, 3, b)).toBe(2);
  });
});

describe("panelIndexFromSwipeIntent", () => {
  const distanceThresholdPx = 56;
  const velocityThresholdPxPerSec = 520;

  it("keeps the current panel when intent threshold is not met", () => {
    expect(
      panelIndexFromSwipeIntent({
        currentIndex: 1,
        distancePx: 30,
        panelCount: 3,
        swipeDistanceThresholdPx: distanceThresholdPx,
        swipeVelocityPxPerSec: 100,
        swipeVelocityThresholdPxPerSec: velocityThresholdPxPerSec,
      })
    ).toBe(1);
  });

  it("moves by distance threshold", () => {
    expect(
      panelIndexFromSwipeIntent({
        currentIndex: 1,
        distancePx: -distanceThresholdPx,
        panelCount: 3,
        swipeDistanceThresholdPx: distanceThresholdPx,
        swipeVelocityPxPerSec: 0,
        swipeVelocityThresholdPxPerSec: velocityThresholdPxPerSec,
      })
    ).toBe(2);

    expect(
      panelIndexFromSwipeIntent({
        currentIndex: 1,
        distancePx: distanceThresholdPx,
        panelCount: 3,
        swipeDistanceThresholdPx: distanceThresholdPx,
        swipeVelocityPxPerSec: 0,
        swipeVelocityThresholdPxPerSec: velocityThresholdPxPerSec,
      })
    ).toBe(0);
  });

  it("moves by velocity threshold", () => {
    expect(
      panelIndexFromSwipeIntent({
        currentIndex: 1,
        distancePx: 0,
        panelCount: 3,
        swipeDistanceThresholdPx: distanceThresholdPx,
        swipeVelocityPxPerSec: -velocityThresholdPxPerSec,
        swipeVelocityThresholdPxPerSec: velocityThresholdPxPerSec,
      })
    ).toBe(2);

    expect(
      panelIndexFromSwipeIntent({
        currentIndex: 1,
        distancePx: 0,
        panelCount: 3,
        swipeDistanceThresholdPx: distanceThresholdPx,
        swipeVelocityPxPerSec: velocityThresholdPxPerSec,
        swipeVelocityThresholdPxPerSec: velocityThresholdPxPerSec,
      })
    ).toBe(0);
  });

  it("clamps at panel bounds", () => {
    expect(
      panelIndexFromSwipeIntent({
        currentIndex: 0,
        distancePx: 120,
        panelCount: 3,
        swipeDistanceThresholdPx: distanceThresholdPx,
        swipeVelocityPxPerSec: 0,
        swipeVelocityThresholdPxPerSec: velocityThresholdPxPerSec,
      })
    ).toBe(0);

    expect(
      panelIndexFromSwipeIntent({
        currentIndex: 2,
        distancePx: -120,
        panelCount: 3,
        swipeDistanceThresholdPx: distanceThresholdPx,
        swipeVelocityPxPerSec: 0,
        swipeVelocityThresholdPxPerSec: velocityThresholdPxPerSec,
      })
    ).toBe(2);
  });
});
