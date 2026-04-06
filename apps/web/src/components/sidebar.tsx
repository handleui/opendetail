"use client";

import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  House,
  LayoutTemplate,
  ScrollText,
  Wand2,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
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
  isUnderSiteSecondaryNavPathname,
  isUnderUiDocsPathname,
  SITE_DOCS_ROUTER,
  SITE_UI_DOCS_ROUTER,
  type SiteNavNode,
  type SiteNavSection,
  UI_DOCS_PATH_PREFIX,
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

/** Until `usePathname()` catches up after a top-level Docs / Assistant UI click — avoids wrong nest flash. */
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
/** Sidebar header mark — matches public favicon (slightly larger than nav row icons). */
const HEADER_MARK_PX = 16;
/** Site icon stroke width; GitHub/npm slots use filled SVGs (no stroke). */
const SIDEBAR_LUCIDE_STROKE_PX = 1.5;
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
                strokeWidth={SIDEBAR_LUCIDE_STROKE_PX}
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function nestedSectionKey(section: {
  title: string;
  items: readonly SiteNavNode[];
}): string {
  const itemPart = section.items
    .map((n) => (n.kind === "page" ? n.href : n.id))
    .join("|");
  return `${section.title}::${itemPart}`;
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
        <div key={nestedSectionKey(section)}>
          {section.title.trim() ? (
            <p className={SECTION_TITLE_CLASS}>{section.title}</p>
          ) : null}
          <div className={section.title.trim() ? "mt-2" : undefined}>
            <NestedNavItems nodes={section.items} pathname={pathname} />
          </div>
        </div>
      ))}
    </div>
  );
}

export interface SidebarProps {
  /** Whether the assistant panel is open (for pressed styling). */
  assistantOpen?: boolean;
  docsPathPrefix?: string;
  /** Documentation nested panel — from `source.getPageTree()` (server). */
  docsSidebarSections: readonly SiteNavSection[];
  githubHref: string;
  githubIcon: ReactNode;
  madeByHumanHref?: string;
  npmHref: string;
  npmIcon: ReactNode;
  /** Toggles the site assistant (AI) sidebar open/closed. */
  onAssistantToggle?: () => void;
  productTitle: string;
  productVersionLabel: string;
  /** Root row icons (site nav + Social) — default 14px. */
  rowIconSize?: number;
  /** Assistant UI nested panel — static link to the UI sandbox. */
  uiSidebarSections: readonly SiteNavSection[];
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
  assistantOpen = false,
  onAssistantToggle,
  rowIconSize = DEFAULT_ROW_ICON_SIZE,
  docsSidebarSections,
  uiSidebarSections,
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

  const secondaryIsUiDocs = isUnderUiDocsPathname(effectivePathname);
  const docsRootActive =
    pathname === docsPathPrefix || pathname.startsWith(`${docsPathPrefix}/`);
  const uiDocsRootActive =
    pathname === UI_DOCS_PATH_PREFIX ||
    pathname.startsWith(`${UI_DOCS_PATH_PREFIX}/`);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-5">
        <div className="shrink-0 px-5 pt-5">
          <div className="flex w-full min-w-0 items-center justify-between gap-3">
            <Image
              alt=""
              className="block shrink-0 rounded-[4px] object-contain"
              height={HEADER_MARK_PX}
              src="/favicon.png"
              unoptimized
              width={HEADER_MARK_PX}
            />
            <div className="flex min-w-0 flex-wrap items-baseline justify-end gap-1 text-right">
              <span className="font-normal text-[14px] text-black tracking-[-0.56px]">
                {productTitle}
              </span>
              <span className="font-normal text-[#a4a4a4] text-[13px] tabular-nums tracking-tight">
                {productVersionLabel}
              </span>
            </div>
          </div>
        </div>

        {onAssistantToggle ? (
          <div
            className={`flex w-full shrink-0 flex-col ${SLIDE_PANEL_TOP_CLASS}`}
          >
            <button
              aria-pressed={assistantOpen}
              className={[
                "mx-2 flex min-w-0 cursor-pointer items-center justify-center gap-2 self-stretch rounded-md border-0 px-3 py-1.5 font-normal text-[14px] text-neutral-900 leading-snug transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-neutral-400 focus-visible:outline-offset-2",
                assistantOpen
                  ? "bg-neutral-200/90 hover:bg-neutral-300/80"
                  : "bg-neutral-100 hover:bg-neutral-200/90",
              ].join(" ")}
              onClick={onAssistantToggle}
              type="button"
            >
              <Wand2
                aria-hidden="true"
                className="shrink-0 text-black"
                size={rowIconSize}
                strokeWidth={SIDEBAR_LUCIDE_STROKE_PX}
              />
              Ask AI
            </button>
          </div>
        ) : null}

        <div className="relative min-h-0 flex-1 overflow-hidden">
          <motion.div
            animate={{
              x: showSecondaryPanel ? "-50%" : "0%",
            }}
            className="flex h-full min-h-0 w-[200%] touch-manipulation flex-row will-change-transform"
            initial={false}
            transition={innerTransition}
          >
            <div className="flex min-h-0 w-1/2 flex-col">
              <nav
                aria-label="Site"
                className={`flex shrink-0 flex-col gap-5 ${SLIDE_PANEL_TOP_CLASS} pb-4`}
              >
                <div className="flex flex-col gap-0.5">
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
                        strokeWidth={SIDEBAR_LUCIDE_STROKE_PX}
                      />
                    </RootRowIconSlot>
                    Home
                  </Link>
                  <Link
                    className={[
                      navLinkClass(pathname === "/changelog"),
                      "flex items-center gap-2",
                    ].join(" ")}
                    href="/changelog"
                    onClick={() => {
                      setNavIntent("/changelog");
                      openHome();
                    }}
                  >
                    <RootRowIconSlot rowIconSize={rowIconSize}>
                      <ScrollText
                        aria-hidden="true"
                        className="shrink-0 text-black"
                        size={rowIconSize}
                        strokeWidth={SIDEBAR_LUCIDE_STROKE_PX}
                      />
                    </RootRowIconSlot>
                    Changelog
                  </Link>
                  <Link
                    className={[
                      NAV_ROW_CLASS,
                      "justify-between",
                      docsRootActive ? "bg-neutral-100" : "",
                    ].join(" ")}
                    data-trifold-stay=""
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
                          strokeWidth={SIDEBAR_LUCIDE_STROKE_PX}
                        />
                      </RootRowIconSlot>
                      <span>Docs</span>
                    </span>
                    <ArrowRight
                      aria-hidden="true"
                      className={ROW_TRAILING_ICON_CLASS}
                      size={ROW_ICON_PX}
                      strokeWidth={SIDEBAR_LUCIDE_STROKE_PX}
                    />
                  </Link>
                  <Link
                    className={[
                      NAV_ROW_CLASS,
                      "justify-between",
                      uiDocsRootActive ? "bg-neutral-100" : "",
                    ].join(" ")}
                    data-trifold-stay=""
                    href={UI_DOCS_PATH_PREFIX}
                    onClick={() => {
                      setNavIntent(UI_DOCS_PATH_PREFIX);
                      openSecondary();
                    }}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <RootRowIconSlot rowIconSize={rowIconSize}>
                        <LayoutTemplate
                          aria-hidden="true"
                          className="shrink-0 text-black"
                          size={rowIconSize}
                          strokeWidth={SIDEBAR_LUCIDE_STROKE_PX}
                        />
                      </RootRowIconSlot>
                      <span>UI sandbox</span>
                    </span>
                    <ArrowRight
                      aria-hidden="true"
                      className={ROW_TRAILING_ICON_CLASS}
                      size={ROW_ICON_PX}
                      strokeWidth={SIDEBAR_LUCIDE_STROKE_PX}
                    />
                  </Link>
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
                        strokeWidth={SIDEBAR_LUCIDE_STROKE_PX}
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
                        strokeWidth={SIDEBAR_LUCIDE_STROKE_PX}
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
                    strokeWidth={SIDEBAR_LUCIDE_STROKE_PX}
                  />
                  Back
                </button>
              </div>
              {secondaryIsUiDocs ? (
                <nav
                  aria-labelledby={`${navId}-ui-docs`}
                  className={INNER_NAV_CLASS}
                  key="nest-ui-docs"
                >
                  <p className="sr-only" id={`${navId}-ui-docs`}>
                    UI sandbox
                  </p>
                  <div className="flex flex-col gap-4">
                    <div>
                      <Link
                        className={navLinkClass(
                          isPageActive(SITE_UI_DOCS_ROUTER.href, pathname)
                        )}
                        href={SITE_UI_DOCS_ROUTER.href}
                      >
                        {SITE_UI_DOCS_ROUTER.label}
                      </Link>
                    </div>
                    <NestedNavSections
                      pathname={pathname}
                      sections={uiSidebarSections}
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
                  <div className="flex flex-col gap-4">
                    <div>
                      <Link
                        className={navLinkClass(
                          isPageActive(SITE_DOCS_ROUTER.href, pathname)
                        )}
                        href={SITE_DOCS_ROUTER.href}
                      >
                        {SITE_DOCS_ROUTER.label}
                      </Link>
                    </div>
                    <NestedNavSections
                      pathname={pathname}
                      sections={docsSidebarSections}
                    />
                  </div>
                </nav>
              )}
            </div>
          </motion.div>
        </div>
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
              strokeWidth={SIDEBAR_LUCIDE_STROKE_PX}
            />
          </a>
        </p>
      </div>
    </div>
  );
}
