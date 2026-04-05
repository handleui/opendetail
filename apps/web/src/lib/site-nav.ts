/**
 * Site shell sidebar: docs vs `/components` URL helpers + nav tree data for `apps/web` only.
 * (`FumadocsAssistant` in `opendetail-fumadocs` is assistant/source wiring — not this.)
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
      { kind: "page", label: "Quickstart", href: "/docs/quickstart" },
      { kind: "page", label: "Integration", href: "/docs/integration" },
    ],
  },
  {
    title: "OpenDetail",
    items: [
      { kind: "page", label: "Overview", href: "/docs/opendetail" },
      { kind: "page", label: "Configuration", href: "/docs/configuration" },
      { kind: "page", label: "Runtime", href: "/docs/runtime" },
    ],
  },
  {
    title: "CLI",
    items: [
      { kind: "page", label: "Overview", href: "/docs/cli" },
      { kind: "page", label: "Quickstart", href: "/docs/cli/quickstart" },
      { kind: "page", label: "Reference", href: "/docs/cli/commands" },
      { kind: "page", label: "build", href: "/docs/cli/build" },
      { kind: "page", label: "setup", href: "/docs/cli/setup" },
      { kind: "page", label: "doctor", href: "/docs/cli/doctor" },
    ],
  },
  {
    title: "Adapters",
    items: [
      { kind: "page", label: "Next.js", href: "/docs/next" },
      { kind: "page", label: "React", href: "/docs/react" },
      { kind: "page", label: "Fumadocs", href: "/docs/fumadocs" },
    ],
  },
];

export const COMPONENTS_PATH_PREFIX = "/components";

export const SITE_COMPONENTS_OVERVIEW: { href: string; label: string } = {
  href: "/components",
  label: "Overview",
};

export const SITE_COMPONENTS_GROUP_SECTION: SiteNavSection = {
  title: "Components",
  items: [
    { kind: "page", label: "Shell", href: "/components/shell" },
    { kind: "page", label: "Input", href: "/components/input" },
    {
      kind: "page",
      label: "Recommendations",
      href: "/components/recommendations",
    },
  ],
};

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

export function isUnderComponentsPathname(pathname: string): boolean {
  const normalized = normalizePath(pathname);
  if (normalized === "/docs" || normalized.startsWith("/docs/")) {
    return false;
  }
  const base = normalizePath(COMPONENTS_PATH_PREFIX);
  return normalized === base || normalized.startsWith(`${base}/`);
}

export function getSiteSecondaryNest(pathname: string): "components" | "docs" {
  return isUnderComponentsPathname(pathname) ? "components" : "docs";
}

export function isUnderSiteSecondaryNavPathname(
  pathname: string,
  docsPathPrefix: string
): boolean {
  return (
    isUnderDocsPathname(pathname, docsPathPrefix) ||
    isUnderComponentsPathname(pathname)
  );
}
