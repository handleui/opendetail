"use client";

import { createFumadocsSourceTargetResolver } from "opendetail-fumadocs";
import { renderNextSourceLink } from "opendetail-next/link";
import { AssistantSidebar } from "opendetail-react";
import { useMemo, useState } from "react";

const PROMPT_SUGGESTIONS = [
  "What's OpenDetail?",
  "How do I integrate the React package?",
  "What is NDJSON streaming?",
] as const;

/**
 * Same assistant surface as the site: `AssistantSidebar` with `connection` + live `/api/opendetail`.
 * `knownSourcePageUrls` must be passed from a Server Component (see `known-source-page-urls.ts`)
 * so this file stays client-safe (no `node:fs` in the bundle).
 */
export const ShellDemo = ({
  knownSourcePageUrls,
}: {
  knownSourcePageUrls: readonly string[];
}) => {
  const resolveSourceTarget = useMemo(
    () => createFumadocsSourceTargetResolver(knownSourcePageUrls),
    [knownSourcePageUrls]
  );

  const [sidebarWidthPx, setSidebarWidthPx] = useState<number | undefined>(
    undefined
  );

  const connection = useMemo(
    () => ({
      endpoint: "/api/opendetail",
      persistence: {
        key: "opendetail-web-docs-shell-demo",
        storage: "session" as const,
      },
      sitePaths: [
        "/docs",
        "/ui",
        "/docs/hooks/use-opendetail",
        "/docs/hooks/create-open-detail-client",
      ],
    }),
    []
  );

  return (
    <div className="docs-shell-embed-demo flex h-full min-h-0 w-full flex-1 flex-col">
      <AssistantSidebar
        className="min-h-0 flex-1"
        connection={connection}
        defaultOpen
        embedded
        embeddedHideCollapse
        embeddedLayout="compact"
        hotkeyEnabled={false}
        onSidebarWidthChange={setSidebarWidthPx}
        promptSuggestions={PROMPT_SUGGESTIONS}
        renderSourceLink={renderNextSourceLink}
        resolveSourceTarget={resolveSourceTarget}
        sidebarResizeEnabled
        sidebarWidthPx={sidebarWidthPx}
      />
    </div>
  );
};
