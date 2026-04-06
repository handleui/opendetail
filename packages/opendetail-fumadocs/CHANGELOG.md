# opendetail-fumadocs

## 1.0.0

### Major Changes

- f3310df: - **Breaking:** Remove compatibility exports and deprecated components. Public API uses **`Composer`**, **`Thread`**, **`UserMessage`**, **`AssistantMessage`**, **`ConversationLayout`**, and **`AssistantSidebar`** with **`connection`** only—no **`AssistantShell`**, **`AssistantSidebarShell`**, **`AssistantError`**, **`AssistantInput`**, **`AssistantResponse`**, **`AssistantThread`**, **`AssistantUserMessage`**, or **`AssistantLoader`** aliases.
  - **`FumadocsAssistant`** now wraps **`AssistantSidebar`** with **`connection`** (same props as before: `endpoint`, `persistence`, `sitePaths`, `transport`).

### Patch Changes

- Updated dependencies [f3310df]
- Updated dependencies [f3310df]
- Updated dependencies [f3310df]
  - opendetail-react@1.0.0
  - opendetail-next@0.6.1

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

### Patch Changes

- Updated dependencies [2487c00]
  - opendetail-react@0.6.0
  - opendetail-next@0.6.0

## 0.5.0

### Minor Changes

- b9db517: Split OpenDetail into dedicated core, React, Next, and Fumadocs packages, and move the package family to those new public entrypoints.

  This release also hardens the public boundaries:

  - sanitize public runtime and provider errors
  - tighten citation and source-link safety
  - add dedicated Next and Fumadocs adapter packages
  - update setup/docs flows for the split package model

### Patch Changes

- Updated dependencies [b9db517]
  - opendetail-react@0.5.0
  - opendetail-next@0.5.0
