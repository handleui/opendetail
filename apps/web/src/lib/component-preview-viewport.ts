import type { UiOpendetailPreviewSlug } from "@/lib/ui-opendetail-preview-slugs";

/**
 * Live demo frame for `/ui/opendetail/*` — one preset bundles height, inset, and alignment.
 * Customize per slug: edit `PRESET_BY_SLUG` or add a preset in `PRESET_CLASS_NAMES`.
 */
export type ComponentPreviewPreset =
  | "default"
  | "tall-centered"
  | "tall-fill"
  | "flush-tall";

export const COMPONENT_PREVIEW_BORDER_STYLE = {
  borderColor: "var(--opendetail-color-sidebar-stroke)",
} as const;

/** Tailwind class strings per preset (outer = stroked card, inner = demo slot). */
export const PRESET_CLASS_NAMES: Record<
  ComponentPreviewPreset,
  { inner: string; outer: string }
> = {
  default: {
    outer:
      "relative flex min-h-[min(70vh,28rem)] w-full flex-col overflow-hidden rounded-xl border border-solid bg-white p-6",
    inner:
      "relative flex min-h-0 w-full flex-1 flex-col items-center justify-center",
  },
  "tall-centered": {
    outer:
      "relative flex h-[min(85vh,44rem)] min-h-[min(85vh,44rem)] w-full flex-col overflow-hidden rounded-xl border border-solid bg-white p-6",
    inner:
      "relative flex min-h-0 w-full flex-1 flex-col items-center justify-center",
  },
  "tall-fill": {
    outer:
      "relative flex h-[min(85vh,44rem)] min-h-[min(85vh,44rem)] w-full flex-col overflow-hidden rounded-xl border border-solid bg-white p-6",
    inner: "relative flex min-h-0 w-full flex-1 flex-col items-stretch",
  },
  "flush-tall": {
    outer:
      "relative flex h-[min(85vh,44rem)] min-h-[min(85vh,44rem)] w-full flex-col overflow-hidden rounded-xl border border-solid bg-white",
    inner: "relative flex min-h-0 w-full flex-1 flex-col",
  },
};

const PRESET_BY_SLUG: Partial<
  Record<UiOpendetailPreviewSlug, ComponentPreviewPreset>
> = {
  shell: "tall-fill",
  sidebar: "flush-tall",
  "conversation-title": "tall-centered",
};

export function getComponentPreviewPreset(
  slug: UiOpendetailPreviewSlug
): ComponentPreviewPreset {
  return PRESET_BY_SLUG[slug] ?? "default";
}
