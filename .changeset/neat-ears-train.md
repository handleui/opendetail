---
"opendetail": minor
---

Add a broader `0.3.0` release for `opendetail` built from the work landed after `0.2.0`.

- Add a setup-focused CLI with `opendetail setup` and `opendetail doctor`, including interactive scaffolding for self-hosted and hosted integrations, config generation, optional Next.js route generation, and index building.
- Add `createNextRoute` plus a clearer self-hosted and hosted integration story in the package surface and docs.
- Add project-specific assistant instructions through `assistantInstructions`, `assistantInstructionsPath`, `.opendetail/OPENDETAIL.md`, or `OPENDETAIL.md`, and enable prompt cache controls in the runtime.
- Add optional `remote_resources` support for Responses API `file_search` and `web_search`, and surface remote citations in `sources` with `kind: "remote"`.
- Expand grounded media support and improve structured error handling so route responses and stream errors include richer provider details such as `param`, `providerCode`, `requestId`, `status`, and `retryable`.
