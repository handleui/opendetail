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

/** Full `AssistantSidebar` docked to the right edge of the preview: left stroke only, collapse + reopen. */
export const SidebarDemo = ({
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
        key: "opendetail-web-docs-sidebar-demo",
        storage: "session" as const,
      },
      sitePaths: ["/docs", "/components"],
    }),
    []
  );

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col">
      <AssistantSidebar
        className="h-full min-h-0 flex-1"
        connection={connection}
        defaultOpen
        embedded
        embeddedLayout="dock"
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
