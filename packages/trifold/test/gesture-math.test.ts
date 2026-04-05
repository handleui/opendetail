import { describe, expect, it } from "vitest";

import { panelIndexFromTrackX, trackXForDrag } from "../src/gesture-math.js";

describe("trackXForDrag", () => {
  it("clamps drag range", () => {
    expect(trackXForDrag(0, 9999, 400)).toBe(0);
    expect(trackXForDrag(2, -9999, 400)).toBe(-800);
  });
});

describe("panelIndexFromTrackX", () => {
  const vw = 400;
  const b = 0.38;

  it("uses snap boundaries", () => {
    expect(panelIndexFromTrackX(0, vw, b)).toBe(0);
    expect(panelIndexFromTrackX(-0.37 * vw, vw, b)).toBe(0);
    expect(panelIndexFromTrackX(-0.38 * vw, vw, b)).toBe(1);
    expect(panelIndexFromTrackX(-1 * vw, vw, b)).toBe(1);
    expect(panelIndexFromTrackX(-1.37 * vw, vw, b)).toBe(1);
    expect(panelIndexFromTrackX(-1.38 * vw, vw, b)).toBe(2);
    expect(panelIndexFromTrackX(-2 * vw, vw, b)).toBe(2);
  });
});
