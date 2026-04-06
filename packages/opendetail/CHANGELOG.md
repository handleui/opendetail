# opendetail

## Unreleased

### Breaking Changes

- **`opendetail.toml` must use `version = 1`**. Per-content URL prefixes are renamed from **`base_path`** to **`public_path`** on each **`[[content]]`** row and on **`[media]`**.
- OpenAI remote tools use a single **`[fetch]`** namespace: **`[fetch.file_search]`** and **`[fetch.web_search]`**. The old **`[remote]`** / **`remote.openai`** / same-origin **`[remote.fetch]`** HTML feature is removed — use **`fetch`** and scope **`web_search`** with **`allowed_domains`** instead.
- **`createOpenDetail({ remote })`** is **`createOpenDetail({ fetch })`** (matches the TOML shape).
- **Index artifacts** use **`version: 1`** in JSON; rebuild with `opendetail build`.
- **`opendetail-next`**: `resolveSiteFetchOrigin`, `OPENDETAIL_SITE_FETCH_ORIGIN`, and passing **`siteFetchOrigin`** into the runtime are removed (config **`version`** in TOML / artifacts is **`1`** for the current schema).
- Optional **`knowledge`** path in TOML points to a sidecar TOML (for example `.opendetail/knowledge.toml`) with **`[[asset]]`** entries (`url` or `path`, optional `title` / `summary`) merged into chunk images at build time.

## 0.6.0

### Minor Changes

- 2487c00: ### `opendetail`

  - **Site pages in the index**: Optional `site_pages` globs ingest additional MDX/Markdown files as `sourceKind: "page"` chunks alongside doc chunks; the build merges them into the artifact manifest and includes them in the index hash.
  - **Runtime site fetch**: Optional `site_pages_fetch` configures same-origin HTML fetch (allowlisted paths, size limits, caching, title/text extraction) so answers can use live marketing or app pages when `siteFetchOrigin` is provided server-side.
  - **Config & validation**: Zod-backed `site_pages` / `site_pages_fetch` parsing, path normalization helpers, and expanded public types/exports for the new surfaces.
  - **CLI & errors**: CLI invocation handling and public error shapes updated in line with stricter validation and new options.

  ### `opendetail-react`

  - **Assistant sidebar**: Large refresh—mobile **Trifold**-style multi-column layout, resizable sidebar, nested nav rail behavior, embed/reopen affordances, and updated `AssistantSidebarShell` integration.
  - **UI**: Reworked `AssistantInput`, richer `AssistantResponse` / sources (including new **suggestions** UI), and substantial `opendetail-base.css` theme updates.
  - **Client**: `useOpenDetail` and `createOpenDetailClient` adjusted for the new streaming/client behavior.

  ### `opendetail-next`

  - **Route handler**: Lazy, deduplicated assistant initialization (`createAssistantLoader`); in production, failed init is cached to avoid hammering the provider.
  - **Site fetch origin**: `resolveSiteFetchOrigin` option (and env / static fallbacks) passes `siteFetchOrigin` into the runtime so server-side site page fetch can target the public origin behind proxies.
  - **HTTP behavior**: POST-only handler with consistent JSON error payloads (including provider-oriented fields) and safe response headers.

  ### `opendetail-fumadocs`

  - **Rename & entrypoint**: `FumadocsAssistantSidebar` is now **`FumadocsAssistant`** (`FumadocsAssistantProps`); import from **`opendetail-fumadocs/assistant`** (replaces the previous sidebar entry). Root package exports remain source-target helpers only.

  ### `trifold`

  - **`trifold` package**: Parallel column layout primitives (`Trifold`, `ParallelTrack`, `ScrollPanels`), gesture math for drag/snapping, and related types—used by the updated assistant sidebar shell.

## 0.5.0

### Minor Changes

- b9db517: Split OpenDetail into dedicated core, React, Next, and Fumadocs packages, and move the package family to those new public entrypoints.

  This release also hardens the public boundaries:

  - sanitize public runtime and provider errors
  - tighten citation and source-link safety
  - add dedicated Next and Fumadocs adapter packages
  - update setup/docs flows for the split package model

## 0.4.0

### Minor Changes

- Add a broader `0.4.0` release for `opendetail` based on the work landed after `0.3.0`.

  - Improve undocumented-answer handling in the runtime. When no local docs match, `opendetail` now still asks the model for a short docs-status response instead of returning a fixed fallback string, and the prompt explicitly tells the model to say the topic is not documented rather than inventing support details.
  - Expand the assistant registry UI with richer shell patterns and input behavior. The shipped registry now includes a full-screen modal flow, a sidebar shell wired to `useOpenDetail`, a more capable multiline composer, and refreshed message styling for the sidebar and thread experiences.
  - Improve source rendering across the registry components. Assistant responses can render inline citation markers for local and remote sources, show remote favicons, keep unsupported schemes non-clickable, and support Fumadocs-aware source target resolution so citations can link directly to known docs pages.

## 0.3.0

### Minor Changes

- 577809d: Add a broader `0.3.0` release for `opendetail` built from the work landed after `0.2.0`.

  - Add a setup-focused CLI with `opendetail setup` and `opendetail doctor`, including interactive scaffolding for self-hosted and hosted integrations, config generation, optional Next.js route generation, and index building.
  - Add `createNextRoute` plus a clearer self-hosted and hosted integration story in the package surface and docs.
  - Add project-specific assistant instructions through `assistantInstructions`, `assistantInstructionsPath`, `.opendetail/OPENDETAIL.md`, or `OPENDETAIL.md`, and enable prompt cache controls in the runtime.
  - Add optional `remote_resources` support for Responses API `file_search` and `web_search`, and surface remote citations in `sources` with `kind: "remote"`.
  - Expand grounded media support and improve structured error handling so route responses and stream errors include richer provider details such as `param`, `providerCode`, `requestId`, `status`, and `retryable`.
