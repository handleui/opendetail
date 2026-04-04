export interface FumadocsDocsNavPageLink {
  href: string;
  label: string;
}

export interface FumadocsDocsNavSection {
  items: readonly FumadocsDocsNavPageLink[];
  title: string;
}

/** Grouped docs nav — order matches content/docs/meta.json story → core → adapters. */
export const FUMADOCS_DOCS_NAV_SECTIONS: readonly FumadocsDocsNavSection[] = [
  {
    title: "Get started",
    items: [
      { label: "Documentation", href: "/docs" },
      { label: "Quickstart", href: "/docs/quickstart" },
      { label: "Integration", href: "/docs/integration" },
    ],
  },
  {
    title: "OpenDetail",
    items: [
      { label: "Overview", href: "/docs/opendetail" },
      { label: "Configuration", href: "/docs/configuration" },
      { label: "CLI", href: "/docs/cli" },
      { label: "Runtime", href: "/docs/runtime" },
    ],
  },
  {
    title: "Adapters",
    items: [
      { label: "Next.js", href: "/docs/next" },
      { label: "React", href: "/docs/react" },
      { label: "Fumadocs", href: "/docs/fumadocs" },
    ],
  },
] as const;
