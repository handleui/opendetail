import type { MouseEvent, ReactNode } from "react";

export interface ParallelTrackHandle {
  /** Move to a panel index (clamped). Does not update the URL. */
  goTo: (index: number) => void;
}

export interface ParallelTrackProps {
  /** Focused panel index (0-based). Does not read or write the URL. */
  activeIndex: number;
  children: ReactNode;
  className?: string;
  /**
   * When false, horizontal swiping between panels is off; `goTo()` and declarative jumps still
   * work. When true (default), dragging the track horizontally can change panels.
   * Pair with a vertical `overflow-y: auto` scroller inside each panel.
   */
  dragEnabled?: boolean;
  /**
   * Minimum horizontal drag distance (px) required to change panels on release.
   * Used together with `swipeVelocityThresholdPxPerSec`.
   */
  swipeDistanceThresholdPx?: number;
  /**
   * Minimum horizontal release velocity (px/s) required to change panels on release.
   * Used together with `swipeDistanceThresholdPx`.
   */
  swipeVelocityThresholdPxPerSec?: number;
  /** Declarative jumps: attribute name (default {@link PARALLEL_INDEX_ATTRIBUTE}). */
  jumpAttribute?: string;
  jumpClickEnabled?: boolean;
  onActiveIndexChange: (index: number) => void;
  onPanelClickCapture?: (
    event: MouseEvent<HTMLElement>,
    panelIndex: number
  ) => void;
  panelClassName?: string | ((panelIndex: number) => string | undefined);
  /** Parse the jump attribute value into a panel index. Default: integer parse. */
  parseJumpIndex?: (raw: string) => number | null;
  /**
   * When true (default), programmatic column changes use smooth horizontal scroll when the user
   * has not requested reduced motion. Maps to `ScrollBehavior` on `scrollTo`.
   */
  settleTransitionEnabled?: boolean;
  trackClassName?: string;
}

/** Default `data-parallel-index="0"` … on any descendant to jump to that panel. */
export const PARALLEL_INDEX_ATTRIBUTE = "data-parallel-index";
