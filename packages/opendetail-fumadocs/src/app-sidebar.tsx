"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import { FUMADOCS_DOCS_NAV_SECTIONS } from "./docs-nav-sections";
import {
  FUMADOCS_DOCS_NAV_SECTION_TITLE_CLASS,
  FUMADOCS_DOCS_SIDEBAR_SCROLL_CLASS,
} from "./sidebar";

const NAV_ROW_CLASS =
  "flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-[14px] text-neutral-900 leading-snug transition-colors hover:bg-neutral-100/80";

const navLinkClass = (active: boolean) =>
  [
    "block rounded-md px-3 py-1.5 text-[14px] text-neutral-900 leading-snug transition-colors",
    active ? "bg-neutral-100" : "hover:bg-neutral-100/80",
  ].join(" ");

function isPageActive(href: string, pathname: string): boolean {
  return pathname === href;
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height="16"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="16"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height="16"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="16"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

export interface FumadocsAppSidebarProps {
  /** Route prefix for the docs tree; pathname under this opens the docs panel. */
  docsPathPrefix?: string;
  githubHref: string;
  /** Mark for the GitHub link (e.g. Next.js `<Image />` from the app). */
  githubIcon: ReactNode;
  productTitle: string;
}

export function FumadocsAppSidebar({
  productTitle,
  githubHref,
  githubIcon,
  docsPathPrefix = "/docs",
}: FumadocsAppSidebarProps) {
  const pathname = usePathname();
  const navId = useId();
  const isUnderDocs =
    pathname === docsPathPrefix || pathname.startsWith(`${docsPathPrefix}/`);

  const [panel, setPanel] = useState<"root" | "docs">(() =>
    isUnderDocs ? "docs" : "root"
  );

  const prevPathnameRef = useRef(pathname);
  useEffect(() => {
    const prev = prevPathnameRef.current;
    prevPathnameRef.current = pathname;
    const wasUnderDocs =
      prev === docsPathPrefix || prev.startsWith(`${docsPathPrefix}/`);
    if (!wasUnderDocs && isUnderDocs) {
      setPanel("docs");
    }
    if (wasUnderDocs && !isUnderDocs) {
      setPanel("root");
    }
  }, [pathname, isUnderDocs, docsPathPrefix]);

  const showDocsPanel = panel === "docs";
  const trackTransform = showDocsPanel ? "translateX(-50%)" : "translateX(0)";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <p className="shrink-0 px-4 pt-4 font-normal text-[14px] text-black tracking-[-0.56px]">
        {productTitle}
      </p>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div
          className="flex h-full min-h-0 w-[200%] flex-row transition-transform duration-300 ease-out motion-reduce:transition-none motion-reduce:duration-0"
          style={{ transform: trackTransform }}
        >
          <div className="flex min-h-0 w-1/2 flex-col">
            <div className="min-h-0 flex-1" />
            <nav
              aria-label="Site"
              className="flex shrink-0 flex-col gap-0.5 px-2 pb-4"
            >
              <Link
                className={navLinkClass(pathname === "/")}
                href="/"
                onClick={() => {
                  setPanel("root");
                }}
              >
                Home
              </Link>
              <button
                className={`${NAV_ROW_CLASS} justify-between`}
                onClick={() => {
                  setPanel("docs");
                }}
                type="button"
              >
                <span>Docs</span>
                <ChevronRightIcon className="shrink-0 text-neutral-500" />
              </button>
              <a
                className={`${NAV_ROW_CLASS} gap-2`}
                href={githubHref}
                rel="noopener noreferrer"
                target="_blank"
              >
                <span className="sr-only">GitHub repository</span>
                {githubIcon}
              </a>
            </nav>
          </div>

          <div className="flex min-h-0 w-1/2 flex-col">
            <div className="shrink-0 px-2 pt-2">
              <button
                className={`${NAV_ROW_CLASS} gap-2`}
                onClick={() => {
                  setPanel("root");
                }}
                type="button"
              >
                <ChevronLeftIcon className="shrink-0 text-neutral-500" />
                Back
              </button>
            </div>
            <div
              className={`${FUMADOCS_DOCS_SIDEBAR_SCROLL_CLASS} min-h-0 flex-1 pt-2 pb-4`}
            >
              <nav aria-labelledby={navId} className="flex flex-col gap-8">
                <p className="sr-only" id={navId}>
                  Documentation pages
                </p>
                {FUMADOCS_DOCS_NAV_SECTIONS.map((section) => (
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
                              className={navLinkClass(active)}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
