"use client";

import Image from "next/image";
import { FumadocsAssistant } from "opendetail-fumadocs/assistant";
import { type ReactNode, useState } from "react";
import { Trifold } from "trifold";
import { Sidebar } from "@/components/sidebar";
import { SiteShell } from "@/components/site-shell";
import {
  appName,
  gitConfig,
  npmPackageUrl,
  productVersionLabel,
} from "@/lib/shared";

const githubHref = `https://github.com/${gitConfig.user}/${gitConfig.repo}`;

const SITE_NAV_ROW_ICON_PX = 14;

export const WebRootShell = ({
  children,
  knownSourcePageUrls,
}: {
  children: ReactNode;
  knownSourcePageUrls: readonly string[];
}) => {
  const [assistantOpen, setAssistantOpen] = useState(false);

  const navigation = (
    <Sidebar
      assistantOpen={assistantOpen}
      githubHref={githubHref}
      githubIcon={
        <Image
          alt=""
          className="block max-h-full max-w-full object-contain brightness-0"
          height={SITE_NAV_ROW_ICON_PX}
          src="/github.svg"
          unoptimized
          width={SITE_NAV_ROW_ICON_PX}
        />
      }
      npmHref={npmPackageUrl}
      npmIcon={
        <Image
          alt=""
          className="block max-h-full max-w-full object-contain"
          height={SITE_NAV_ROW_ICON_PX}
          src="/npm.svg"
          unoptimized
          width={SITE_NAV_ROW_ICON_PX}
        />
      }
      onAssistantToggle={() => {
        setAssistantOpen((open) => !open);
      }}
      productTitle={appName}
      productVersionLabel={productVersionLabel}
      rowIconSize={SITE_NAV_ROW_ICON_PX}
    />
  );

  return (
    <FumadocsAssistant
      inputId="opendetail-site-question"
      knownSourcePageUrls={knownSourcePageUrls}
      navigation={navigation}
      onOpenChange={setAssistantOpen}
      open={assistantOpen}
      persistence={{
        key: "opendetail-site-sidebar",
      }}
      placeholder="Ask AI anything..."
      renderMobileShell={(slots) => (
        <Trifold
          center={slots.main}
          centerClassName="bg-white"
          className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden overscroll-none"
          column={slots.column}
          leading={slots.navigation}
          leadingClassName="border-[var(--opendetail-color-sidebar-stroke)] border-e border-solid bg-white"
          onColumnChange={slots.setColumn}
          trailing={slots.assistant}
          trailingClassName="bg-[var(--opendetail-color-background)]"
        />
      )}
    >
      <SiteShell>{children}</SiteShell>
    </FumadocsAssistant>
  );
};
