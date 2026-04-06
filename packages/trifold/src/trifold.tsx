"use client";

import type { MouseEvent } from "react";

import { ParallelTrack } from "./parallel-track.js";
import {
  TRIFOLD_COLUMN_ATTRIBUTE,
  TRIFOLD_COLUMN_INDEX,
  type TrifoldProps,
  type TrifoldSpringConfig,
} from "./types.js";

function columnFromIndex(
  index: number,
  hasTrailing: boolean
): TrifoldProps["column"] {
  if (index === 0) {
    return "leading";
  }
  if (index === 1) {
    return "center";
  }
  if (hasTrailing && index === 2) {
    return "trailing";
  }
  return "center";
}

function parseTrifoldColumnValue(
  raw: string,
  hasTrailing: boolean
): number | null {
  if (raw === "leading") {
    return 0;
  }
  if (raw === "center") {
    return 1;
  }
  if (raw === "trailing") {
    return hasTrailing ? 2 : null;
  }
  return null;
}

export function Trifold(props: TrifoldProps) {
  const {
    className,
    center,
    centerClassName,
    centerContentClassName,
    column,
    directionLockPx,
    flickVelocityPxPerMs,
    horizontalDominance,
    leading,
    leadingClassName,
    leadingLinkOpensCenter = true,
    leadingLinkSelector = "a[href]",
    snapBoundaryFraction,
    spring,
    trackClassName,
  } = props;

  const hasTrailing = "trailing" in props;
  const onColumnChange = props.onColumnChange;
  const trailingClassName =
    "trailing" in props ? props.trailingClassName : undefined;

  const activeIndex = TRIFOLD_COLUMN_INDEX[column];

  const onPanelClickCapture = (
    event: MouseEvent<HTMLElement>,
    panelIndexFromEvent: number
  ) => {
    if (panelIndexFromEvent !== 0 || !leadingLinkOpensCenter) {
      return;
    }
    const target = event.target as HTMLElement | null;
    if (target?.closest(leadingLinkSelector)) {
      if (hasTrailing) {
        (onColumnChange as (c: "leading" | "center" | "trailing") => void)(
          "center"
        );
      } else {
        (onColumnChange as (c: "leading" | "center") => void)("center");
      }
    }
  };

  const parseJumpIndex = (raw: string) =>
    parseTrifoldColumnValue(raw, hasTrailing);

  const handleActiveIndexChange = (index: number) => {
    const next = columnFromIndex(index, hasTrailing);
    if (hasTrailing) {
      (onColumnChange as (c: "leading" | "center" | "trailing") => void)(next);
    } else {
      (onColumnChange as (c: "leading" | "center") => void)(
        next as "leading" | "center"
      );
    }
  };

  const centerWrapper = (
    <div
      style={{
        backgroundColor:
          "var(--trifold-center-bg, var(--trifold-main-bg, #fff))",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        position: "relative",
      }}
    >
      <div
        className={centerContentClassName}
        data-trifold-center=""
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {center}
      </div>
    </div>
  );

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
      <ParallelTrack
        activeIndex={activeIndex}
        directionLockPx={directionLockPx}
        flickVelocityPxPerMs={flickVelocityPxPerMs}
        horizontalDominance={horizontalDominance}
        jumpAttribute={TRIFOLD_COLUMN_ATTRIBUTE}
        onActiveIndexChange={handleActiveIndexChange}
        onPanelClickCapture={onPanelClickCapture}
        panelClassName={(i) => {
          if (i === 0) {
            return leadingClassName;
          }
          if (i === 1) {
            return centerClassName;
          }
          return trailingClassName;
        }}
        parseJumpIndex={parseJumpIndex}
        snapBoundaryFraction={snapBoundaryFraction}
        spring={spring as Partial<TrifoldSpringConfig> | undefined}
        trackClassName={trackClassName}
      >
        {leading}
        {centerWrapper}
        {hasTrailing ? props.trailing : null}
      </ParallelTrack>
    </div>
  );
}
