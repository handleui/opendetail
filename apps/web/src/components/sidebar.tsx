"use client";

import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  House,
  LayoutTemplate,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import {
  COMPONENTS_PATH_PREFIX,
  isUnderComponentsPathname,
  isUnderSiteSecondaryNavPathname,
  SITE_COMPONENTS_GROUP_SECTION,
  SITE_COMPONENTS_OVERVIEW,
  SITE_DOCS_NAV_TREE,
  type SiteNavNode,
} from "@/lib/site-nav";

type SidebarDepth = 0 | 1;

function pathMatchesIntent(pathname: string, intent: string): boolean {
  const normalized =
    pathname.endsWith("/") && pathname.length > 1
      ? pathname.slice(0, -1)
      : pathname;
  const intentNorm =
    intent.endsWith("/") && intent.length > 1 ? intent.slice(0, -1) : intent;
  if (normalized === intentNorm) {
    return true;
  }
  if (intentNorm === "/") {
    return normalized === "/";
  }
  return normalized.startsWith(`${intentNorm}/`);
}

/** Until `usePathname()` catches up after a top-level Docs/Components click — avoids wrong nest flash. */
function useSiteNavEffectivePathname(pathname: string): {
  effectivePathname: string;
  setNavIntent: (href: string) => void;
} {
  const [intent, setIntent] = useState<string | null>(null);

  useEffect(() => {
    if (intent === null) {
      return;
    }
    if (pathMatchesIntent(pathname, intent)) {
      setIntent(null);
    }
  }, [pathname, intent]);

  return {
    effectivePathname: intent ?? pathname,
    setNavIntent: setIntent,
  };
}

function useSiteSidebarRailDepth(
  pathname: string,
  docsPathPrefix: string
): {
  showSecondaryPanel: boolean;
  goBack: () => void;
  openSecondary: () => void;
  openHome: () => void;
} {
  const [depth, setDepth] = useState<SidebarDepth>(() =>
    isUnderSiteSecondaryNavPathname(pathname, docsPathPrefix) ? 1 : 0
  );

  const prevPathnameRef = useRef(pathname);

  useEffect(() => {
    const prev = prevPathnameRef.current;
    if (prev === pathname) {
      return;
    }
    prevPathnameRef.current = pathname;

    const wasUnder = isUnderSiteSecondaryNavPathname(prev, docsPathPrefix);
    const nowUnder = isUnderSiteSecondaryNavPathname(pathname, docsPathPrefix);

    if (!wasUnder && nowUnder) {
      setDepth(1);
      return;
    }
    if (wasUnder && !nowUnder) {
      setDepth(0);
    }
  }, [pathname, docsPathPrefix]);

  return {
    showSecondaryPanel: depth >= 1,
    goBack: () => setDepth(0),
    openSecondary: () => setDepth(1),
    openHome: () => setDepth(0),
  };
}

/** Group labels in the secondary panel. */
const SECTION_TITLE_CLASS =
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

const navLinkClass = (active: boolean) =>
  [
    "block cursor-pointer rounded-md px-3 py-1.5 text-[14px] text-neutral-900 leading-snug transition-colors",
    active ? "bg-neutral-100" : "hover:bg-neutral-100/80",
  ].join(" ");

const INNER_NAV_CLASS =
  "docs-sidebar-scroll min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain px-2 pt-3 pb-4";

/** Lucide / row raster slot — keep in sync with `web-root-shell` social icon size. */
const ROW_ICON_PX = 14;
const DEFAULT_ROW_ICON_SIZE = ROW_ICON_PX;
const DEFAULT_MADE_BY_HUMAN_HREF = "https://x.com/handleui";

function isPageActive(href: string, pathname: string): boolean {
  return pathname === href;
}

const ROW_TRAILING_ICON_CLASS = "shrink-0 text-black";

/** Fixed slot for root-row Lucide / social SVGs only. */
function RootRowIconSlot({
  children,
  rowIconSize,
}: {
  children: ReactNode;
  rowIconSize: number;
}) {
  const style: CSSProperties = {
    width: rowIconSize,
    height: rowIconSize,
  };
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center text-black"
      style={style}
    >
      {children}
    </span>
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

function NestedNavItems({
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
              <ArrowRight
                aria-hidden="true"
                className={ROW_TRAILING_ICON_CLASS}
                size={ROW_ICON_PX}
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function NestedNavSections({
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
          <p className={SECTION_TITLE_CLASS}>{section.title}</p>
          <div className="mt-2">
            <NestedNavItems nodes={section.items} pathname={pathname} />
          </div>
        </div>
      ))}
    </div>
  );
}

export interface SidebarProps {
  docsPathPrefix?: string;
  githubHref: string;
  githubIcon: ReactNode;
  madeByHumanHref?: string;
  npmHref: string;
  npmIcon: ReactNode;
  productTitle: string;
  productVersionLabel: string;
  /** Root row icons (Home, Resources, Social) — default 14px. */
  rowIconSize?: number;
}

export function Sidebar({
  productTitle,
  productVersionLabel,
  githubHref,
  githubIcon,
  npmHref,
  npmIcon,
  docsPathPrefix = "/docs",
  madeByHumanHref = DEFAULT_MADE_BY_HUMAN_HREF,
  rowIconSize = DEFAULT_ROW_ICON_SIZE,
}: SidebarProps) {
  const pathname = usePathname();
  const { effectivePathname, setNavIntent } =
    useSiteNavEffectivePathname(pathname);
  const navId = useId();
  const prefersReducedMotion = useReducedMotion();
  const { showSecondaryPanel, goBack, openSecondary, openHome } =
    useSiteSidebarRailDepth(pathname, docsPathPrefix);

  const innerTransition = prefersReducedMotion
    ? { duration: 0 }
    : PANEL_SLIDE_TRANSITION;

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
              className={`flex shrink-0 flex-col gap-5 ${SLIDE_PANEL_TOP_CLASS} pb-4`}
            >
              <Link
                className={[
                  navLinkClass(pathname === "/"),
                  "flex items-center gap-2",
                ].join(" ")}
                href="/"
                onClick={() => {
                  setNavIntent("/");
                  openHome();
                }}
              >
                <RootRowIconSlot rowIconSize={rowIconSize}>
                  <House
                    aria-hidden="true"
                    className="shrink-0 text-black"
                    size={rowIconSize}
                  />
                </RootRowIconSlot>
                Home
              </Link>

              <div>
                <p className={SECTION_TITLE_CLASS}>Resources</p>
                <div className="mt-2 flex flex-col gap-0.5">
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
                    <span className="flex min-w-0 items-center gap-2">
                      <RootRowIconSlot rowIconSize={rowIconSize}>
                        <BookOpen
                          aria-hidden="true"
                          className="shrink-0 text-black"
                          size={rowIconSize}
                        />
                      </RootRowIconSlot>
                      <span>Docs</span>
                    </span>
                    <ArrowRight
                      aria-hidden="true"
                      className={ROW_TRAILING_ICON_CLASS}
                      size={ROW_ICON_PX}
                    />
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
                    <span className="flex min-w-0 items-center gap-2">
                      <RootRowIconSlot rowIconSize={rowIconSize}>
                        <LayoutTemplate
                          aria-hidden="true"
                          className="shrink-0 text-black"
                          size={rowIconSize}
                        />
                      </RootRowIconSlot>
                      <span>Components</span>
                    </span>
                    <ArrowRight
                      aria-hidden="true"
                      className={ROW_TRAILING_ICON_CLASS}
                      size={ROW_ICON_PX}
                    />
                  </Link>
                </div>
              </div>

              <div>
                <p className={SECTION_TITLE_CLASS}>Social</p>
                <div className="mt-2 flex flex-col gap-0.5">
                  <a
                    className={`${NAV_ROW_CLASS} justify-between`}
                    href={githubHref}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <RootRowIconSlot rowIconSize={rowIconSize}>
                        {githubIcon}
                      </RootRowIconSlot>
                      GitHub
                    </span>
                    <ArrowUpRight
                      aria-hidden="true"
                      className={ROW_TRAILING_ICON_CLASS}
                      size={ROW_ICON_PX}
                    />
                  </a>
                  <a
                    className={`${NAV_ROW_CLASS} justify-between`}
                    href={npmHref}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <RootRowIconSlot rowIconSize={rowIconSize}>
                        {npmIcon}
                      </RootRowIconSlot>
                      npm
                    </span>
                    <ArrowUpRight
                      aria-hidden="true"
                      className={ROW_TRAILING_ICON_CLASS}
                      size={ROW_ICON_PX}
                    />
                  </a>
                </div>
              </div>
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
                <ArrowLeft
                  aria-hidden="true"
                  className={ROW_TRAILING_ICON_CLASS}
                  size={ROW_ICON_PX}
                />
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
                  <NestedNavSections
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
                <NestedNavSections
                  pathname={pathname}
                  sections={SITE_DOCS_NAV_TREE}
                />
              </nav>
            )}
          </div>
        </motion.div>
      </div>

      <div className="shrink-0 px-5 py-4">
        <p className="text-[14px] text-neutral-600 leading-snug">
          Made by a{" "}
          <a
            className="inline-flex items-center gap-0.5 text-neutral-900 underline decoration-neutral-400 underline-offset-[3px] transition-colors hover:text-neutral-700 hover:decoration-neutral-600"
            href={madeByHumanHref}
            rel="noopener noreferrer"
            target="_blank"
          >
            human
            <ArrowUpRight
              aria-hidden="true"
              className="shrink-0 text-black"
              size={ROW_ICON_PX}
            />
          </a>
        </p>
      </div>
    </div>
  );
}
