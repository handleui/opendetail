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

/**
 * Same assistant surface as the site: `AssistantSidebarShell` + live `/api/opendetail`.
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

  return (
    <div className="docs-shell-embed-demo flex h-full min-h-0 w-full flex-1 flex-col">
      <AssistantSidebarShell
        className="min-h-0 flex-1"
        defaultOpen
        embedded
        embeddedHideCollapse
        embeddedLayout="compact"
        endpoint="/api/opendetail"
        hotkeyEnabled={false}
        persistence={{
          key: "opendetail-web-docs-shell-demo",
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
