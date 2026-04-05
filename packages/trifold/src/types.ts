import type { ReactNode } from "react";

export type TrifoldPanelIndex = 0 | 1 | 2;

export interface TrifoldSpringConfig {
  damping: number;
  mass: number;
  stiffness: number;
}

/**
 * Three-panel shell: **leading · main · trailing** (OpenDetail web: nav · content · assistant).
 * Does **not** change the URL — keep `panelIndex` in React state (e.g. lift from `AssistantSidebar`
 * for mobile triptych). For **route-synced** horizontal stacks, use `StackedPanels` or `SlideRow`
 * and derive `activeIndex` from the router.
 *
 * For **more than three** horizontal steps, use `SlideRow` / `StackedPanels` (this component is
 * fixed at three children).
 */
export interface TrifoldProps {
  className?: string;
  /** Pixels moved before horizontal vs vertical is decided. Lower = snappier axis lock. Default 6. */
  directionLockPx?: number;
  flickVelocityPxPerMs?: number;
  /** Horizontal delta must exceed vertical × this value to count as horizontal. Lower = easier horizontal. Default 1.08. */
  horizontalDominance?: number;
  leading: ReactNode;
  leadingClassName?: string;
  /** CSS selector for clicks that move to the main panel (additive UX; swipe remains primary). Default `a[href]`. */
  leadingLinkSelector?: string;
  main: ReactNode;
  mainClassName?: string;
  mainContentClassName?: string;
  /** When true, clicks matching `leadingLinkSelector` on the leading panel call `onPanelIndexChange(1)`. Default true. */
  navigateToCenterOnLeadingLinkClick?: boolean;
  onPanelIndexChange: (index: TrifoldPanelIndex) => void;
  panelIndex: TrifoldPanelIndex;
  /**
   * First boundary between panel 0 and 1 is at this fraction of viewport (second at 1 + fraction).
   * Default 0.38 (vs 0.5) so less drag distance commits to the next panel.
   */
  snapBoundaryFraction?: number;
  /** Spring when settling after swipe or programmatic index change. */
  spring?: Partial<TrifoldSpringConfig>;
  trackClassName?: string;
  trailing: ReactNode;
  trailingClassName?: string;
}
