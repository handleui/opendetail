"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import { renderFumadocsSourceLink } from "@/components/opendetail-source-link";
import { createFumadocsSourceTargetResolver } from "@/lib/opendetail-source-links";
import {
  AssistantSidebarShell,
  type AssistantSidebarShellProps,
} from "@/registry/blocks/assistant-sidebar-shell/assistant-sidebar-shell";

type SiteAssistantSidebarBaseProps = Omit<
  AssistantSidebarShellProps,
  "renderSourceLink" | "resolveSourceTarget"
>;

export interface SiteAssistantSidebarProps
  extends SiteAssistantSidebarBaseProps {
  children?: ReactNode;
  knownSourcePageUrls: string[];
}

export const SiteAssistantSidebar = ({
  children,
  knownSourcePageUrls,
  ...props
}: SiteAssistantSidebarProps) => {
  const resolveSourceTarget = useMemo(
    () => createFumadocsSourceTargetResolver(knownSourcePageUrls),
    [knownSourcePageUrls]
  );

  return (
    <AssistantSidebarShell
      renderSourceLink={renderFumadocsSourceLink}
      resolveSourceTarget={resolveSourceTarget}
      {...props}
    >
      {children}
    </AssistantSidebarShell>
  );
};
