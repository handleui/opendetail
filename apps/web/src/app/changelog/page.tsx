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
      <ChangelogEntry date="5 Apr 2026" version="v0.5.0">
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
            Stricter validation for remote tool definitions in hosted mode.
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
          <strong>opendetail setup</strong> can scaffold self-hosted and
          hosted-shaped configs, with flags for base path, include globs, and
          optional media. <strong>opendetail doctor</strong> checks binary,
          config, and route wiring before you ship.
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
