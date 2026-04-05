"use client";

import type { ReactNode } from "react";
import { forwardRef } from "react";

import { SlideRow } from "./slide-row.js";
import type { SlideRowHandle, SlideRowProps } from "./slide-row-types.js";

/**
 * Scrolling + padding shell around one horizontal panel. Keeps each surface bounded
 * (`min-h-0`, `overflow-y-auto`) so nested `SlideRow` stacks stay clean.
 */
function StackedPanelBody({
  children,
  contentMaxWidthClassName,
  density,
}: {
  children: ReactNode;
  contentMaxWidthClassName?: string;
  density: StackedPanelsDensity;
}) {
  const pad = density === "compact" ? "p-3 sm:p-4" : "p-6 sm:p-8";
  return (
    <div
      className={`flex h-full min-h-0 flex-col overflow-y-auto ${pad}`}
      data-stacked-panel-body=""
    >
      {contentMaxWidthClassName ? (
        <div
          className={`mx-auto w-full ${contentMaxWidthClassName}`}
          data-stacked-panel-inner=""
        >
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  );
}

export type StackedPanelsDensity = "compact" | "comfortable";

export type StackedPanelsProps = Omit<
  SlideRowProps,
  "children" | "panelClassName"
> & {
  /**
   * Horizontal panels in order (0…n). With {@link SlideRowProps.splitLayout}, wide viewports show
   * two adjacent columns (`activeIndex` and `activeIndex + 1`). Add more panels for deeper
   * flows; nest another `SlideRow` inside a panel for an independent sub-stack.
   */
  panels: readonly ReactNode[];
  /** `compact` = thin sidebars; `comfortable` = full-page gutters. Default `comfortable`. */
  density?: StackedPanelsDensity;
  /**
   * Applied to the inner width wrapper on every panel (e.g. `max-w-[1080px]`). Omit for full-bleed.
   */
  contentMaxWidthClassName?: string;
  /**
   * Per-panel override for the inner max-width class. Length should match `panels` when set.
   */
  contentMaxWidthClassNamePerPanel?: readonly (string | undefined)[];
  /** Merged with the chrome wrapper for each panel. */
  panelClassName?: SlideRowProps["panelClassName"];
};

/**
 * Opinionated `SlideRow` wrapper: consistent per-panel scroll boundaries and optional max-width,
 * matching the Trifold / assistant shell idea (clean columns, same motion model everywhere).
 */
export const StackedPanels = forwardRef<SlideRowHandle, StackedPanelsProps>(
  function StackedPanels(
    {
      contentMaxWidthClassName,
      contentMaxWidthClassNamePerPanel,
      density = "comfortable",
      panelClassName: userPanelClassName,
      panels,
      ...slideRowProps
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
      <SlideRow
        panelClassName={(i) =>
          ["bg-background min-h-0 min-w-0", resolveUserClass(i)]
            .filter(Boolean)
            .join(" ")
        }
        ref={ref}
        {...slideRowProps}
      >
        {panels.map((panel, i) => (
          <StackedPanelBody
            contentMaxWidthClassName={
              contentMaxWidthClassNamePerPanel?.[i] ?? contentMaxWidthClassName
            }
            density={density}
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed panel order, count matches SlideRow children
            key={i}
          >
            {panel}
          </StackedPanelBody>
        ))}
      </SlideRow>
    );
  }
);

StackedPanels.displayName = "StackedPanels";
