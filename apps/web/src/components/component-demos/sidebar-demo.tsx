"use client";

import { createFumadocsSourceTargetResolver } from "opendetail-fumadocs";
import { renderNextSourceLink } from "opendetail-next/link";
import { AssistantSidebarShell } from "opendetail-react";
import { useMemo } from "react";

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

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col">
      <AssistantSidebarShell
        className="h-full min-h-0 flex-1"
        defaultOpen
        embedded
        embeddedLayout="dock"
        endpoint="/api/opendetail"
        hotkeyEnabled={false}
        persistence={{
          key: "opendetail-web-docs-sidebar-demo",
          storage: "session",
        }}
        promptSuggestions={PROMPT_SUGGESTIONS}
        renderSourceLink={renderNextSourceLink}
        resolveSourceTarget={resolveSourceTarget}
        sitePaths={["/docs", "/components"]}
      />
    </div>
  );
};
