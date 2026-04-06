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

export interface TrifoldSpringConfig {
  damping: number;
  mass: number;
  stiffness: number;
}

interface TrifoldSharedProps {
  center: ReactNode;
  centerClassName?: string;
  centerContentClassName?: string;
  className?: string;
  /** Pixels moved before horizontal vs vertical is decided. Default 6. */
  directionLockPx?: number;
  flickVelocityPxPerMs?: number;
  horizontalDominance?: number;
  leading: ReactNode;
  leadingClassName?: string;
  /** When true, clicks matching `leadingLinkSelector` on the leading column call `onColumnChange('center')`. Default true. */
  leadingLinkOpensCenter?: boolean;
  /** CSS selector for clicks that move to the center column. Default `a[href]`. */
  leadingLinkSelector?: string;
  /**
   * First boundary between column 0 and 1 is at this fraction of viewport width.
   * Default 0.38.
   */
  snapBoundaryFraction?: number;
  spring?: Partial<TrifoldSpringConfig>;
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
