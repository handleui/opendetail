import { describe, expect, it } from "vitest";

import {
  panelIndexFromTrackX,
  panelIndexFromTrackXN,
  trackXForDrag,
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

describe("trackXForDrag (3-panel alias)", () => {
  it("matches 3-panel range", () => {
    expect(trackXForDrag(0, 9999, 400)).toBe(0);
    expect(trackXForDrag(2, -9999, 400)).toBe(-800);
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

describe("panelIndexFromTrackX (deprecated 3-panel)", () => {
  const vw = 400;
  const b = 0.38;

  it("matches panelIndexFromTrackXN with count 3", () => {
    expect(panelIndexFromTrackX(0, vw, b)).toBe(
      panelIndexFromTrackXN(0, vw, 3, b)
    );
    expect(panelIndexFromTrackX(-1.38 * vw, vw, b)).toBe(
      panelIndexFromTrackXN(-1.38 * vw, vw, 3, b)
    );
  });
});
