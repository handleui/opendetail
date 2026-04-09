# opendetail

`opendetail` turns your Markdown and MDX docs into a small, grounded assistant for your app.

Under the hood, it uses the OpenAI Responses API. The product value is not a new agent runtime. It is a faster setup path, a grounded retrieval flow, and a cleaner integration surface than wiring that stack by hand.

## Why use it

- Keep answers tied to your own documentation
- Use your existing `.md` and `.mdx` files
- Start with one build command and one setup flow
- Ship a server-only route without building the retrieval layer yourself

## Quick start

OpenDetail now centers setup around three adoption paths:

- **Fastest**: route + index + React assistant
- **Branded**: route + index + your own UI using `opendetail-client`
- **Headless**: index + runtime only

Typical installs:

```bash
# Fastest
npm i opendetail opendetail-next opendetail-react

# Branded
npm i opendetail opendetail-next opendetail-client

# Headless
npm i opendetail
```

Bootstrap the path you want:

```bash
bunx opendetail setup --mode fastest --with-media
bunx opendetail setup --mode branded --with-media
bunx opendetail setup --mode headless
```

Setup writes `opendetail.toml`, can scaffold a Next.js route at
`src/app/api/opendetail/route.ts`, and can build `.opendetail/index.json`.

If you prefer manual setup, create `opendetail.toml` in your app root:

```toml
version = 1

[[content]]
include = ["content/**/*.{md,mdx}"]
exclude = []
public_path = "/docs"

[media]
include = ["content/**/*.{png,jpg,jpeg,webp,avif,gif,svg}"]
exclude = []
public_path = "/content-media"
```

Use **multiple `[[content]]` rows** when you index more than one MDX tree (for example docs under `/docs` and marketing under `/`). Each row sets its own `public_path` — the URL prefix where those pages are served.

To include OpenAI vector stores or live web search at answer time, configure optional Responses API tools under **`[fetch]`**:

```toml
[fetch.file_search]
vector_store_ids = ["vs_123"]
max_num_results = 8

[fetch.web_search]
allowed_domains = ["opendetail.dev", "platform.openai.com"]
search_context_size = "low"
```

There is no built-in same-origin HTML scrape; scope **`web_search`** with **`allowed_domains`** (for example your production site) instead.

Build the index:

```bash
bunx opendetail build
```

## Next.js self-hosted

Add a Route Handler with the thin setup helper:

```ts
import { createNextRoute } from "opendetail-next";

export const { POST, runtime } = createNextRoute();
```

Or wire it manually:

```ts
import { createNextRouteHandler } from "opendetail-next";

export const runtime = "nodejs";
export const POST = createNextRouteHandler();
```

Send a request like this:

```json
{ "question": "How do I install this?" }
```

The route streams NDJSON events:

- `meta`
- `sources`
- `images`
- `delta`
- `done`
- `error`

Before starting your app, set `OPENAI_API_KEY` in the app runtime environment.
If setup fails before streaming starts, the Next.js adapter returns JSON shaped
like `{ error, code, retryable }`.

When a stream fails after it starts, the `error` event includes:

- `message`
- `code`
- `retryable`

## Core API

If you want to use the runtime directly:

```ts
import { createOpenDetail } from "opendetail";

const assistant = createOpenDetail();

const result = await assistant.answer({
  question: "How do I configure public_path?",
});
```

To provide persistent behavior guidance for the assistant, add `OPENDETAIL.md`
in one of these locations:

1. `.opendetail/OPENDETAIL.md` (preferred)
2. `OPENDETAIL.md` at the project root (fallback)

You can also pass `assistantInstructions` or `assistantInstructionsPath` to
`createOpenDetail` for explicit control.

### Harness vs project instructions

OpenAI’s Responses API uses a top-level **`instructions`** string (behavior) and
**`input`** (the user prompt plus retrieved context). OpenDetail merges two layers
into **`instructions`** before calling the API:

| Layer | Where it lives | What to put there |
| --- | --- | --- |
| **Harness** | Built into the runtime | Stable rules: informational assistant identity, grounding, citations, tool usage. Same for every integration. |
| **Project** | `OPENDETAIL.md` or `assistantInstructions*` | Product voice, priorities, vocabulary, support policy — short and specific; avoid copying the entire harness. |

Per-request **`input`** contains the `Sources:` block, an indexed-match flag, and
the user question — not your project file.

The result includes grounded image metadata in `result.images` when the matched
docs contain supported image references. `image.sourceIds` map back to the
entries in `result.sources`.

Supported image references:

- `http://` and `https://` URLs are returned as-is
- root-relative `/...` URLs are returned as-is
- local relative paths such as `./hero.png` are returned only when `[media]` is configured
- unsupported absolute schemes and protocol-relative URLs are ignored

When `[fetch]` / `fetch` is configured, `opendetail` adds Responses API tools to
retrieve external sources at runtime:

- `file_search` for semantic retrieval from OpenAI vector stores
- `web_search` for live remote pages, optionally domain-constrained

Remote citations are added to `result.sources` with `kind: "remote"` so they
can be rendered alongside local doc sources.

The runtime returns at most 3 images per answer or stream.

## CLI

The package ships with a setup-focused CLI:

```bash
# scaffold config, optional route, and index using an adoption path
bunx opendetail setup --mode fastest

# rebuild index when content changes
bunx opendetail build

# run semantic setup diagnostics
bunx opendetail doctor

# verify structure or a live stream endpoint
bunx opendetail verify
```

Useful setup flags:

- `--mode <fastest|branded|headless>`: choose the adoption path first
- `--cwd <path>`: advanced use for monorepos; most apps run this from project root
- `--route <path>`: choose a custom Next.js route file
- `--base-path <url>`: set generated source URL base path
- `--skip-build`: scaffold files without generating the index
- `--force`: overwrite existing scaffold files
- `--interactive` / `--no-interactive`: enable or skip the setup wizard prompts

Most repos can run commands directly from the app root as `bunx opendetail <command>`.
Each command prints `Opendetail v<version>` so logs show exactly which CLI version ran.

## How it works

`opendetail` follows a simple build-time and request-time flow.

### 1. Build time

- Read the files matched by `opendetail.toml`
- Optionally map referenced local media files to public URLs
- Parse Markdown and MDX content
- Split content by heading sections
- Create a local JSON index at `.opendetail/index.json`

### 2. Request time

- Load the local index into memory
- Search it with lexical matching
- Select the most relevant chunks
- Send those chunks to the model, optionally with configured remote retrieval tools
- Return an answer with citations

This keeps the runtime simple and avoids external search infrastructure in the default path.

## Default runtime settings

- model: `gpt-5.4-mini`
- reasoning: `none`
- verbosity: `low`
- prompt cache retention: `in_memory` (Responses API prompt caching enabled)

## Requirements

- Node.js 18 or newer
- `OPENAI_API_KEY` set at runtime
- Node runtime for Next.js route handlers

## Publishing

The package is set up so `npm publish` builds the distributable automatically through `prepack` and runs package checks through `prepublishOnly`.
