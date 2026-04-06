---
name: Config knowledge roadmap
overview: "Breaking hard cut: replace flat `include` + `[site_pages]` + `[site_pages_fetch]` + `[remote_resources]` with **`[[content]]` roots**, one **`[remote]`** block (OpenAI tools + prod HTML fetch), optional **`[media]`**, optional **sidecar** for asset semantics. No backward compatibility — bump **`version` in TOML** and **`OPENDETAIL_VERSION`** in code; consumers rewrite config."
todos:
  - id: schema-types-config
    content: "Implement new OpenDetailConfig + Zod + readOpenDetailConfig; bump constants version"
    status: pending
  - id: build-merge-content
    content: "Refactor build.ts to N content roots; drop site_pages-specific path"
    status: pending
  - id: runtime-remote-fetch
    content: "Map remote.fetch in artifact; update runtime.ts + site-pages.ts types"
    status: pending
  - id: sidecar-assets
    content: "Optional .opendetail/knowledge.toml parse + merge at build into chunk/image metadata"
    status: pending
  - id: cli-scaffold-docs
    content: "Update cli setup template, fixtures, apps/web opendetail.toml, docs + README"
    status: pending
isProject: false
---

# Policy: hard cut only

- **No** adapters that read old key names. **No** deprecation period in code.
- Ship a **migration note** in changelog / release notes (human text only): “replace your `opendetail.toml` with the new shape.”
- Bump **`version`** inside `opendetail.toml` (e.g. `2`) and **`OPENDETAIL_VERSION`** in [`packages/opendetail/src/constants.ts`](packages/opendetail/src/constants.ts) so invalid old files fail fast with a clear error.

---

# New config model (one page in your head)

## 1. `[[content]]` — all build-time text (replaces `include` / `base_path` / `[site_pages]`)

Use **one or more** TOML array-of-tables. Each row is a **knowledge root**: glob + `base_path` for public URLs.

**Why:** Docs, marketing, UI copy MDX are all the same primitive — **files on disk**. No separate “site page” vs “doc” product concept; chunks may still carry an internal `sourceKind` for UI if useful, but **config does not**.

Illustrative:

```toml
version = 2

[[content]]
include = ["content/docs/**/*.{md,mdx}"]
exclude = []
base_path = "/docs"

[[content]]
include = ["content/marketing/**/*.mdx"]
exclude = []
base_path = "/"
```

## 2. `[remote]` — everything “not in the repo chunk”

Single namespace; two **mechanisms** (document them as subsections — not separate top-level mysteries):

| Sub-block | Purpose |
| --- | --- |
| **`[remote.openai]`** (names TBD) | Today’s **`file_search`** / **`web_search`** — vector stores and live web. “Cloud knowledge.” |
| **`[remote.fetch]`** (names TBD) | Today’s **`site_pages_fetch`**: **HTTP GET** to a **deployed origin** + HTML strip. Same **prod URL** you ship to customers — not OpenAI, but “remote” from the build artifact. |

**Prod URL:** `origin` resolved from env (e.g. existing `OPENDETAIL_SITE_FETCH_ORIGIN`) or inline in config; **`allowed_path_prefixes`**, **`max_bytes`** as today.

**Why one `[remote]`:** Integrators learn one chapter: “remote = anything that isn’t a local MDX chunk.”

## 3. `[media]` — dead simple

- **`include` / `exclude` / `base_path`**: which static files are published and how URLs are formed (unchanged idea).
- **Rule:** Images **used in MDX** are already **context-aware** (they live next to prose and headings in the same chunk). No extra config needed for “this screenshot belongs to this doc.”

## 4. Sidecar — optional; worth it when `alt` is not enough

**File:** e.g. `.opendetail/knowledge.toml` (or `.json`), path referenced from main TOML.

**What it adds:** For specific files (by repo path or public URL), **assistant-facing** `title`, **`summary`** (when to show / what it depicts), optional **`tags`** / **`match_hints`**.

**Why bother:**

- Reused assets (same logo on 20 pages): one **canonical description** instead of repeating long `alt` everywhere.
- Marketing images where `alt` must stay short for a11y but the model needs richer grounding.
- Optional future: **non-embedded** assets (e.g. video poster, diagram only used in assistant surface).

**Without sidecar:** behavior stays as today — images flow from MDX + `[media]` resolution only.

## 5. Default model

Expose **`model`** (and related knobs if desired) at **top level** of `opendetail.toml` **or** document that runtime defaults live in code — pick one and stick to one sentence in README (“single default model story”).

---

# Affected files (implementation touch list)

**Schema and parsing**

- [`packages/opendetail/src/types.ts`](packages/opendetail/src/types.ts) — replace `OpenDetailSitePagesConfig`, fold `site_pages_fetch` into `remote`, add optional sidecar path type; adjust `OpenDetailConfig`.
- [`packages/opendetail/src/config.ts`](packages/opendetail/src/config.ts) — new Zod schema; remove old keys.
- [`packages/opendetail/src/constants.ts`](packages/opendetail/src/constants.ts) — `OPENDETAIL_VERSION` bump.
- [`packages/opendetail/src/search.ts`](packages/opendetail/src/search.ts) — artifact JSON schema for embedded `config` must match new shape.

**Build**

- [`packages/opendetail/src/build.ts`](packages/opendetail/src/build.ts) — loop **`[[content]]`** instead of `include` + `site_pages` branch; manifest hashing.
- [`packages/opendetail/src/markdown.ts`](packages/opendetail/src/markdown.ts) — per-root `base_path` (already `Pick<OpenDetailConfig, "base_path">` per extract call).

**Runtime**

- [`packages/opendetail/src/runtime.ts`](packages/opendetail/src/runtime.ts) — read `artifact.config.remote.fetch` (or final name) instead of `site_pages_fetch`.
- [`packages/opendetail/src/site-pages.ts`](packages/opendetail/src/site-pages.ts) — type imports from `types.ts`; rename config interfaces if needed.

**CLI and exports**

- [`packages/opendetail/src/cli.ts`](packages/opendetail/src/cli.ts) — `setup` generated `opendetail.toml` template.
- [`packages/opendetail/src/index.ts`](packages/opendetail/src/index.ts) — public re-exports.

**Tests and fixtures**

- [`packages/opendetail/test/config.test.ts`](packages/opendetail/test/config.test.ts)
- [`packages/opendetail/test/build.test.ts`](packages/opendetail/test/build.test.ts) (and any test referencing `site_pages`)
- [`packages/opendetail/test/fixtures/basic/opendetail.toml`](packages/opendetail/test/fixtures/basic/opendetail.toml), [`media/`](packages/opendetail/test/fixtures/media/opendetail.toml), [`mdx/`](packages/opendetail/test/fixtures/mdx/opendetail.toml)

**Docs and app**

- [`apps/web/opendetail.toml`](apps/web/opendetail.toml)
- [`apps/web/content/docs/core.mdx`](apps/web/content/docs/core.mdx), [`quickstart.mdx`](apps/web/content/docs/quickstart.mdx), [`cli/setup.mdx`](apps/web/content/docs/cli/setup.mdx), [`cli/build.mdx`](apps/web/content/docs/cli/build.mdx), [`packages.mdx`](apps/web/content/docs/packages.mdx), other docs that show TOML snippets
- [`packages/opendetail/README.md`](packages/opendetail/README.md)
- Regenerate [`apps/web/.opendetail/index.json`](apps/web/.opendetail/index.json) after content/config stabilizes

**Changelogs / cross-package mentions** (wording only unless types re-exported)

- [`packages/opendetail/CHANGELOG.md`](packages/opendetail/CHANGELOG.md), [`opendetail-next`](packages/opendetail-next/CHANGELOG.md), [`opendetail-fumadocs`](packages/opendetail-fumadocs/CHANGELOG.md), [`opendetail-react`](packages/opendetail-react/CHANGELOG.md), [`trifold`](packages/trifold/CHANGELOG.md)

---

# Execution order (when implementing)

1. Types + Zod + version bump + failing tests updated to new TOML fixtures.
2. `build.ts` multi-root + artifact `config` shape.
3. `runtime.ts` + `site-pages.ts` for renamed remote fetch block.
4. Optional sidecar parse + merge (can be a follow-up PR if scope explodes).
5. CLI template + `apps/web` + docs + index rebuild.

This plan is the contract for the hard cut; no compatibility layer.
