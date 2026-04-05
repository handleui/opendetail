"use client";

import Image from "next/image";
import { FumadocsAppSidebar } from "opendetail-fumadocs/app-sidebar";
import { FumadocsAssistantSidebar } from "opendetail-fumadocs/sidebar";
import type { ReactNode } from "react";

import { MobileTriptychShell } from "@/components/mobile-triptych/mobile-triptych-shell";
import { SiteShell } from "@/components/site-shell";
import {
  appName,
  gitConfig,
  npmPackageUrl,
  productVersionLabel,
} from "@/lib/shared";

const githubHref = `https://github.com/${gitConfig.user}/${gitConfig.repo}`;

export const WebRootShell = ({
  children,
  knownSourcePageUrls,
}: {
  children: ReactNode;
  knownSourcePageUrls: readonly string[];
}) => {
  const navigation = (
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
  );

  return (
    <FumadocsAssistantSidebar
      inputId="opendetail-site-question"
      knownSourcePageUrls={knownSourcePageUrls}
      navigation={navigation}
      persistence={{
        key: "opendetail-site-sidebar",
      }}
      placeholder="Ask AI anything..."
      renderMobileShell={(slots) => <MobileTriptychShell {...slots} />}
    >
      <SiteShell>{children}</SiteShell>
    </FumadocsAssistantSidebar>
  );
};
