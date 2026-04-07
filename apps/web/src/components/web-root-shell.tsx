"use client";

import { Menu, Wand2 } from "lucide-react";
import Image from "next/image";
import { FumadocsAssistant } from "opendetail-fumadocs/assistant";
import { type MouseEvent, type ReactNode, useState } from "react";
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
const MOBILE_ASK_AI_BUTTON_CLASS =
  "inline-flex cursor-pointer items-center gap-2 rounded-md bg-neutral-100 px-3 py-1.5 text-[14px] text-neutral-900 leading-snug transition-colors hover:bg-neutral-200/90";
const MOBILE_MENU_BUTTON_CLASS =
  "inline-flex cursor-pointer items-center gap-2 rounded-md text-[14px] text-neutral-900 leading-snug transition-colors hover:bg-neutral-100/80 px-0.5 py-0.5";

function MobileCenterTopbar({
  onAssistantOpen,
  onOpenMenu,
}: {
  onAssistantOpen: () => void;
  onOpenMenu: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center justify-between border-neutral-200 border-b bg-white px-5 py-3">
      <button
        className={MOBILE_MENU_BUTTON_CLASS}
        onClick={onOpenMenu}
        type="button"
      >
        <Menu aria-hidden="true" size={16} />
        <span className="font-normal tracking-[-0.56px]">
          {appName} {productVersionLabel}
        </span>
      </button>
      <button
        className={MOBILE_ASK_AI_BUTTON_CLASS}
        onClick={onAssistantOpen}
        type="button"
      >
        <Wand2 aria-hidden="true" size={14} />
        Ask AI
      </button>
    </div>
  );
}

function MobileColumnLayout({
  content,
  contentClassName,
}: {
  content: ReactNode;
  contentClassName?: string;
}) {
  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <div
        className={
          contentClassName ?? "min-h-0 flex-1 touch-pan-y overflow-hidden"
        }
      >
        {content}
      </div>
    </div>
  );
}

function onLeadingLinkClickCapture(
  event: MouseEvent<HTMLElement>,
  setColumn: (column: "center" | "leading" | "trailing") => void
) {
  const target = event.target as HTMLElement | null;
  if (target?.closest("a[href]:not([data-trifold-stay])")) {
    setColumn("center");
  }
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
        <div
          className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden overscroll-none bg-white"
          data-trifold-phone=""
        >
          {slots.column === "center" ? (
            <MobileCenterTopbar
              onAssistantOpen={() => slots.setColumn("trailing")}
              onOpenMenu={() => slots.setColumn("leading")}
            />
          ) : null}
          {slots.column === "leading" ? (
            <MobileColumnLayout
              content={
                <div
                  className="h-full min-h-0"
                  onClickCapture={(event) =>
                    onLeadingLinkClickCapture(event, slots.setColumn)
                  }
                >
                  {slots.navigation}
                </div>
              }
              contentClassName="min-h-0 flex-1 overflow-y-auto overscroll-contain touch-pan-y border-[var(--opendetail-color-sidebar-stroke)] border-e border-solid bg-white"
            />
          ) : null}
          {slots.column === "center" ? (
            <MobileColumnLayout
              content={slots.main}
              contentClassName="min-h-0 flex-1 overflow-y-auto overscroll-contain touch-pan-y"
            />
          ) : null}
          {slots.column === "trailing" ? (
            <MobileColumnLayout
              content={slots.assistant}
              contentClassName="min-h-0 flex-1 overflow-y-auto overscroll-contain touch-pan-y bg-[var(--opendetail-color-background)]"
            />
          ) : null}
        </div>
      )}
    >
      <SiteShell>{children}</SiteShell>
    </FumadocsAssistant>
  );
};
