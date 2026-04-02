# opendetail

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
