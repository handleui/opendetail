/** Slugs at `/ui/opendetail/<slug>` that render a live preview in the docs chrome. */
export const UI_OPENDETAIL_PREVIEW_SLUGS = [
  "shell",
  "sidebar",
  "composer",
  "recommendations",
  "sources",
  "conversation-title",
  "pressable",
  "loader",
  "error",
] as const;

export type UiOpendetailPreviewSlug =
  (typeof UI_OPENDETAIL_PREVIEW_SLUGS)[number];

export function isUiOpendetailPreviewSlug(
  value: string
): value is UiOpendetailPreviewSlug {
  return (UI_OPENDETAIL_PREVIEW_SLUGS as readonly string[]).includes(value);
}
