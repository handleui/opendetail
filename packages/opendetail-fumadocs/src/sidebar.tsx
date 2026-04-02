"use client";

import { renderNextSourceLink } from "opendetail-next/link";
import {
  AssistantSidebarShell,
  type AssistantSidebarShellProps,
} from "opendetail-react";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { createFumadocsSourceTargetResolver } from "./source-targets";

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
