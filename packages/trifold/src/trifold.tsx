"use client";

import type { MouseEvent } from "react";

import { SlideRow } from "./slide-row.js";
import type { TrifoldProps, TrifoldSpringConfig } from "./types.js";

export function Trifold({
  className,
  directionLockPx,
  flickVelocityPxPerMs,
  horizontalDominance,
  leading,
  leadingClassName,
  leadingLinkSelector = "a[href]",
  main,
  mainClassName,
  mainContentClassName,
  navigateToCenterOnLeadingLinkClick = true,
  onPanelIndexChange,
  panelIndex,
  spring,
  snapBoundaryFraction,
  trailing,
  trailingClassName,
  trackClassName,
}: TrifoldProps) {
  const onPanelClickCapture = (
    event: MouseEvent<HTMLElement>,
    panelIndexFromEvent: number
  ) => {
    if (panelIndexFromEvent !== 0 || !navigateToCenterOnLeadingLinkClick) {
      return;
    }
    const target = event.target as HTMLElement | null;
    if (target?.closest(leadingLinkSelector)) {
      onPanelIndexChange(1);
    }
  };

  return (
    <div
      className={className}
      data-trifold=""
      style={{
        display: "flex",
        flex: 1,
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        overflow: "hidden",
        width: "100%",
      }}
    >
      <SlideRow
        activeIndex={panelIndex}
        directionLockPx={directionLockPx}
        flickVelocityPxPerMs={flickVelocityPxPerMs}
        horizontalDominance={horizontalDominance}
        onActiveIndexChange={(i) =>
          onPanelIndexChange(i as TrifoldProps["panelIndex"])
        }
        onPanelClickCapture={onPanelClickCapture}
        panelClassName={(i) => {
          if (i === 0) {
            return leadingClassName;
          }
          if (i === 1) {
            return mainClassName;
          }
          return trailingClassName;
        }}
        snapBoundaryFraction={snapBoundaryFraction}
        spring={spring as Partial<TrifoldSpringConfig> | undefined}
        trackClassName={trackClassName}
      >
        {leading}
        <div
          style={{
            backgroundColor: "var(--trifold-main-bg, #fff)",
            display: "flex",
            flexDirection: "column",
            height: "100%",
            position: "relative",
          }}
        >
          <div
            className={mainContentClassName}
            data-trifold-main=""
            style={{
              flex: 1,
              minHeight: 0,
              overflow: "hidden",
              position: "relative",
            }}
          >
            {main}
          </div>
        </div>
        {trailing}
      </SlideRow>
    </div>
  );
}
