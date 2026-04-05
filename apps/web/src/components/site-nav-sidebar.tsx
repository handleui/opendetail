"use client";

import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useId } from "react";

import {
  COMPONENTS_PATH_PREFIX,
  isUnderComponentsPathname,
  SITE_COMPONENTS_GROUP_SECTION,
  SITE_COMPONENTS_OVERVIEW,
  SITE_DOCS_NAV_TREE,
  type SiteNavNode,
} from "@/lib/site-nav-tree";
import { useSiteSidebarRailDepth } from "@/lib/site-sidebar-rail-depth";
import { useSiteNavEffectivePathname } from "@/lib/use-site-nav-effective-pathname";

/** Group labels in the secondary panel (docs or components). */
const SITE_NAV_SECTION_TITLE_CLASS =
  "px-3 font-normal text-[#a4a4a4] text-[13px] tracking-tight";

const PANEL_SLIDE_TRANSITION = {
  type: "spring" as const,
  stiffness: 520,
  damping: 36,
  mass: 0.85,
};

const SLIDE_PANEL_TOP_CLASS = "px-2";

const NAV_ROW_CLASS =
  "flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-left text-[14px] text-neutral-900 leading-snug transition-colors hover:bg-neutral-100/80";

const SOCIAL_ICON_LINK_CLASS =
  "inline-flex cursor-pointer items-center justify-center text-neutral-900 transition-opacity hover:opacity-65";

const navLinkClass = (active: boolean) =>
  [
    "block cursor-pointer rounded-md px-3 py-1.5 text-[14px] text-neutral-900 leading-snug transition-colors",
    active ? "bg-neutral-100" : "hover:bg-neutral-100/80",
  ].join(" ");

const INNER_NAV_CLASS =
  "docs-sidebar-scroll min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain px-2 pt-3 pb-4";

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
  node: Extract<SiteNavNode, { kind: "folder" }>
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

function NavItems({
  nodes,
  pathname,
}: {
  nodes: readonly SiteNavNode[];
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

function NavSections({
  pathname,
  sections,
}: {
  pathname: string;
  sections: readonly { items: readonly SiteNavNode[]; title: string }[];
}) {
  return (
    <div className="flex flex-col gap-8">
      {sections.map((section) => (
        <div key={section.title}>
          <p className={SITE_NAV_SECTION_TITLE_CLASS}>{section.title}</p>
          <div className="mt-2">
            <NavItems nodes={section.items} pathname={pathname} />
          </div>
        </div>
      ))}
    </div>
  );
}

export interface SiteNavSidebarProps {
  docsPathPrefix?: string;
  githubHref: string;
  githubIcon: ReactNode;
  npmHref: string;
  npmIcon: ReactNode;
  productTitle: string;
  productVersionLabel: string;
}

/**
 * Marketing site chrome: Home, Docs, Components — and a **separate** secondary panel
 * for either documentation or the component gallery (never mixed in one scroll).
 */
export function SiteNavSidebar({
  productTitle,
  productVersionLabel,
  githubHref,
  githubIcon,
  npmHref,
  npmIcon,
  docsPathPrefix = "/docs",
}: SiteNavSidebarProps) {
  const pathname = usePathname();
  const { effectivePathname, setNavIntent } =
    useSiteNavEffectivePathname(pathname);
  const navId = useId();
  const prefersReducedMotion = useReducedMotion();
  const { showSecondaryPanel, goBack, openSecondary, openHome } =
    useSiteSidebarRailDepth(pathname, docsPathPrefix);

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

  /** Docs vs components: use optimistic URL so the nest switches immediately on top-level nav. */
  const secondaryIsComponents = isUnderComponentsPathname(effectivePathname);
  const docsRootActive =
    pathname === docsPathPrefix || pathname.startsWith(`${docsPathPrefix}/`);
  const componentsRootActive =
    pathname === COMPONENTS_PATH_PREFIX ||
    pathname.startsWith(`${COMPONENTS_PATH_PREFIX}/`);

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
            x: showSecondaryPanel ? "-50%" : "0%",
          }}
          className="flex h-full min-h-0 w-[200%] touch-pan-x flex-row will-change-transform"
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
                  setNavIntent("/");
                  openHome();
                }}
              >
                Home
              </Link>
              <Link
                className={[
                  NAV_ROW_CLASS,
                  "justify-between",
                  docsRootActive ? "bg-neutral-100" : "",
                ].join(" ")}
                href={docsPathPrefix}
                onClick={() => {
                  setNavIntent(docsPathPrefix);
                  openSecondary();
                }}
              >
                <span>Docs</span>
                <ChevronRightIcon className="shrink-0 text-neutral-500" />
              </Link>
              <Link
                className={[
                  NAV_ROW_CLASS,
                  "justify-between",
                  componentsRootActive ? "bg-neutral-100" : "",
                ].join(" ")}
                href={COMPONENTS_PATH_PREFIX}
                onClick={() => {
                  setNavIntent(COMPONENTS_PATH_PREFIX);
                  openSecondary();
                }}
              >
                <span>Components</span>
                <ChevronRightIcon className="shrink-0 text-neutral-500" />
              </Link>
            </nav>
            <div className="min-h-0 flex-1" />
          </div>

          <div className="flex min-h-0 w-1/2 flex-col">
            <div className={`shrink-0 ${SLIDE_PANEL_TOP_CLASS}`}>
              <button
                className={`${NAV_ROW_CLASS} gap-2`}
                onClick={goBack}
                type="button"
              >
                <ChevronLeftIcon className="shrink-0 text-neutral-500" />
                Back
              </button>
            </div>
            {secondaryIsComponents ? (
              <nav
                aria-labelledby={`${navId}-components`}
                className={INNER_NAV_CLASS}
                key="nest-components"
              >
                <p className="sr-only" id={`${navId}-components`}>
                  Component gallery
                </p>
                <div className="flex flex-col gap-4">
                  <div>
                    <Link
                      className={navLinkClass(
                        isPageActive(SITE_COMPONENTS_OVERVIEW.href, pathname)
                      )}
                      href={SITE_COMPONENTS_OVERVIEW.href}
                    >
                      {SITE_COMPONENTS_OVERVIEW.label}
                    </Link>
                  </div>
                  <NavSections
                    pathname={pathname}
                    sections={[SITE_COMPONENTS_GROUP_SECTION]}
                  />
                </div>
              </nav>
            ) : (
              <nav
                aria-labelledby={navId}
                className={INNER_NAV_CLASS}
                key="nest-docs"
              >
                <p className="sr-only" id={navId}>
                  Documentation
                </p>
                <NavSections
                  pathname={pathname}
                  sections={SITE_DOCS_NAV_TREE}
                />
              </nav>
            )}
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
