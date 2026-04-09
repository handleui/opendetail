---
"opendetail": minor
"opendetail-client": patch
"opendetail-next": minor
"opendetail-react": major
---

Restructure OpenDetail around clearer adoption paths and package boundaries.

- Add `opendetail-client` as the framework-agnostic NDJSON transport package.
- Rework `opendetail-react` so it owns React hooks, components, and styles only. `createOpenDetailClient` now lives in `opendetail-client`.
- Simplify `opendetail-next` so it focuses on the Next.js route adapter and link helpers without depending on `opendetail-react`.
- Redesign the CLI around `setup --mode fastest|branded|headless`, semantic `doctor`, and the new `verify` command.
- Rewrite the docs around the Fastest / Branded / Headless adoption model.
- Harden public surfaces by tightening source-link safety, removing third-party favicon lookups from the default sources UI, marking interrupted responses correctly, and adding a request-size guard to the Next.js handler.
