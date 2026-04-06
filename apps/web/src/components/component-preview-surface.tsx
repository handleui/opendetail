import type { ReactNode } from "react";

import {
  COMPONENT_PREVIEW_BORDER_STYLE,
  type ComponentPreviewPreset,
  PRESET_CLASS_NAMES,
} from "@/lib/component-preview-viewport";

/**
 * Stroked preview stage for component docs — pick a `preset` (see `component-preview-viewport.ts`).
 */
export function ComponentPreviewSurface({
  children,
  preset = "default",
}: {
  children: ReactNode;
  preset?: ComponentPreviewPreset;
}) {
  const { inner, outer } = PRESET_CLASS_NAMES[preset];

  return (
    <div className={outer} style={COMPONENT_PREVIEW_BORDER_STYLE}>
      <div className={inner}>{children}</div>
    </div>
  );
}

export type { ComponentPreviewPreset } from "@/lib/component-preview-viewport";
