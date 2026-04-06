/** Slugs for `apps/web/src/app/components/[slug]` — shared by the page and preview viewport config. */
export const COMPONENT_DOCS_SLUGS = [
  "shell",
  "sidebar",
  "input",
  "recommendations",
  "sources",
  "conversation-title",
  "pressable",
  "loader",
  "error",
] as const;

export type ComponentDocsSlug = (typeof COMPONENT_DOCS_SLUGS)[number];

export function isComponentDocsSlug(value: string): value is ComponentDocsSlug {
  return (COMPONENT_DOCS_SLUGS as readonly string[]).includes(value);
}
