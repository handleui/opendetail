import type { Metadata } from "next";

import {
  ChangelogChanges,
  ChangelogEntry,
  ChangelogListItem,
  ChangelogParagraph,
  ChangelogSectionTitle,
  ChangelogTitle,
} from "@/components/changelog/changelog-entry";

export const metadata: Metadata = {
  title: "Changelog",
  description: "Release history for OpenDetail.",
};

export default function ChangelogPage() {
  return (
    <div className="w-full pb-12 tracking-tight">
      <ChangelogEntry date="9 Apr 2026" version="v0.8.0">
        <ChangelogTitle>
          Path-based setup and cleaner package boundaries
        </ChangelogTitle>
        <ChangelogSectionTitle>Setup</ChangelogSectionTitle>
        <ChangelogParagraph>
          OpenDetail now explains adoption through three paths:{" "}
          <strong>Fastest</strong>, <strong>Branded</strong>, and{" "}
          <strong>Headless</strong>. The CLI follows the same model with a
          mode-first setup flow, a more useful <strong>doctor</strong>, and a
          new <strong>verify</strong> command for semantic checks and optional
          live NDJSON validation.
        </ChangelogParagraph>
        <ChangelogSectionTitle>Packages</ChangelogSectionTitle>
        <ChangelogParagraph>
          The transport layer now lives in a dedicated{" "}
          <strong>opendetail-client</strong> package.{" "}
          <strong>opendetail-react</strong> is React-only, and{" "}
          <strong>opendetail-next</strong> stays focused on the Next.js route
          adapter and link helpers without pulling in the React package.
        </ChangelogParagraph>
        <ChangelogSectionTitle>Hardening</ChangelogSectionTitle>
        <ChangelogParagraph>
          This release also closes a few rough edges in the public surface:
          safer citation URL handling, interrupted responses that no longer look
          complete, no third-party favicon requests in the default sources UI,
          and an early request-size guard in the Next.js POST handler.
        </ChangelogParagraph>
        <ChangelogChanges>
          <ChangelogListItem>
            Added{" "}
            <code className="rounded-md bg-neutral-100 px-1.5 py-0.5 font-mono font-normal text-[13px] text-neutral-900 tracking-tight">
              opendetail-client
            </code>{" "}
            for framework-agnostic NDJSON transport.
          </ChangelogListItem>
          <ChangelogListItem>
            Documentation now leads with the <em>Fastest</em>, <em>Branded</em>,
            and <em>Headless</em> model instead of package-first onboarding.
          </ChangelogListItem>
          <ChangelogListItem>
            Source links reject whitespace-prefixed unsafe schemes, and the
            default sources UI keeps remote hosts private by avoiding
            third-party favicon lookups.
          </ChangelogListItem>
        </ChangelogChanges>
      </ChangelogEntry>

      <ChangelogEntry date="6 Apr 2026" version="v1.0.0">
        <ChangelogTitle>Stable component API</ChangelogTitle>
        <ChangelogSectionTitle>opendetail-react</ChangelogSectionTitle>
        <ChangelogParagraph>
          The component surface is now stable. Legacy aliases (
          <strong>AssistantShell</strong>,{" "}
          <strong>AssistantSidebarShell</strong>,{" "}
          <strong>AssistantError</strong>, <strong>AssistantInput</strong>,{" "}
          <strong>AssistantResponse</strong>, <strong>AssistantThread</strong>,{" "}
          <strong>AssistantUserMessage</strong>,{" "}
          <strong>AssistantLoader</strong>) are removed. The public API uses{" "}
          <strong>ConversationLayout</strong>, <strong>AssistantSidebar</strong>{" "}
          (with a <em>connection</em> prop), <strong>Composer</strong>,{" "}
          <strong>Thread</strong>, <strong>UserMessage</strong>, and{" "}
          <strong>AssistantMessage</strong>.
        </ChangelogParagraph>
        <ChangelogSectionTitle>opendetail-fumadocs</ChangelogSectionTitle>
        <ChangelogParagraph>
          <strong>FumadocsAssistant</strong> now wraps{" "}
          <strong>AssistantSidebar</strong> with a <em>connection</em> prop—the
          same <em>endpoint</em>, <em>persistence</em>, <em>sitePaths</em>, and{" "}
          <em>transport</em> props as before, wired through the stable
          connection shape.
        </ChangelogParagraph>
        <ChangelogChanges>
          <ChangelogListItem>
            Protocol-relative source URLs (
            <code className="rounded-md bg-neutral-100 px-1.5 py-0.5 font-mono font-normal text-[13px] text-neutral-900 tracking-tight">
              {"//host/…"}
            </code>
            ) are rejected in citation helpers so local-path links cannot
            navigate off-site.
          </ChangelogListItem>
          <ChangelogListItem>
            Stable{" "}
            <code className="rounded-md bg-neutral-100 px-1.5 py-0.5 font-mono font-normal text-[13px] text-neutral-900 tracking-tight">
              useOpenDetail
            </code>{" "}
            callbacks (<em>clearThread</em>, <em>stop</em>, <em>submit</em>) via
            ref indirection; sidebar and modal components are fully memoized.
          </ChangelogListItem>
          <ChangelogListItem>
            Styles split into <em>systems</em> and <em>themes</em>{" "}
            sub-directories; root <em>opendetail-*.css</em> imports stay stable.
          </ChangelogListItem>
        </ChangelogChanges>
      </ChangelogEntry>

      <ChangelogEntry date="6 Apr 2026" version="v0.6.0">
        <ChangelogTitle>Trifold sidebar and site page indexing</ChangelogTitle>
        <ChangelogSectionTitle>Build</ChangelogSectionTitle>
        <ChangelogParagraph>
          Optional <strong>site_pages</strong> globs ingest MDX and Markdown
          files (marketing pages, app shell content) as{" "}
          <em>sourceKind: "page"</em> chunks alongside doc chunks. They are
          merged into the artifact manifest and included in the index hash, so
          incremental rebuilds stay correct.
        </ChangelogParagraph>
        <ChangelogSectionTitle>Assistant UI</ChangelogSectionTitle>
        <ChangelogParagraph>
          Large sidebar refresh built on the new <strong>trifold</strong>{" "}
          package — mobile multi-column layout with drag-to-snap gestures, a
          resizable desktop sidebar, nested nav rail behavior, embed/reopen
          affordances, reworked <strong>Composer</strong> input, richer source
          rendering with <strong>suggestions</strong>, and an updated{" "}
          <em>opendetail-base.css</em> theme.
        </ChangelogParagraph>
        <ChangelogSectionTitle>Next.js adapter</ChangelogSectionTitle>
        <ChangelogParagraph>
          Lazy, deduplicated assistant initialization via{" "}
          <strong>createAssistantLoader</strong>. Failed initialization is
          cached in production to avoid hammering the provider. Route handler is
          POST-only with consistent JSON error payloads and safe response
          headers.
        </ChangelogParagraph>
        <ChangelogChanges>
          <ChangelogListItem>
            <strong>trifold</strong> package published: parallel column layout
            primitives (<em>Trifold</em>, <em>ParallelTrack</em>,{" "}
            <em>ScrollPanels</em>), gesture math for drag/snapping.
          </ChangelogListItem>
          <ChangelogListItem>
            <strong>FumadocsAssistantSidebar</strong> renamed to{" "}
            <strong>FumadocsAssistant</strong>; import from{" "}
            <code className="rounded-md bg-neutral-100 px-1.5 py-0.5 font-mono font-normal text-[13px] text-neutral-900 tracking-tight">
              opendetail-fumadocs/assistant
            </code>
            .
          </ChangelogListItem>
          <ChangelogListItem>
            Zod-backed config validation for <em>site_pages</em> /{" "}
            <em>site_pages_fetch</em> with path normalization and expanded
            public type exports.
          </ChangelogListItem>
        </ChangelogChanges>
      </ChangelogEntry>

      <ChangelogEntry date="2 Apr 2026" version="v0.5.0">
        <ChangelogTitle>Docs index and streaming UX</ChangelogTitle>
        <ChangelogSectionTitle>Build output</ChangelogSectionTitle>
        <ChangelogParagraph>
          The CLI now writes a single machine-readable{" "}
          <strong>index.json</strong> under <em>.opendetail</em>, so your app
          can load chunks for lexical search without a separate database. Paths
          stay stable across builds when content hashes do not change.
        </ChangelogParagraph>
        <ChangelogSectionTitle>Assistant</ChangelogSectionTitle>
        <ChangelogParagraph>
          The sidebar assistant accepts streamed NDJSON (text, sources, images)
          so the UI can render incrementally. Known doc URLs are passed through
          for safe <strong>source links</strong> in Fumadocs-style layouts.
        </ChangelogParagraph>
        <ChangelogChanges>
          <ChangelogListItem>
            Stricter validation for remote tool definitions.
          </ChangelogListItem>
          <ChangelogListItem>
            Clearer errors when the index file is missing or out of date.
          </ChangelogListItem>
          <ChangelogListItem>
            Minor CSS fixes for the input surface on small viewports.
          </ChangelogListItem>
        </ChangelogChanges>
      </ChangelogEntry>

      <ChangelogEntry date="12 Mar 2026" version="v0.4.0">
        <ChangelogTitle>CLI quickstart and configuration</ChangelogTitle>
        <ChangelogParagraph>
          <strong>opendetail setup</strong> scaffolds config, route, and initial
          index, with flags for base path, include globs, and optional media.{" "}
          <strong>opendetail doctor</strong> checks binary, config, and route
          wiring before you ship.
        </ChangelogParagraph>
        <ChangelogChanges title="Changes">
          <ChangelogListItem>
            Documented configuration fields in the docs site.
          </ChangelogListItem>
          <ChangelogListItem>
            Improved progress output during{" "}
            <code className="rounded-md bg-neutral-100 px-1.5 py-0.5 font-mono font-normal text-[13px] text-neutral-900 tracking-tight">
              opendetail build
            </code>
            .
          </ChangelogListItem>
        </ChangelogChanges>
      </ChangelogEntry>
    </div>
  );
}
