import type { ReactNode } from "react";

/** Two parallel columns: leading and center. */
export type TrifoldColumn2 = "leading" | "center";

/** Three parallel columns. */
export type TrifoldColumn3 = "leading" | "center" | "trailing";

export type TrifoldColumn = TrifoldColumn2 | TrifoldColumn3;

/** Map {@link TrifoldColumn} to track index for {@link ParallelTrack}. */
export const TRIFOLD_COLUMN_INDEX: Record<TrifoldColumn, number> = {
  center: 1,
  leading: 0,
  trailing: 2,
};

interface TrifoldSharedProps {
  center: ReactNode;
  centerClassName?: string;
  centerContentClassName?: string;
  className?: string;
  leading: ReactNode;
  leadingClassName?: string;
  /** When true, clicks matching `leadingLinkSelector` on the leading column call `onColumnChange('center')`. Default true. */
  leadingLinkOpensCenter?: boolean;
  /** CSS selector for clicks that move to the center column. Default `a[href]`. */
  leadingLinkSelector?: string;
  /** Minimum horizontal drag distance in px required to switch columns. */
  swipeDistanceThresholdPx?: number;
  /** Minimum horizontal release velocity in px/s required to switch columns. */
  swipeVelocityThresholdPxPerSec?: number;
  /**
   * When true (default), a **one-finger horizontal swipe** on the track moves between columns
   * (controlled drag pager). When false, horizontal swiping is disabled;
   * use `data-trifold-column`, buttons, or `ParallelTrack`’s `goTo()` instead.
   *
   * **Phone layout:** give each column a nested vertical scroller (`min-h-0`, `overflow-y-auto`);
   * do not rely on the window/body to scroll the main content.
   */
  touchSwipeBetweenColumns?: boolean;
  trackClassName?: string;
}

export type TrifoldProps =
  | (TrifoldSharedProps & {
      column: TrifoldColumn3;
      onColumnChange: (column: TrifoldColumn3) => void;
      trailing: ReactNode;
      trailingClassName?: string;
    })
  | (TrifoldSharedProps & {
      column: TrifoldColumn2;
      onColumnChange: (column: TrifoldColumn2) => void;
    });

/** `data-trifold-column="leading" | "center" | "trailing"` for declarative jumps inside `Trifold`. */
export const TRIFOLD_COLUMN_ATTRIBUTE = "data-trifold-column";
