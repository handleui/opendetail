"use client";

import { renderNextSourceLink } from "opendetail-next/link";
import {
  AssistantSidebarShell,
  type AssistantSidebarShellProps,
} from "opendetail-react";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { createFumadocsSourceTargetResolver } from "./source-targets";

/**
 * Typography for grouped docs nav section labels (regular weight, muted).
 * Use **OpenDetail** (capital D) in section titles when referring to the core package name.
 */
export const FUMADOCS_DOCS_NAV_SECTION_TITLE_CLASS =
  "px-3 font-normal text-[#a4a4a4] text-[13px] tracking-tight";

/** Scroll container for the left docs nav rail (`/docs` layout). */
export const FUMADOCS_DOCS_SIDEBAR_SCROLL_CLASS =
  "docs-sidebar-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-4";

type FumadocsAssistantSidebarBaseProps = Omit<
  AssistantSidebarShellProps,
  "renderSourceLink" | "resolveSourceTarget"
>;

export interface FumadocsAssistantSidebarProps
  extends FumadocsAssistantSidebarBaseProps {
  children?: ReactNode;
  knownSourcePageUrls: readonly string[];
}

export const FumadocsAssistantSidebar = ({
  children,
  knownSourcePageUrls,
  ...props
}: FumadocsAssistantSidebarProps) => {
  const resolveSourceTarget = useMemo(
    () => createFumadocsSourceTargetResolver(knownSourcePageUrls),
    [knownSourcePageUrls]
  );

  return (
    <AssistantSidebarShell
      renderSourceLink={renderNextSourceLink}
      resolveSourceTarget={resolveSourceTarget}
      {...props}
    >
      {children}
    </AssistantSidebarShell>
  );
};
