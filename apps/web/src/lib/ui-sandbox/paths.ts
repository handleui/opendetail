/** Main sandbox page (controls + docs panel). */
export const SANDBOX_PAGE_PATH = "/ui";

/**
 * Isolated document for live previews. Loaded in an iframe so theme CSS (`:root`)
 * only affects components inside the preview, not the docs chrome.
 *
 * Keep in sync with `middleware.ts` `config.matcher` (must be static string literals).
 */
export const SANDBOX_PREVIEW_PATH = `${SANDBOX_PAGE_PATH}/preview`;

/**
 * Set by middleware on `/ui/preview` so the root layout renders a minimal shell
 * (no site navigation) for the iframe document.
 */
export const SANDBOX_PREVIEW_DOCUMENT_HEADER = "x-opendetail-sandbox-preview";

export function buildSandboxPreviewSrc(
  primitive: string,
  theme: string
): string {
  const q = new URLSearchParams({ primitive, theme });
  return `${SANDBOX_PREVIEW_PATH}?${q.toString()}`;
}
