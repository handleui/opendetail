import Image from "next/image";
import { FumadocsAppSidebar } from "opendetail-fumadocs/app-sidebar";
import type { ReactNode } from "react";

import {
  appName,
  gitConfig,
  npmPackageUrl,
  productVersionLabel,
} from "@/lib/shared";

const githubHref = `https://github.com/${gitConfig.user}/${gitConfig.repo}`;

export const SiteShell = ({ children }: { children: ReactNode }) => (
  <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden bg-white">
    <div className="site-shell__main flex min-h-0 min-w-0 flex-1 overflow-hidden">
      <div
        className="flex min-h-0 min-w-0 flex-1 overflow-hidden bg-white text-neutral-900"
        data-docs-page-shell=""
      >
        <aside
          aria-label="Site navigation"
          className="hidden min-h-0 w-[250px] shrink-0 flex-col overflow-hidden border-[var(--opendetail-color-sidebar-stroke)] border-e border-solid bg-white md:flex"
        >
          <FumadocsAppSidebar
            githubHref={githubHref}
            githubIcon={
              <Image
                alt=""
                className="block size-4 max-w-none"
                height={16}
                src="/github.svg"
                unoptimized
                width={16}
              />
            }
            npmHref={npmPackageUrl}
            npmIcon={
              <Image
                alt=""
                className="block size-4 max-w-none"
                height={16}
                src="/npm.svg"
                unoptimized
                width={16}
              />
            }
            productTitle={appName}
            productVersionLabel={productVersionLabel}
          />
        </aside>
        <div className="docs-main-scroll flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overscroll-contain">
          <div className="w-full px-6 py-10">
            <div className="mx-auto w-full max-w-[650px]">{children}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
