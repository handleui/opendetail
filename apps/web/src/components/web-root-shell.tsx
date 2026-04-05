"use client";

import Image from "next/image";
import { FumadocsAppSidebar } from "opendetail-fumadocs/app-sidebar";
import { FumadocsAssistantSidebar } from "opendetail-fumadocs/sidebar";
import type { ReactNode } from "react";

import { Trifold } from "trifold";
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
      renderMobileShell={(slots) => (
        <Trifold
          className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden overscroll-none"
          leading={slots.navigation}
          leadingClassName="border-[var(--opendetail-color-sidebar-stroke)] border-e border-solid bg-white"
          main={slots.main}
          mainClassName="bg-white"
          onPanelIndexChange={slots.setPanelIndex}
          panelIndex={slots.panelIndex}
          trailing={slots.assistant}
          trailingClassName="bg-[var(--opendetail-color-background)]"
        />
      )}
    >
      <SiteShell>{children}</SiteShell>
    </FumadocsAssistantSidebar>
  );
};
