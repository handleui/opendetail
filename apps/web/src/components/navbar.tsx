"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { appName, docsRoute, gitConfig } from "@/lib/shared";

const githubHref = `https://github.com/${gitConfig.user}/${gitConfig.repo}`;

const navChromeClass =
  "relative grid h-12 shrink-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center border-[#f2f2f2] border-b bg-white px-6";

const brandClass =
  "justify-self-start font-normal text-[14px] text-black tracking-[-0.56px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900";

const centerNavClass =
  "flex items-center justify-center gap-6 font-normal text-[14px] text-black tracking-[-0.56px]";

const centerLinkClass =
  "inline-block select-none whitespace-nowrap transition-[opacity,transform] duration-150 hover:opacity-60 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900";

function NavbarBrand() {
  return (
    <Link className={brandClass} href="/">
      {appName}
    </Link>
  );
}

function NavbarCenterNav() {
  const pathname = usePathname();
  const isDocs = pathname === docsRoute || pathname.startsWith(`${docsRoute}/`);
  const isHome = pathname === "/";
  const isSandbox = pathname === "/demo" || pathname.startsWith("/demo/");

  return (
    <nav aria-label="Primary" className={centerNavClass}>
      <Link
        aria-current={isHome ? "page" : undefined}
        className={centerLinkClass}
        href="/"
      >
        Product
      </Link>
      <Link
        aria-current={isSandbox ? "page" : undefined}
        className={centerLinkClass}
        href="/demo"
      >
        Sandbox
      </Link>
      <Link
        aria-current={isDocs ? "page" : undefined}
        className={centerLinkClass}
        href={docsRoute}
      >
        Documentation
      </Link>
    </nav>
  );
}

function NavbarGithub() {
  return (
    <a
      aria-label="GitHub repository"
      className="justify-self-end"
      href={githubHref}
      rel="noopener noreferrer"
      target="_blank"
    >
      <Image
        alt=""
        className="block size-5 max-w-none"
        height={20}
        src="/github.svg"
        unoptimized
        width={20}
      />
    </a>
  );
}

export const Navbar = () => (
  <header className={navChromeClass}>
    <NavbarBrand />
    <NavbarCenterNav />
    <NavbarGithub />
  </header>
);
