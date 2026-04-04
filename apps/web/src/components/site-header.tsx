"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { appName, docsRoute, gitConfig } from "@/lib/shared";

const githubHref = `https://github.com/${gitConfig.user}/${gitConfig.repo}`;

const navLinkClass =
  "rounded-md px-2.5 py-1.5 text-[14px] leading-5 text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900";

export const SiteHeader = () => {
  const pathname = usePathname();
  const isDocs = pathname === docsRoute || pathname.startsWith(`${docsRoute}/`);
  const isHome = pathname === "/";

  return (
    <header className="shrink-0 border-[var(--opendetail-color-sidebar-stroke)] border-b bg-white/90 backdrop-blur-md supports-[backdrop-filter]:bg-white/75">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          className="font-medium text-[14px] text-neutral-950 tracking-tight transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-neutral-900 focus-visible:outline-offset-2"
          href="/"
        >
          {appName}
        </Link>
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
      </div>
    </header>
  );
};
