import type { ReactNode } from "react";

import type { TrifoldSpringConfig } from "./types.js";

export interface SlideRowHandle {
  /** Move to a panel index (clamped). Does not update URL — sync routing yourself if needed. */
  goTo: (index: number) => void;
}

export interface SlideRowProps {
  /** Which panel is visible (0-based). */
  activeIndex: number;
  /** Panel contents, in order (any count ≥ 1). */
  children: ReactNode;
  /** Root class name. */
  className?: string;
  /** Pixels moved before horizontal vs vertical is decided. Default 6. */
  directionLockPx?: number;
  /** When false, horizontal drag is disabled (keyboard / `data-slide-to` / `goTo` still work). Default true. */
  dragEnabled?: boolean;
  flickVelocityPxPerMs?: number;
  /** Horizontal delta must exceed vertical × this value to count as horizontal. Default 1.08. */
  horizontalDominance?: number;
  /** Called when the user drags to a new panel or uses `data-slide-to` / `goTo`. */
  onActiveIndexChange: (index: number) => void;
  /**
   * Optional capture handler per panel (e.g. leading-column link → next panel).
   * Runs after {@link SLIDE_TO_ATTRIBUTE} handling.
   */
  onPanelClickCapture?: (
    event: React.MouseEvent<HTMLElement>,
    panelIndex: number
  ) => void;
  /** Class name per panel, or a function of panel index. */
  panelClassName?: string | ((panelIndex: number) => string | undefined);
  /** Attribute name for declarative jumps (default {@link SLIDE_TO_ATTRIBUTE}). */
  slideToAttribute?: string;
  /** When true, a click on `[data-slide-to="n"]` (see {@link slideToAttribute}) calls `onActiveIndexChange(n)`. Default true. */
  slideToClickEnabled?: boolean;
  snapBoundaryFraction?: number;
  spring?: Partial<TrifoldSpringConfig>;
  trackClassName?: string;
}

/** Default `data-slide-to="0"` … on any descendant to jump to that panel. */
export const SLIDE_TO_ATTRIBUTE = "data-slide-to";
