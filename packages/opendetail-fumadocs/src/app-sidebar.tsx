"use client";

import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import {
  type DocsNavNode,
  FUMADOCS_CLI_NAV_SECTIONS,
  FUMADOCS_DOCS_NAV_TREE,
  isCliDocsPathname,
} from "./docs-nav-tree";
import { FUMADOCS_DOCS_NAV_SECTION_TITLE_CLASS } from "./sidebar";

const PANEL_SLIDE_TRANSITION = {
  type: "spring" as const,
  stiffness: 520,
  damping: 36,
  mass: 0.85,
};

/** First row in root and docs panels shares this offset from the slide top (matches title→links gap via parent `mb-5`). */
const SLIDE_PANEL_TOP_CLASS = "px-2";

const NAV_ROW_CLASS =
  "flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-left text-[14px] text-neutral-900 leading-snug transition-colors hover:bg-neutral-100/80";

/** Icon-only social hit target — no hover surface; opacity hint only. */
const SOCIAL_ICON_LINK_CLASS =
  "inline-flex cursor-pointer items-center justify-center text-neutral-900 transition-opacity hover:opacity-65";

const navLinkClass = (active: boolean) =>
  [
    "block cursor-pointer rounded-md px-3 py-1.5 text-[14px] text-neutral-900 leading-snug transition-colors",
    active ? "bg-neutral-100" : "hover:bg-neutral-100/80",
  ].join(" ");

const DOCS_INNER_NAV_CLASS =
  "docs-sidebar-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pt-3 pb-4";

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

function folderDrillHref(
  node: Extract<DocsNavNode, { kind: "folder" }>
): string {
  const first = node.children[0];
  if (first?.kind === "page") {
    return first.href;
  }
  if (first?.kind === "folder") {
    return folderDrillHref(first);
  }
  return "/docs";
}

function DocsNavItems({
  nodes,
  pathname,
}: {
  nodes: readonly DocsNavNode[];
  pathname: string;
}) {
  return (
    <ul className="flex flex-col gap-0.5">
      {nodes.map((node) => {
        if (node.kind === "page") {
          const active = isPageActive(node.href, pathname);
          return (
            <li key={`page:${node.href}`}>
              <Link className={navLinkClass(active)} href={node.href}>
                {node.label}
              </Link>
            </li>
          );
        }

        const href = folderDrillHref(node);
        return (
          <li key={`folder:${node.id}`}>
            <Link className={`${NAV_ROW_CLASS} justify-between`} href={href}>
              <span>{node.label}</span>
              <ChevronRightIcon className="shrink-0 text-neutral-500" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function DocsNavSections({
  pathname,
  sections,
}: {
  pathname: string;
  sections: readonly { items: readonly DocsNavNode[]; title: string }[];
}) {
  return (
    <div className="flex flex-col gap-8">
      {sections.map((section) => (
        <div key={section.title}>
          <p className={FUMADOCS_DOCS_NAV_SECTION_TITLE_CLASS}>
            {section.title}
          </p>
          <div className="mt-2">
            <DocsNavItems nodes={section.items} pathname={pathname} />
          </div>
        </div>
      ))}
    </div>
  );
}

export interface FumadocsAppSidebarProps {
  /** Route prefix for the docs tree; pathname under this opens the docs panel. */
  docsPathPrefix?: string;
  githubHref: string;
  /** Mark for the GitHub link (e.g. Next.js `<Image />` from the app). */
  githubIcon: ReactNode;
  npmHref: string;
  /** Mark for the npm package link (e.g. Next.js `<Image />` from the app). */
  npmIcon: ReactNode;
  productTitle: string;
  /** e.g. `v0.5.0` — shown muted next to the product title. */
  productVersionLabel: string;
}

export function FumadocsAppSidebar({
  productTitle,
  productVersionLabel,
  githubHref,
  githubIcon,
  npmHref,
  npmIcon,
  docsPathPrefix = "/docs",
}: FumadocsAppSidebarProps) {
  const pathname = usePathname();
  const navId = useId();
  const prefersReducedMotion = useReducedMotion();
  const isUnderDocs =
    pathname === docsPathPrefix || pathname.startsWith(`${docsPathPrefix}/`);

  const [panel, setPanel] = useState<"root" | "docs">(() =>
    isUnderDocs ? "docs" : "root"
  );

  /** When pathname is under `/docs/cli`, inner CLI rail is open until Back collapses it (URL unchanged). */
  const [cliInnerSlideOpen, setCliInnerSlideOpen] = useState(() =>
    isCliDocsPathname(pathname, docsPathPrefix)
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

  useEffect(() => {
    if (isCliDocsPathname(pathname, docsPathPrefix)) {
      setCliInnerSlideOpen(true);
    } else {
      setCliInnerSlideOpen(false);
    }
  }, [pathname, docsPathPrefix]);

  const showDocsPanel = panel === "docs";
  const showCliInnerSlide =
    isCliDocsPathname(pathname, docsPathPrefix) && cliInnerSlideOpen;

  /** Pops one nested slide in the rail only — does not change the document URL. */
  const onDocsBack = () => {
    if (isCliDocsPathname(pathname, docsPathPrefix) && cliInnerSlideOpen) {
      setCliInnerSlideOpen(false);
      return;
    }
    if (panel === "docs") {
      setPanel("root");
    }
  };

  const githubLink = (
    <a
      aria-label="GitHub repository"
      className={SOCIAL_ICON_LINK_CLASS}
      href={githubHref}
      rel="noopener noreferrer"
      target="_blank"
    >
      {githubIcon}
    </a>
  );

  const npmLink = (
    <a
      aria-label="OpenDetail on npm"
      className={SOCIAL_ICON_LINK_CLASS}
      href={npmHref}
      rel="noopener noreferrer"
      target="_blank"
    >
      {npmIcon}
    </a>
  );

  const innerTransition = prefersReducedMotion
    ? { duration: 0 }
    : PANEL_SLIDE_TRANSITION;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-5 shrink-0 px-5 pt-5">
        <div className="flex flex-wrap items-baseline gap-1">
          <span className="font-normal text-[14px] text-black tracking-[-0.56px]">
            {productTitle}
          </span>
          <span className="font-normal text-[#a4a4a4] text-[13px] tabular-nums tracking-tight">
            {productVersionLabel}
          </span>
        </div>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <motion.div
          animate={{
            x: showDocsPanel ? "-50%" : "0%",
          }}
          className="flex h-full min-h-0 w-[200%] flex-row will-change-transform"
          initial={false}
          transition={innerTransition}
        >
          <div className="flex min-h-0 w-1/2 flex-col">
            <nav
              aria-label="Site"
              className={`flex shrink-0 flex-col gap-0.5 ${SLIDE_PANEL_TOP_CLASS} pb-4`}
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
            </nav>
            <div className="min-h-0 flex-1" />
          </div>

          <div className="flex min-h-0 w-1/2 flex-col">
            <div className={`shrink-0 ${SLIDE_PANEL_TOP_CLASS}`}>
              <button
                className={`${NAV_ROW_CLASS} gap-2`}
                onClick={onDocsBack}
                type="button"
              >
                <ChevronLeftIcon className="shrink-0 text-neutral-500" />
                Back
              </button>
            </div>
            <div className="relative min-h-0 flex-1 overflow-hidden">
              <motion.div
                animate={{
                  x: showCliInnerSlide ? "-50%" : "0%",
                }}
                className="flex h-full min-h-0 w-[200%] flex-row will-change-transform"
                initial={false}
                transition={innerTransition}
              >
                <div className="flex h-full min-h-0 w-1/2 flex-col">
                  <nav aria-labelledby={navId} className={DOCS_INNER_NAV_CLASS}>
                    <p className="sr-only" id={navId}>
                      Documentation pages
                    </p>
                    <DocsNavSections
                      pathname={pathname}
                      sections={FUMADOCS_DOCS_NAV_TREE}
                    />
                  </nav>
                </div>
                <div className="flex h-full min-h-0 w-1/2 flex-col">
                  <nav
                    aria-labelledby={`${navId}-cli`}
                    className={DOCS_INNER_NAV_CLASS}
                  >
                    <p className="sr-only" id={`${navId}-cli`}>
                      CLI documentation
                    </p>
                    <DocsNavSections
                      pathname={pathname}
                      sections={FUMADOCS_CLI_NAV_SECTIONS}
                    />
                  </nav>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="shrink-0 px-5 py-4">
        <div className="flex items-center justify-end gap-4">
          {githubLink}
          {npmLink}
        </div>
      </div>
    </div>
  );
}
