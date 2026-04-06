/**
 * Site shell sidebar: docs vs Assistant UI (`/ui`) URL helpers + nav data for `apps/web` only.
 */

export type SiteNavNode =
  | { kind: "page"; label: string; href: string }
  | {
      kind: "folder";
      id: string;
      label: string;
      children: readonly SiteNavNode[];
    };

export interface SiteNavSection {
  items: readonly SiteNavNode[];
  title: string;
}

/** Grouped docs links — mirrors `content/docs`. */
export const SITE_DOCS_NAV_TREE: readonly SiteNavSection[] = [
  {
    title: "Get started",
    items: [
      { kind: "page", label: "Documentation", href: "/docs" },
      { kind: "page", label: "Get started", href: "/docs/quickstart" },
      { kind: "page", label: "UI integration", href: "/docs/ui-integration" },
    ],
  },
  {
    title: "Core",
    items: [{ kind: "page", label: "Package & runtime", href: "/docs/core" }],
  },
  {
    title: "CLI",
    items: [
      { kind: "page", label: "Quickstart", href: "/docs/cli/quickstart" },
      { kind: "page", label: "Reference", href: "/docs/cli/commands" },
      { kind: "page", label: "$ build", href: "/docs/cli/build" },
      { kind: "page", label: "$ setup", href: "/docs/cli/setup" },
      { kind: "page", label: "$ doctor", href: "/docs/cli/doctor" },
    ],
  },
  {
    title: "Adapters",
    items: [
      { kind: "page", label: "Next.js", href: "/docs/next" },
      { kind: "page", label: "React", href: "/docs/react" },
      { kind: "page", label: "Fumadocs", href: "/docs/fumadocs" },
      {
        kind: "page",
        label: "Systems and themes",
        href: "/docs/design-system",
      },
    ],
  },
];

/** Canonical path prefix for Assistant UI docs + previews. */
export const UI_DOCS_PATH_PREFIX = "/ui";

/** Router landing (`/ui`) — label for the top link in the Assistant UI secondary panel. */
export const SITE_UI_DOCS_ROUTER: { href: string; label: string } = {
  href: "/ui",
  label: "Overview",
};

/** @deprecated Use `SITE_UI_DOCS_ROUTER` */
export const SITE_UI_DOCS_OVERVIEW = SITE_UI_DOCS_ROUTER;

/** Secondary panel — Foundations (concepts), Hooks (API pages), Primitives (component pages). */
export const SITE_UI_DOCS_SECTIONS: readonly SiteNavSection[] = [
  {
    title: "Foundations",
    items: [
      { kind: "page", label: "Systems", href: "/ui/systems" },
      { kind: "page", label: "Themes", href: "/ui/themes" },
      { kind: "page", label: "Primitives", href: "/ui/primitives" },
    ],
  },
  {
    title: "Hooks",
    items: [
      {
        kind: "page",
        label: "useOpenDetail",
        href: "/ui/hooks/use-opendetail",
      },
      {
        kind: "page",
        label: "createOpenDetailClient",
        href: "/ui/hooks/create-open-detail-client",
      },
    ],
  },
  {
    title: "Primitives",
    items: [
      { kind: "page", label: "Shell", href: "/ui/opendetail/shell" },
      { kind: "page", label: "Sidebar", href: "/ui/opendetail/sidebar" },
      { kind: "page", label: "Composer", href: "/ui/opendetail/composer" },
      { kind: "page", label: "Thread", href: "/ui/opendetail/thread" },
      {
        kind: "page",
        label: "User message",
        href: "/ui/opendetail/user-message",
      },
      {
        kind: "page",
        label: "Assistant message",
        href: "/ui/opendetail/assistant-message",
      },
      {
        kind: "page",
        label: "Recommendations",
        href: "/ui/opendetail/recommendations",
      },
      { kind: "page", label: "Sources", href: "/ui/opendetail/sources" },
      {
        kind: "page",
        label: "Conversation title",
        href: "/ui/opendetail/conversation-title",
      },
      {
        kind: "page",
        label: "Pressable",
        href: "/ui/opendetail/pressable",
      },
      { kind: "page", label: "Loader", href: "/ui/opendetail/loader" },
      { kind: "page", label: "Error", href: "/ui/opendetail/error" },
    ],
  },
];

/** @deprecated Use `UI_DOCS_PATH_PREFIX` */
export const THEME_OPENDETAIL_PATH_PREFIX = UI_DOCS_PATH_PREFIX;

/** @deprecated Use `SITE_UI_DOCS_ROUTER` */
export const SITE_THEME_OPENDETAIL_OVERVIEW = SITE_UI_DOCS_ROUTER;

/** @deprecated Use `SITE_UI_DOCS_SECTIONS` */
export const SITE_THEME_OPENDETAIL_SECTIONS = SITE_UI_DOCS_SECTIONS;

function normalizePath(path: string): string {
  if (path.length > 1 && path.endsWith("/")) {
    return path.slice(0, -1);
  }
  return path;
}

export function isUnderDocsPathname(
  pathname: string,
  docsPathPrefix: string
): boolean {
  const base = normalizePath(docsPathPrefix);
  const normalized = normalizePath(pathname);
  return normalized === base || normalized.startsWith(`${base}/`);
}

export function isUnderUiDocsPathname(pathname: string): boolean {
  const normalized = normalizePath(pathname);
  if (normalized === "/docs" || normalized.startsWith("/docs/")) {
    return false;
  }
  const base = normalizePath(UI_DOCS_PATH_PREFIX);
  return normalized === base || normalized.startsWith(`${base}/`);
}

/** @deprecated Use `isUnderUiDocsPathname` */
export function isUnderThemeOpendetailPathname(pathname: string): boolean {
  return isUnderUiDocsPathname(pathname);
}

/** @deprecated Use `isUnderUiDocsPathname` */
export function isUnderComponentsPathname(pathname: string): boolean {
  return isUnderUiDocsPathname(pathname);
}

export function getSiteSecondaryNest(pathname: string): "ui" | "docs" {
  return isUnderUiDocsPathname(pathname) ? "ui" : "docs";
}

export function isUnderSiteSecondaryNavPathname(
  pathname: string,
  docsPathPrefix: string
): boolean {
  return (
    isUnderDocsPathname(pathname, docsPathPrefix) ||
    isUnderUiDocsPathname(pathname)
  );
}
