"use client";

import { renderNextSourceLink } from "opendetail-next/link";
import {
  AssistantSidebar,
  type AssistantSidebarProps,
  type UseOpenDetailOptions,
} from "opendetail-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { createFumadocsSourceTargetResolver } from "./source-targets";

type FumadocsAssistantBaseProps = Omit<
  AssistantSidebarProps,
  "renderSourceLink" | "resolveSourceTarget" | "connection"
> & {
  endpoint?: UseOpenDetailOptions["endpoint"];
  persistence?: UseOpenDetailOptions["persistence"];
  sitePaths?: UseOpenDetailOptions["sitePaths"];
  transport?: UseOpenDetailOptions["transport"];
};

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
  endpoint,
  knownSourcePageUrls,
  persistence,
  sitePaths,
  transport,
  ...sidebarProps
}: FumadocsAssistantProps) => {
  const resolveSourceTarget = useMemo(
    () => createFumadocsSourceTargetResolver(knownSourcePageUrls),
    [knownSourcePageUrls]
  );

  const [sidebarWidthPx, setSidebarWidthPx] = useState<number | undefined>(
    undefined
  );

  const connection = useMemo(
    () => ({
      endpoint,
      persistence,
      sitePaths,
      transport,
    }),
    [endpoint, persistence, sitePaths, transport]
  );

  return (
    <AssistantSidebar
      {...sidebarProps}
      connection={connection}
      onSidebarWidthChange={setSidebarWidthPx}
      renderSourceLink={renderNextSourceLink}
      resolveSourceTarget={resolveSourceTarget}
      sidebarResizeEnabled
      sidebarWidthPx={sidebarWidthPx}
    >
      {children}
    </AssistantSidebar>
  );
};
