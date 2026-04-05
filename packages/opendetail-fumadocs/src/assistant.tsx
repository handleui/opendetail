"use client";

import { renderNextSourceLink } from "opendetail-next/link";
import {
  AssistantSidebarShell,
  type AssistantSidebarShellProps,
} from "opendetail-react";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { createFumadocsSourceTargetResolver } from "./source-targets";

type FumadocsAssistantBaseProps = Omit<
  AssistantSidebarShellProps,
  "renderSourceLink" | "resolveSourceTarget"
>;

export interface FumadocsAssistantProps extends FumadocsAssistantBaseProps {
  children?: ReactNode;
  knownSourcePageUrls: readonly string[];
}

/**
 * Fumadocs integration for the **page assistant** (AI panel + optional nav/main slots): wires
 * `renderNextSourceLink` and a URL allowlist so assistant “source” links resolve to safe in-app
 * routes or HTTPS. This is **not** your site’s primary navigation — put that in the app (e.g.
 * `apps/web` `Sidebar`).
 */
export const FumadocsAssistant = ({
  children,
  knownSourcePageUrls,
  ...props
}: FumadocsAssistantProps) => {
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
