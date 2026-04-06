import type { MouseEvent, ReactNode } from "react";

import type { TrifoldSpringConfig } from "./types.js";

export interface ParallelTrackHandle {
  /** Move to a panel index (clamped). Does not update the URL. */
  goTo: (index: number) => void;
}

export interface ParallelTrackProps {
  /** Focused panel index (0-based). Does not read or write the URL. */
  activeIndex: number;
  children: ReactNode;
  className?: string;
  /** Pixels before horizontal vs vertical drag is decided. Default 6 (touch-tuned). */
  directionLockPx?: number;
  dragCommitThresholdPx?: number;
  /** When false, horizontal drag is disabled; `goTo` and jump attributes still work. Default true. */
  dragEnabled?: boolean;
  dragRevealDeadZonePx?: number;
  flickVelocityPxPerMs?: number;
  /** Multiply drag and flick velocity. Default 1. Use -1 if navigation feels inverted. */
  horizontalDeltaSign?: -1 | 1;
  /** Horizontal movement must exceed vertical × this. Default 1.08. */
  horizontalDominance?: number;
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
  settleTransitionEnabled?: boolean;
  snapBoundaryFraction?: number;
  spring?: Partial<TrifoldSpringConfig>;
  trackClassName?: string;
}

/** Default `data-parallel-index="0"` … on any descendant to jump to that panel. */
export const PARALLEL_INDEX_ATTRIBUTE = "data-parallel-index";
