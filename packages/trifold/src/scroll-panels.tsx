"use client";

import type { ReactNode } from "react";
import { forwardRef } from "react";

import { ParallelTrack } from "./parallel-track.js";
import type {
  ParallelTrackHandle,
  ParallelTrackProps,
} from "./parallel-track-types.js";

/**
 * Scrolling + padding shell around one horizontal panel. Keeps each surface bounded
 * (`min-h-0`, `overflow-y-auto`) so nested `ParallelTrack` stacks stay clean.
 */
function ScrollPanelBody({
  children,
  contentMaxWidthClassName,
  density,
}: {
  children: ReactNode;
  contentMaxWidthClassName?: string;
  density: ScrollPanelsDensity;
}) {
  const pad = density === "compact" ? "p-3 sm:p-4" : "p-6 sm:p-8";
  return (
    <div
      className={`flex h-full min-h-0 flex-col overflow-y-auto max-md:touch-pan-y ${pad}`}
      data-scroll-panel-body=""
    >
      {contentMaxWidthClassName ? (
        <div
          className={`mx-auto w-full ${contentMaxWidthClassName}`}
          data-scroll-panel-inner=""
        >
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  );
}

export type ScrollPanelsDensity = "compact" | "comfortable";

export type ScrollPanelsProps = Omit<
  ParallelTrackProps,
  "children" | "panelClassName"
> & {
  /**
   * Horizontal panels in order (0…n). Nest another `ParallelTrack` inside a panel for an
   * independent sub-stack.
   */
  panels: readonly ReactNode[];
  density?: ScrollPanelsDensity;
  contentMaxWidthClassName?: string;
  contentMaxWidthClassNamePerPanel?: readonly (string | undefined)[];
  panelClassName?: ParallelTrackProps["panelClassName"];
};

/**
 * Opinionated `ParallelTrack` wrapper: consistent per-panel scroll boundaries and optional max-width.
 * For route-synced stacks, derive `activeIndex` from the router. For a fixed 2/3-column shell,
 * use `Trifold`.
 */
export const ScrollPanels = forwardRef<ParallelTrackHandle, ScrollPanelsProps>(
  function ScrollPanels(
    {
      contentMaxWidthClassName,
      contentMaxWidthClassNamePerPanel,
      density = "comfortable",
      panelClassName: userPanelClassName,
      panels,
      ...parallelTrackProps
    },
    ref
  ) {
    const resolveUserClass = (i: number): string | undefined => {
      if (typeof userPanelClassName === "function") {
        return userPanelClassName(i);
      }
      return userPanelClassName;
    };

    return (
      <ParallelTrack
        panelClassName={(i) =>
          ["bg-background min-h-0 min-w-0", resolveUserClass(i)]
            .filter(Boolean)
            .join(" ")
        }
        ref={ref}
        {...parallelTrackProps}
      >
        {panels.map((panel, i) => (
          <ScrollPanelBody
            contentMaxWidthClassName={
              contentMaxWidthClassNamePerPanel?.[i] ?? contentMaxWidthClassName
            }
            density={density}
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed panel order, count matches ParallelTrack children
            key={i}
          >
            {panel}
          </ScrollPanelBody>
        ))}
      </ParallelTrack>
    );
  }
);

ScrollPanels.displayName = "ScrollPanels";
