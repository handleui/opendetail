# opendetail

`opendetail` turns your Markdown and MDX docs into a small, grounded assistant for your app.

Under the hood, it uses the OpenAI Responses API. The product value is not a new agent runtime. It is a faster setup path, a grounded retrieval flow, and a cleaner integration surface than wiring that stack by hand.

## Why use it

- Keep answers tied to your own documentation
- Use your existing `.md` and `.mdx` files
- Start with one build command and one setup flow
- Choose between self-hosted and hosted integration scaffolding
- Ship a server-only route without building the retrieval layer yourself

## Integration modes

| Mode | What you manage | Best for | Current status |
| --- | --- | --- | --- |
| `self-hosted` | Your route, your `OPENAI_API_KEY`, your runtime | Private docs, server-owned deployments, full control | Fully implemented |
| `hosted` | Your docs index and client transport config | Fast setup and future OpenDetail-managed delivery | Documented and scaffolded in this phase |

## Quick start

Install the package:

```bash
npm i opendetail
```

Bootstrap the current self-hosted path with one command:

```bash
bunx opendetail setup --with-media
```

That command can generate `opendetail.toml`, scaffold a Next.js route at
`src/app/api/opendetail/route.ts`, and build `.opendetail/index.json`.

To scaffold the hosted integration shape without generating a route:

```bash
bunx opendetail setup --integration hosted
```

That flow still writes `opendetail.toml` and builds `.opendetail/index.json`, but it skips route generation and points you at the transport env contract instead.

If you prefer manual setup, create `opendetail.toml` in your app root:

```toml
version = 1
include = ["content/**/*.{md,mdx}"]
exclude = []
base_path = "/docs"

[media]
include = ["content/**/*.{png,jpg,jpeg,webp,avif,gif,svg}"]
exclude = []
base_path = "/content-media"
```

To include remote documentation as a grounded resource at answer time, configure
optional remote resources powered by the OpenAI Responses API tools:

```toml
[remote_resources.file_search]
vector_store_ids = ["vs_123"]
max_num_results = 8

[remote_resources.web_search]
allowed_domains = ["platform.openai.com", "docs.example.com"]
search_context_size = "low"
```

Build the index:

```bash
bunx opendetail build
```

## Next.js self-hosted

Add a Route Handler with the thin setup helper:

```ts
import { createNextRoute } from "opendetail/next";

export const { POST, runtime } = createNextRoute();
```

Or wire it manually:

```ts
import { createNextRouteHandler } from "opendetail/next";

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

## Hosted integration

Hosted mode is intentionally small in this phase.

- It does not create an app route.
- It keeps the same request shape: `{ "question": "..." }`
- It keeps the same NDJSON stream events: `meta`, `sources`, `images`, `delta`, `done`, `error`
- It expects your app to read `OPENDETAIL_ENDPOINT` and pass it into the client or hook transport
- It can optionally send `OPENDETAIL_AUTH_TOKEN` through `transport.headers` if your hosted endpoint requires auth

This phase documents and scaffolds the hosted path. It does not yet ship the OpenDetail-managed proxy backend itself.

With the registry transport and hook, the intended hosted setup shape is:

```ts
import { useOpenDetail } from "@/registry/hooks/use-opendetail/use-opendetail";

const endpoint = process.env.NEXT_PUBLIC_OPENDETAIL_ENDPOINT;
const authToken = process.env.NEXT_PUBLIC_OPENDETAIL_AUTH_TOKEN;

const assistant = useOpenDetail({
  transport: {
    endpoint,
    headers: authToken
      ? {
          authorization: `Bearer ${authToken}`,
        }
      : undefined,
  },
});
```

## Core API

If you want to use the runtime directly:

```ts
import { createOpenDetail } from "opendetail";

const assistant = createOpenDetail();

const result = await assistant.answer({
  question: "How do I configure base_path?",
});
```

To provide persistent behavior guidance for the assistant, add `OPENDETAIL.md`
in one of these locations:

1. `.opendetail/OPENDETAIL.md` (preferred)
2. `OPENDETAIL.md` at the project root (fallback)

You can also pass `assistantInstructions` or `assistantInstructionsPath` to
`createOpenDetail` for explicit control.

The result includes grounded image metadata in `result.images` when the matched
docs contain supported image references. `image.sourceIds` map back to the
entries in `result.sources`.

Supported image references:

- `http://` and `https://` URLs are returned as-is
- root-relative `/...` URLs are returned as-is
- local relative paths such as `./hero.png` are returned only when `[media]` is configured
- unsupported absolute schemes and protocol-relative URLs are ignored

When `remote_resources` is configured, `opendetail` adds Responses API tools to
retrieve external sources at runtime:

- `file_search` for semantic retrieval from OpenAI vector stores
- `web_search` for live remote pages, optionally domain-constrained

Remote citations are added to `result.sources` with `kind: "remote"` so they
can be rendered alongside local doc sources.

The runtime returns at most 3 images per answer or stream.

## CLI

The package ships with a setup-focused CLI:

```bash
# scaffold config + route + index
bunx opendetail setup --with-media

# scaffold config + index for hosted integration
bunx opendetail setup --integration hosted

# rebuild index when content changes
bunx opendetail build

# run setup diagnostics
bunx opendetail doctor

# run hosted diagnostics
bunx opendetail doctor --integration hosted
```

Useful setup flags:

- `--integration <self-hosted|hosted>`: choose the integration scaffolding mode
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
- `OPENAI_API_KEY` set at runtime for `self-hosted`
- `OPENDETAIL_ENDPOINT` set in your app environment for `hosted`
- Node runtime for Next.js route handlers in `self-hosted`

## Publishing

The package is set up so `npm publish` builds the distributable automatically through `prepack` and runs package checks through `prepublishOnly`.
