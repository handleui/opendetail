"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FUMADOCS_DOCS_NAV_SECTION_TITLE_CLASS } from "opendetail-fumadocs/sidebar";

interface DocsPageLink {
  href: string;
  label: string;
}

interface DocsNavSection {
  items: readonly DocsPageLink[];
  title: string;
}

/** Grouped nav — order matches content/docs/meta.json story → core → adapters. */
const DOCS_NAV_SECTIONS: readonly DocsNavSection[] = [
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

function isPageActive(href: string, pathname: string): boolean {
  return pathname === href;
}

export function DocsSidebarNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Documentation pages" className="flex flex-col gap-8">
      {DOCS_NAV_SECTIONS.map((section) => (
        <div key={section.title}>
          <p className={FUMADOCS_DOCS_NAV_SECTION_TITLE_CLASS}>
            {section.title}
          </p>
          <ul className="mt-2 flex flex-col gap-0.5">
            {section.items.map((item) => {
              const active = isPageActive(item.href, pathname);
              return (
                <li key={`${section.title}-${item.href}`}>
                  <Link
                    className={[
                      "block rounded-md px-3 py-1.5 text-[14px] text-neutral-900 leading-snug transition-colors",
                      active ? "bg-neutral-100" : "hover:bg-neutral-100/80",
                    ].join(" ")}
                    href={item.href}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
