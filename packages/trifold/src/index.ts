// biome-ignore-all lint/performance/noBarrelFile: package entrypoint defines the public API surface.
export {
  clamp,
  panelIndexFromTrackX,
  trackXForDrag,
} from "./gesture-math.js";
export { Trifold } from "./trifold.js";
export type {
  TrifoldPanelIndex,
  TrifoldProps,
  TrifoldSpringConfig,
} from "./types.js";
