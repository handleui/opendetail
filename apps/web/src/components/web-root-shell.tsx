"use client";

import Image from "next/image";
import { Menu, MessageSquareText, PanelLeftClose, PanelRightClose } from "lucide-react";
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
import type { SiteNavSection } from "@/lib/site-nav";

const githubHref = `https://github.com/${gitConfig.user}/${gitConfig.repo}`;

const SITE_NAV_ROW_ICON_PX = 14;
const MOBILE_TOPBAR_BUTTON_CLASS =
  "inline-flex cursor-pointer items-center gap-1 rounded-md border border-neutral-200 bg-white px-2.5 py-1.5 text-[13px] text-neutral-800 leading-none transition-colors hover:bg-neutral-100";

function MobileShellTopbar({
  leftAction,
  rightAction,
}: {
  leftAction: ReactNode;
  rightAction: ReactNode;
}) {
  return (
    <div className="flex h-12 shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-3">
      {leftAction}
      {rightAction}
    </div>
  );
}

function MobileColumnLayout({
  topbar,
  content,
}: {
  topbar: ReactNode;
  content: ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      {topbar}
      <div className="min-h-0 flex-1 overflow-hidden">{content}</div>
    </div>
  );
}

export const WebRootShell = ({
  children,
  knownSourcePageUrls,
  docsSidebarSections,
}: {
  children: ReactNode;
  knownSourcePageUrls: readonly string[];
  docsSidebarSections: readonly SiteNavSection[];
}) => {
  const [assistantOpen, setAssistantOpen] = useState(false);

  const navigation = (
    <Sidebar
      assistantOpen={assistantOpen}
      docsSidebarSections={docsSidebarSections}
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
          center={
            <MobileColumnLayout
              content={slots.main}
              topbar={
                <MobileShellTopbar
                  leftAction={
                    <button
                      className={MOBILE_TOPBAR_BUTTON_CLASS}
                      onClick={() => slots.setColumn("leading")}
                      type="button"
                    >
                      <Menu aria-hidden="true" size={14} />
                      Menu
                    </button>
                  }
                  rightAction={
                    <button
                      className={MOBILE_TOPBAR_BUTTON_CLASS}
                      onClick={() => slots.setColumn("trailing")}
                      type="button"
                    >
                      <MessageSquareText aria-hidden="true" size={14} />
                      Ask AI
                    </button>
                  }
                />
              }
            />
          }
          centerClassName="bg-white"
          className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden overscroll-none"
          column={slots.column}
          leading={
            <MobileColumnLayout
              content={slots.navigation}
              topbar={
                <MobileShellTopbar
                  leftAction={
                    <button
                      className={MOBILE_TOPBAR_BUTTON_CLASS}
                      onClick={() => slots.setColumn("center")}
                      type="button"
                    >
                      <PanelLeftClose aria-hidden="true" size={14} />
                      Content
                    </button>
                  }
                  rightAction={
                    <button
                      className={MOBILE_TOPBAR_BUTTON_CLASS}
                      onClick={() => slots.setColumn("trailing")}
                      type="button"
                    >
                      <MessageSquareText aria-hidden="true" size={14} />
                      Ask AI
                    </button>
                  }
                />
              }
            />
          }
          leadingClassName="border-[var(--opendetail-color-sidebar-stroke)] border-e border-solid bg-white"
          leadingLinkSelector="a[href]:not([data-trifold-stay])"
          onColumnChange={slots.setColumn}
          swipeDistanceThresholdPx={72}
          swipeVelocityThresholdPxPerSec={700}
          trailing={
            <MobileColumnLayout
              content={slots.assistant}
              topbar={
                <MobileShellTopbar
                  leftAction={
                    <button
                      className={MOBILE_TOPBAR_BUTTON_CLASS}
                      onClick={() => slots.setColumn("leading")}
                      type="button"
                    >
                      <Menu aria-hidden="true" size={14} />
                      Menu
                    </button>
                  }
                  rightAction={
                    <button
                      className={MOBILE_TOPBAR_BUTTON_CLASS}
                      onClick={() => slots.setColumn("center")}
                      type="button"
                    >
                      <PanelRightClose aria-hidden="true" size={14} />
                      Content
                    </button>
                  }
                />
              }
            />
          }
          trailingClassName="bg-[var(--opendetail-color-background)]"
        />
      )}
    >
      <SiteShell>{children}</SiteShell>
    </FumadocsAssistant>
  );
};
