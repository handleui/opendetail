"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { appName, docsRoute, gitConfig } from "@/lib/shared";

const githubHref = `https://github.com/${gitConfig.user}/${gitConfig.repo}`;

const navLinkClass =
  "rounded-md px-2.5 py-1.5 text-[14px] leading-5 text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900";

const siteHeaderChromeClass =
  "shrink-0 border-[var(--opendetail-color-sidebar-stroke)] border-b bg-white/90 backdrop-blur-md supports-[backdrop-filter]:bg-white/75";

const siteHeaderBarClass =
  "flex h-[48px] w-full items-center justify-between gap-4 px-5";

function SiteHeaderBrand() {
  return (
    <Link
      className="font-medium text-[14px] text-neutral-950 tracking-tight transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-neutral-900 focus-visible:outline-offset-2"
      href="/"
    >
      {appName}
    </Link>
  );
}

function SitePrimaryNav() {
  const pathname = usePathname();
  const isDocs = pathname === docsRoute || pathname.startsWith(`${docsRoute}/`);
  const isHome = pathname === "/";

  return (
    <nav aria-label="Primary">
      <ul className="flex items-center gap-0.5 sm:gap-1">
        <li>
          <Link
            aria-current={isHome ? "page" : undefined}
            className={navLinkClass}
            href="/"
          >
            Home
          </Link>
        </li>
        <li>
          <Link
            aria-current={isDocs ? "page" : undefined}
            className={navLinkClass}
            href={docsRoute}
          >
            Docs
          </Link>
        </li>
        <li>
          <a
            className={navLinkClass}
            href={githubHref}
            rel="noopener noreferrer"
            target="_blank"
          >
            GitHub
          </a>
        </li>
      </ul>
    </nav>
  );
}

function SiteHeaderBar() {
  return (
    <div className={siteHeaderBarClass}>
      <SiteHeaderBrand />
      <SitePrimaryNav />
    </div>
  );
}

export const SiteHeader = () => (
  <header className={siteHeaderChromeClass}>
    <SiteHeaderBar />
  </header>
);
