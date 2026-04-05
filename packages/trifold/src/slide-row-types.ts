import type { ReactNode } from "react";

import type { TrifoldSpringConfig } from "./types.js";

export interface SlideRowHandle {
  /** Move to a panel index (clamped). Does not update URL — sync routing yourself if needed. */
  goTo: (index: number) => void;
}

/** When set, two adjacent panels are visible at `minWidthPx` and up (each 50% of the viewport). */
export type SlideRowSplitLayout =
  | false
  | {
      /** CSS `min-width` breakpoint in px. Default 1024. */
      minWidthPx?: number;
    };

export interface SlideRowProps {
  /**
   * Which panel is focused (0-based). In split mode, this panel is the left column; the next
   * panel fills the right when it exists.
   *
   * **Routing:** this value does **not** read or write the URL — for “slide resolves to a new
   * page”, derive `activeIndex` from the router and update the route in `onActiveIndexChange`.
   * For an **in-app** shell (same URL), keep index in React state only (see `Trifold` for the
   * common 3-panel case).
   */
  activeIndex: number;
  /** Panel contents, in order (any count ≥ 1). Use more children for wider horizontal flows. */
  children: ReactNode;
  /** Root class name. */
  className?: string;
  /**
   * Legacy single value used when the touch/fine override for this field is omitted.
   * Prefer {@link directionLockPxTouch} / {@link directionLockPxFine} for device-specific tuning.
   */
  directionLockPx?: number;
  /** Pixels before horizontal vs vertical is decided — mouse / trackpad. Default 10. */
  directionLockPxFine?: number;
  /** Pixels before horizontal vs vertical is decided — touch / stylus. Default 6. */
  directionLockPxTouch?: number;
  /**
   * When set, pointer drag only starts if `pointerdown` is inside this many pixels from the
   * panel’s left and/or right edge (measured on the active panel). Omit for full-panel drag.
   */
  dragActivationMarginsPx?: { left?: number; right?: number };
  /**
   * If the pointer moved at least this many pixels horizontally (screen coords) before
   * release, **commit** to the next/prev panel in that direction instead of position-snap.
   * Omit to use only flick velocity + snap. Typical ~48–120.
   */
  dragCommitThresholdPx?: number;
  /** When false, horizontal drag is disabled (`data-slide-to` / `goTo` still work). Default true. */
  dragEnabled?: boolean;
  /**
   * After horizontal drag locks, this many pixels of movement are ignored for **how far the
   * track moves** (rubber-band starts only once past the dead zone). Default 0.
   */
  dragRevealDeadZonePx?: number;
  /**
   * Primary-button drag with mouse / pen / trackpad. Default **false** — standard model is
   * **touch-only horizontal pan** on phones/tablets; desktop uses taps/clicks (`data-slide-to`,
   * links, `goTo`). Set **true** to allow click-drag carousel on desktop.
   */
  finePointerDragEnabled?: boolean;
  /**
   * Legacy flick threshold used when the touch/fine override is omitted.
   * Fine pointers default to a lower threshold so trackpad swipes register.
   */
  flickVelocityPxPerMs?: number;
  /** Flick threshold for mouse / trackpad. Default 0.22. */
  flickVelocityPxPerMsFine?: number;
  /** Flick threshold for touch. Default 0.32. */
  flickVelocityPxPerMsTouch?: number;
  /**
   * How touch drag is classified when {@link gestureInput} is `auto`.
   * - `touch`: use touch tuning
   * - `fine`: use mouse/trackpad tuning
   */
  gestureInput?: "auto" | "fine" | "touch";
  /**
   * Multiply pointer drag, wheel `deltaX`, and flick velocity by this value.
   * Use **-1** if navigation feels inverted (e.g. slide left but content moves right). Default **1**.
   */
  horizontalDeltaSign?: -1 | 1;
  /** Legacy horizontal dominance; overridden per kind when {@link horizontalDominanceTouch} / {@link horizontalDominanceFine} are set. */
  horizontalDominance?: number;
  /** Horizontal movement must exceed vertical × this — mouse / trackpad. Default 1.18. */
  horizontalDominanceFine?: number;
  /** Horizontal movement must exceed vertical × this — touch. Default 1.08. */
  horizontalDominanceTouch?: number;
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
  /**
   * When false, programmatic / snap transitions use no animation (duration 0).
   * Dragging still follows the pointer in real time. Default true.
   */
  settleTransitionEnabled?: boolean;
  /** Attribute name for declarative jumps (default {@link SLIDE_TO_ATTRIBUTE}). */
  slideToAttribute?: string;
  /** When true, a click on `[data-slide-to="n"]` calls `onActiveIndexChange(n)`. Default true. */
  slideToClickEnabled?: boolean;
  snapBoundaryFraction?: number;
  /**
   * Two-column “split” mode from `minWidthPx` up: each panel is half the viewport wide,
   * two adjacent panels visible. Ignored when there is only one child.
   */
  splitLayout?: SlideRowSplitLayout;
  /**
   * When split mode is active, horizontal **wheel** and **pointer drag** are off unless this
   * is `true` (navigation by buttons / links / `data-slide-to` / `goTo` only). Default false.
   */
  splitPointerNavigation?: boolean;
  /** Spring when settling after swipe or programmatic index change (Motion). */
  spring?: Partial<TrifoldSpringConfig>;
  trackClassName?: string;
  /**
   * Horizontal wheel / trackpad two-finger pan (accumulates `deltaX`). Default **false** —
   * opt in for trackpad-heavy desktop UIs; standard navigation is taps/clicks on all viewports.
   */
  wheelHorizontalEnabled?: boolean;
  /**
   * When {@link wheelHorizontalEnabled} is true: signed horizontal `deltaX` accumulated before
   * committing a step; track follows until then; idle snaps back. Default **100**.
   */
  wheelHorizontalThresholdPx?: number;
}

/** Default `data-slide-to="0"` … on any descendant to jump to that panel. */
export const SLIDE_TO_ATTRIBUTE = "data-slide-to";
