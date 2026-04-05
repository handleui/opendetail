// biome-ignore-all lint/performance/noBarrelFile: package entrypoint defines the public API surface.
export {
  clamp,
  panelIndexFromTrackX,
  panelIndexFromTrackXN,
  trackXForDrag,
  trackXForDragN,
} from "./gesture-math.js";
export { SlideRow } from "./slide-row.js";
export {
  SLIDE_TO_ATTRIBUTE,
  type SlideRowHandle,
  type SlideRowProps,
} from "./slide-row-types.js";
export { Trifold } from "./trifold.js";
export type {
  TrifoldPanelIndex,
  TrifoldProps,
  TrifoldSpringConfig,
} from "./types.js";
