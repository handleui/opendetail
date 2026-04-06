// biome-ignore-all lint/performance/noBarrelFile: package entrypoint defines the public API surface.
export {
  clamp,
  panelIndexFromTrackXN,
  trackXForDragN,
} from "./gesture-math.js";
export { ParallelTrack } from "./parallel-track.js";
export {
  PARALLEL_INDEX_ATTRIBUTE,
  type ParallelTrackHandle,
  type ParallelTrackProps,
} from "./parallel-track-types.js";
export {
  ScrollPanels,
  type ScrollPanelsDensity,
  type ScrollPanelsProps,
} from "./scroll-panels.js";
export { Trifold } from "./trifold.js";
export type {
  TrifoldColumn,
  TrifoldColumn2,
  TrifoldColumn3,
  TrifoldProps,
} from "./types.js";
export {
  TRIFOLD_COLUMN_ATTRIBUTE,
  TRIFOLD_COLUMN_INDEX,
} from "./types.js";
